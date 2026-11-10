import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { eq } from 'drizzle-orm';
import {
  createFeedbackRecord,
  createProductRecord,
  deleteProductRecord,
  getProductById,
  listCategories,
  listFeedbacks,
  listOrdersAdmin,
  listOrdersForUser,
  listProducts,
  processCheckoutTransaction,
  trackOrderByNumber,
  updateOrderStatusAdmin,
  updateProductRecord,
} from './src/db/catalog.ts';
import { db } from './src/db/index.ts';
import { adminUsers } from './src/db/schema.ts';
import {
  generateAdminProductDescription,
  runStoreConciergeChat,
  type ChatTurnInput,
} from './src/lib/gemini.ts';
import {
  ADMIN_COOKIE_NAME,
  type AuthRequest,
  getJwtSecret,
  optionalFirebaseAuth,
  requireAdminAuth,
  requireFirebaseAuth,
  verifyCsrfOrigin,
} from './src/middleware/auth.ts';

const PORT = 3000;
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed.'));
      return;
    }
    cb(null, true);
  },
});

async function uploadToCloudinaryOrLocal(
  file: Express.Multer.File
): Promise<{ url: string; provider: 'cloudinary' | 'local' }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = '18aana-products';
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash('sha1')
      .update(signaturePayload)
      .digest('hex');

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    formData.append('file', blob, file.originalname);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('folder', folder);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Cloudinary upload failed: ${text}`);
    }

    const data = (await response.json()) as { secure_url: string };
    return { url: data.secure_url, provider: 'cloudinary' };
  }

  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
    ? ext
    : '.jpg';
  const fileName = `prod_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${safeExt}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  await fs.promises.writeFile(filePath, file.buffer);
  return { url: `/uploads/${fileName}`, provider: 'local' };
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, brand: '18 aana' });
  });

  // Public Storefront Endpoints
  app.get('/api/categories', async (_req, res) => {
    try {
      const data = await listCategories();
      res.json(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load categories.';
      res.status(500).json({ error: msg });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const department =
        typeof req.query.department === 'string' ? req.query.department : undefined;
      const category =
        typeof req.query.category === 'string' ? req.query.category : undefined;
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      const data = await listProducts({ department, category, search });
      res.json(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load products.';
      res.status(500).json({ error: msg });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid product ID.' });
      }
      const product = await getProductById(id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      return res.json(product);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load product.';
      return res.status(500).json({ error: msg });
    }
  });

  app.get('/api/feedback', async (_req, res) => {
    try {
      const data = await listFeedbacks();
      res.json(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load feedback.';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/feedback', async (req, res) => {
    try {
      const { name, topic, rating, message } = req.body ?? {};
      if (!name || !topic || !message || !rating) {
        return res.status(400).json({ error: 'Name, topic, rating, and message are required.' });
      }
      const created = await createFeedbackRecord({
        name: String(name),
        topic: String(topic),
        rating: Number(rating),
        message: String(message),
      });
      return res.status(201).json(created);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to submit feedback.';
      return res.status(500).json({ error: msg });
    }
  });

  // Gemini Multi-Turn Style & Shopping Concierge Chat (POST /api/chat)
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body ?? {};
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Please enter a message.' });
      }
      const cleanHistory: ChatTurnInput[] = Array.isArray(history)
        ? history
            .filter(
              (h: unknown): h is ChatTurnInput =>
                typeof h === 'object' &&
                h !== null &&
                ((h as ChatTurnInput).role === 'user' ||
                  (h as ChatTurnInput).role === 'model') &&
                typeof (h as ChatTurnInput).text === 'string'
            )
            .slice(-14)
        : [];

      const result = await runStoreConciergeChat({
        message: message.trim(),
        history: cleanHistory,
      });

      return res.json(result);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Unable to reach assistant.';
      const status = msg.includes('not configured') || msg.includes('authorized')
        ? 503
        : msg.includes('quota')
          ? 429
          : 500;
      return res.status(status).json({ error: msg });
    }
  });

  // Firebase Auth User Sync & Customer Order History
  app.post('/api/auth/sync', requireFirebaseAuth, async (req: AuthRequest, res) => {
    return res.json({
      uid: req.user?.uid,
      email: req.user?.email,
      name: req.user?.name ?? null,
      dbUserId: req.dbUserId ?? null,
    });
  });

  app.get('/api/orders/mine', requireFirebaseAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.dbUserId) {
        return res.json([]);
      }
      const list = await listOrdersForUser(req.dbUserId);
      return res.json(list);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load your orders.';
      return res.status(500).json({ error: msg });
    }
  });

  app.get('/api/orders/track/:orderNumber', async (req, res) => {
    try {
      const order = await trackOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ error: 'No order found with that order number.' });
      }
      return res.json(order);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to look up order.';
      return res.status(500).json({ error: msg });
    }
  });

  // Checkout API (POST /api/checkout)
  app.post('/api/checkout', optionalFirebaseAuth, async (req: AuthRequest, res) => {
    try {
      const {
        items,
        customerName,
        phone,
        deliveryAddress,
        city,
        paymentMethod,
        paymentReference,
      } = req.body ?? {};

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Your cart is empty.' });
      }
      if (!customerName || String(customerName).trim().length < 2) {
        return res.status(400).json({ error: 'Please enter your full name.' });
      }
      if (!phone || String(phone).trim().length < 6) {
        return res.status(400).json({ error: 'Please enter a valid phone number.' });
      }
      if (!deliveryAddress || String(deliveryAddress).trim().length < 5) {
        return res.status(400).json({ error: 'Please enter your full delivery address.' });
      }

      const normalizedCity = city === 'Outside Dhaka' ? 'Outside Dhaka' : 'Dhaka';
      const allowedPayments = ['COD', 'bKash', 'Nagad'] as const;
      if (!allowedPayments.includes(paymentMethod)) {
        return res
          .status(400)
          .json({ error: 'Payment method must be COD, bKash, or Nagad.' });
      }

      const trimmedRef = paymentReference ? String(paymentReference).trim() : '';
      if (paymentMethod !== 'COD' && trimmedRef.length < 4) {
        return res.status(400).json({
          error: `Please enter a valid ${paymentMethod} transaction ID.`,
        });
      }

      const result = await processCheckoutTransaction({
        userId: req.dbUserId ?? null,
        customerName: String(customerName),
        phone: String(phone),
        deliveryAddress: String(deliveryAddress),
        city: normalizedCity,
        paymentMethod,
        paymentReference: paymentMethod !== 'COD' ? trimmedRef : null,
        items: items.map(
          (i: {
            productId: number;
            quantity: number;
            selectedSize?: string | null;
          }) => ({
            productId: Number(i.productId),
            quantity: Number(i.quantity),
            selectedSize:
              typeof i.selectedSize === 'string' && i.selectedSize.trim()
                ? i.selectedSize.trim()
                : null,
          })
        ),
      });

      return res.status(201).json({
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        status: result.order.status,
        paymentStatus: result.order.paymentStatus,
        paymentReference: result.order.paymentReference,
        subtotal: result.order.subtotal,
        deliveryCharge: result.order.deliveryCharge,
        totalAmount: result.order.totalAmount,
        city: result.order.city,
        paymentMethod: result.order.paymentMethod,
        items: result.items,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Checkout failed.';
      const status =
        msg.includes('Insufficient stock') || msg.includes('no longer available')
          ? 409
          : 400;
      return res.status(status).json({ error: msg });
    }
  });

  // Admin Authentication Routes
  app.post('/api/admin/login', verifyCsrfOrigin, async (req, res) => {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      // Ensure default admin exists on fresh DB before first login
      await listCategories();

      const normalizedEmail = String(email).trim().toLowerCase();
      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, normalizedEmail))
        .limit(1);

      if (!admin) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const passwordMatches = await bcrypt.compare(String(password), admin.passwordHash);
      if (!passwordMatches) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        {
          adminId: admin.id,
          email: admin.email,
          role: admin.role,
          name: admin.name,
        },
        getJwtSecret(),
        { algorithm: 'HS256', expiresIn: '12h' }
      );

      const origin = req.headers.origin || '';
      const referer = req.headers.referer || '';
      const isHttps =
        req.secure ||
        req.protocol === 'https' ||
        req.headers['x-forwarded-proto'] === 'https' ||
        origin.startsWith('https://') ||
        referer.startsWith('https://');

      const cookieOpts: express.CookieOptions & { partitioned?: boolean } = {
        httpOnly: true,
        sameSite: isHttps ? 'none' : 'strict',
        secure: isHttps,
        ...(isHttps ? { partitioned: true } : {}),
        path: '/',
        maxAge: 12 * 60 * 60 * 1000,
      };

      res.cookie(ADMIN_COOKIE_NAME, token, cookieOpts);

      return res.json({
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      });
    } catch (error: unknown) {
      console.error('Admin login error:', error);
      return res.status(500).json({ error: 'Unable to process login.' });
    }
  });

  app.post('/api/admin/logout', verifyCsrfOrigin, (req, res) => {
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    const isHttps =
      req.secure ||
      req.protocol === 'https' ||
      req.headers['x-forwarded-proto'] === 'https' ||
      origin.startsWith('https://') ||
      referer.startsWith('https://');

    const clearOpts: express.CookieOptions & { partitioned?: boolean } = {
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'strict',
      secure: isHttps,
      ...(isHttps ? { partitioned: true } : {}),
      path: '/',
    };

    res.clearCookie(ADMIN_COOKIE_NAME, clearOpts);
    return res.json({ ok: true });
  });

  app.get('/api/admin/me', requireAdminAuth, (req: AuthRequest, res) => {
    return res.json({ admin: req.admin });
  });

  // Protected Admin Product Routes (/api/admin/products)
  app.get('/api/admin/products', requireAdminAuth, async (req, res) => {
    try {
      const department =
        typeof req.query.department === 'string' ? req.query.department : undefined;
      const category =
        typeof req.query.category === 'string' ? req.query.category : undefined;
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      const rows = await listProducts({ department, category, search });
      return res.json(rows);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to list products.';
      return res.status(500).json({ error: msg });
    }
  });

  app.post(
    '/api/admin/products',
    verifyCsrfOrigin,
    requireAdminAuth,
    async (req, res) => {
      try {
        const {
          title,
          description,
          basePrice,
          discountPrice,
          tag,
          stockQuantity,
          imageUrls,
          sizes,
          department,
          categoryId,
          isFeatured,
        } = req.body ?? {};

        if (!title || !description || !basePrice || !department || !categoryId) {
          return res.status(400).json({
            error: 'Title, description, price, department, and category are required.',
          });
        }

        const parsedBase = Math.round(Number(basePrice));
        const parsedDiscount =
          discountPrice !== null && discountPrice !== undefined && discountPrice !== ''
            ? Math.round(Number(discountPrice))
            : null;
        const parsedStock = Math.max(0, Math.round(Number(stockQuantity ?? 0)));

        if (!Number.isFinite(parsedBase) || parsedBase <= 0) {
          return res.status(400).json({ error: 'Base price must be a positive number.' });
        }
        if (parsedDiscount !== null && parsedDiscount >= parsedBase) {
          return res
            .status(400)
            .json({ error: 'Discount price must be lower than base price.' });
        }

        const imgs = Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls : ['punjabi'];
        const normalizedSizes = Array.isArray(sizes)
          ? Array.from(
              new Set(
                sizes
                  .map((s) => String(s).trim())
                  .filter((s) => s.length > 0)
              )
            )
          : [];

        const created = await createProductRecord({
          title: String(title).trim(),
          description: String(description).trim(),
          basePrice: parsedBase,
          discountPrice: parsedDiscount,
          tag: tag ? String(tag).trim() : null,
          stockQuantity: parsedStock,
          imageUrls: imgs.map(String),
          sizes: normalizedSizes,
          department: String(department).trim(),
          categoryId: Number(categoryId),
          isFeatured: isFeatured !== false,
        });

        return res.status(201).json(created);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to create product.';
        return res.status(500).json({ error: msg });
      }
    }
  );

  const handleUpdateProduct = async (req: AuthRequest, res: express.Response) => {
    try {
      const id = Number(req.params.id || req.body?.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Valid product ID is required.' });
      }

      const body = req.body ?? {};
      const payload: Record<string, unknown> = {};
      if (body.title !== undefined) payload.title = String(body.title).trim();
      if (body.description !== undefined) payload.description = String(body.description).trim();
      if (body.basePrice !== undefined) payload.basePrice = Math.round(Number(body.basePrice));
      if (body.discountPrice !== undefined) {
        payload.discountPrice =
          body.discountPrice === null || body.discountPrice === ''
            ? null
            : Math.round(Number(body.discountPrice));
      }
      if (body.tag !== undefined) payload.tag = body.tag ? String(body.tag).trim() : null;
      if (body.stockQuantity !== undefined) {
        payload.stockQuantity = Math.max(0, Math.round(Number(body.stockQuantity)));
      }
      if (body.imageUrls !== undefined) payload.imageUrls = body.imageUrls;
      if (body.sizes !== undefined) {
        payload.sizes = Array.isArray(body.sizes)
          ? Array.from(
              new Set(
                body.sizes
                  .map((s: unknown) => String(s).trim())
                  .filter((s: string) => s.length > 0)
              )
            )
          : [];
      }
      if (body.department !== undefined) payload.department = String(body.department).trim();
      if (body.categoryId !== undefined) payload.categoryId = Number(body.categoryId);
      if (body.isFeatured !== undefined) payload.isFeatured = Boolean(body.isFeatured);

      const updated = await updateProductRecord(id, payload);
      if (!updated) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      return res.json(updated);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update product.';
      return res.status(500).json({ error: msg });
    }
  };

  app.put('/api/admin/products', verifyCsrfOrigin, requireAdminAuth, handleUpdateProduct);
  app.put('/api/admin/products/:id', verifyCsrfOrigin, requireAdminAuth, handleUpdateProduct);

  const handleDeleteProduct = async (req: AuthRequest, res: express.Response) => {
    try {
      const id = Number(req.params.id || req.query.id || req.body?.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Valid product ID is required.' });
      }
      const deleted = await deleteProductRecord(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      return res.json({ ok: true, id: deleted.id });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to delete product.';
      const status = msg.includes('past customer orders') ? 409 : 500;
      return res.status(status).json({ error: msg });
    }
  };

  app.delete('/api/admin/products', verifyCsrfOrigin, requireAdminAuth, handleDeleteProduct);
  app.delete('/api/admin/products/:id', verifyCsrfOrigin, requireAdminAuth, handleDeleteProduct);

  // Admin Image Upload Route (/api/admin/upload)
  app.post(
    '/api/admin/upload',
    verifyCsrfOrigin,
    requireAdminAuth,
    upload.single('file'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No image file provided.' });
        }
        const result = await uploadToCloudinaryOrLocal(req.file);
        return res.status(201).json(result);
      } catch (error: unknown) {
        console.error('Image upload error:', error);
        const msg = error instanceof Error ? error.message : 'Failed to upload image.';
        return res.status(500).json({ error: msg });
      }
    }
  );

  // Admin AI Product Copy Helper (gemini-3.1-flash-lite)
  app.post(
    '/api/admin/ai-copy',
    verifyCsrfOrigin,
    requireAdminAuth,
    async (req, res) => {
      try {
        const { title, department, categoryName, sizes, tag } = req.body ?? {};
        if (!title || String(title).trim().length < 2) {
          return res
            .status(400)
            .json({ error: 'Enter a product title first to draft a description.' });
        }
        const description = await generateAdminProductDescription({
          title: String(title).trim(),
          department: String(department || 'Apparel').trim(),
          categoryName: String(categoryName || 'Signature').trim(),
          sizes: Array.isArray(sizes) ? sizes.map(String) : [],
          tag: tag ? String(tag).trim() : null,
        });
        return res.json({ description });
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : 'Failed to draft description.';
        return res.status(500).json({ error: msg });
      }
    }
  );

  // Protected Admin Orders Routes
  app.get('/api/admin/orders', requireAdminAuth, async (_req, res) => {
    try {
      const data = await listOrdersAdmin();
      return res.json(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load orders.';
      return res.status(500).json({ error: msg });
    }
  });

  app.put(
    '/api/admin/orders/:id',
    verifyCsrfOrigin,
    requireAdminAuth,
    async (req, res) => {
      try {
        const id = Number(req.params.id);
        const status = req.body?.status;
        if (!['Pending', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
          return res.status(400).json({ error: 'Invalid order status.' });
        }
        const updated = await updateOrderStatusAdmin(id, status);
        if (!updated) {
          return res.status(404).json({ error: 'Order not found.' });
        }
        return res.json(updated);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to update order.';
        return res.status(500).json({ error: msg });
      }
    }
  );

  // Block unauthorized access to any unknown /api/admin/* endpoint
  app.all('/api/admin/*', requireAdminAuth, (_req, res) => {
    res.status(404).json({ error: 'Admin endpoint not found.' });
  });

  // Ensure any unknown /api/* path returns JSON 404 instead of SPA HTML
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Always return JSON errors on /api/* routes (including multer & JSON parse errors)
  app.use(
    '/api',
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error('API error:', err);
      const message =
        err instanceof Error ? err.message : 'Internal server error.';
      res.status(400).json({ error: message });
    }
  );

  // Vite Dev Server or Production Static Bundle
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`18 aana server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
