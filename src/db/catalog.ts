import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  categories,
  feedbacks,
  orderItems,
  orders,
  products,
} from './schema.ts';
import { ensureDatabaseSeeded } from './seed.ts';

export interface ProductWithCategory {
  id: number;
  title: string;
  slug: string;
  description: string;
  basePrice: number;
  discountPrice: number | null;
  tag: string | null;
  stockQuantity: number;
  imageUrls: string[];
  sizes: string[];
  department: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function listCategories() {
  try {
    await ensureDatabaseSeeded();
    return await db
      .select()
      .from(categories)
      .orderBy(categories.displayOrder, categories.id);
  } catch (error) {
    console.error('Failed to query categories:', error);
    throw new Error('Unable to load categories right now.', { cause: error });
  }
}

export async function listProducts(filters?: {
  department?: string;
  category?: string;
  search?: string;
}): Promise<ProductWithCategory[]> {
  try {
    await ensureDatabaseSeeded();
    const rows = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        description: products.description,
        basePrice: products.basePrice,
        discountPrice: products.discountPrice,
        tag: products.tag,
        stockQuantity: products.stockQuantity,
        imageUrls: products.imageUrls,
        sizes: products.sizes,
        department: products.department,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.isFeatured), products.id);

    return rows.filter((item) => {
      if (
        filters?.department &&
        filters.department !== 'All' &&
        item.department.toLowerCase() !== filters.department.toLowerCase()
      ) {
        return false;
      }
      if (
        filters?.category &&
        item.categorySlug.toLowerCase() !== filters.category.toLowerCase() &&
        item.categoryName.toLowerCase() !== filters.category.toLowerCase()
      ) {
        return false;
      }
      if (filters?.search && filters.search.trim().length > 0) {
        const q = filters.search.trim().toLowerCase();
        const hay = `${item.title} ${item.description} ${item.department} ${item.categoryName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  } catch (error) {
    console.error('Failed to query products:', error);
    throw new Error('Unable to load products right now.', { cause: error });
  }
}

export async function getProductById(id: number): Promise<ProductWithCategory | null> {
  try {
    await ensureDatabaseSeeded();
    const rows = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        description: products.description,
        basePrice: products.basePrice,
        discountPrice: products.discountPrice,
        tag: products.tag,
        stockQuantity: products.stockQuantity,
        imageUrls: products.imageUrls,
        sizes: products.sizes,
        department: products.department,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        isFeatured: products.isFeatured,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    return rows[0] ?? null;
  } catch (error) {
    console.error('Failed to query product by id:', error);
    throw new Error('Unable to load product details.', { cause: error });
  }
}

function makeSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

export interface ProductWriteInput {
  title: string;
  description: string;
  basePrice: number;
  discountPrice?: number | null;
  tag?: string | null;
  stockQuantity: number;
  imageUrls: string[];
  sizes?: string[];
  department: string;
  categoryId: number;
  isFeatured?: boolean;
}

export async function createProductRecord(input: ProductWriteInput) {
  try {
    const [created] = await db
      .insert(products)
      .values({
        title: input.title,
        slug: makeSlug(input.title),
        description: input.description,
        basePrice: input.basePrice,
        discountPrice: input.discountPrice ?? null,
        tag: input.tag || null,
        stockQuantity: input.stockQuantity,
        imageUrls: input.imageUrls,
        sizes: input.sizes ?? [],
        department: input.department,
        categoryId: input.categoryId,
        isFeatured: input.isFeatured ?? true,
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Failed to create product:', error);
    throw new Error('Could not create product.', { cause: error });
  }
}

export async function updateProductRecord(
  id: number,
  input: Partial<ProductWriteInput>
) {
  try {
    const [updated] = await db
      .update(products)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.basePrice !== undefined ? { basePrice: input.basePrice } : {}),
        ...(input.discountPrice !== undefined ? { discountPrice: input.discountPrice } : {}),
        ...(input.tag !== undefined ? { tag: input.tag } : {}),
        ...(input.stockQuantity !== undefined ? { stockQuantity: input.stockQuantity } : {}),
        ...(input.imageUrls !== undefined ? { imageUrls: input.imageUrls } : {}),
        ...(input.sizes !== undefined ? { sizes: input.sizes } : {}),
        ...(input.department !== undefined ? { department: input.department } : {}),
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('Failed to update product:', error);
    throw new Error('Could not update product.', { cause: error });
  }
}

export async function deleteProductRecord(id: number) {
  try {
    const existingRefs = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.productId, id))
      .limit(1);

    if (existingRefs.length > 0) {
      throw new Error(
        'This product appears in past customer orders. Set stock to 0 instead of deleting it.'
      );
    }

    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    return deleted ?? null;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('past customer orders')) {
      throw error;
    }
    console.error('Failed to delete product:', error);
    throw new Error('Could not delete product.', { cause: error });
  }
}

export interface CheckoutInput {
  userId?: number | null;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  city: 'Dhaka' | 'Outside Dhaka';
  paymentMethod: 'COD' | 'bKash' | 'Nagad';
  paymentReference?: string | null;
  items: Array<{ productId: number; quantity: number; selectedSize?: string | null }>;
}

export async function processCheckoutTransaction(input: CheckoutInput) {
  try {
    return await db.transaction(async (tx) => {
      let subtotal = 0;
      const resolvedItems: Array<{
        productId: number;
        productTitle: string;
        selectedSize: string | null;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
      }> = [];

      for (const reqItem of input.items) {
        const qty = Math.floor(Number(reqItem.quantity));
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error('Invalid item quantity requested.');
        }

        const [updatedProduct] = await tx
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${qty}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, reqItem.productId),
              gte(products.stockQuantity, qty)
            )
          )
          .returning();

        if (!updatedProduct) {
          const [exists] = await tx
            .select({ title: products.title, stockQuantity: products.stockQuantity })
            .from(products)
            .where(eq(products.id, reqItem.productId))
            .limit(1);

          if (!exists) {
            throw new Error(`Product #${reqItem.productId} is no longer available.`);
          }
          throw new Error(
            `Insufficient stock for "${exists.title}". Only ${exists.stockQuantity} left.`
          );
        }

        if (
          Array.isArray(updatedProduct.sizes) &&
          updatedProduct.sizes.length > 0
        ) {
          if (
            !reqItem.selectedSize ||
            !updatedProduct.sizes.includes(reqItem.selectedSize)
          ) {
            throw new Error(
              `Please select a valid size for "${updatedProduct.title}".`
            );
          }
        }

        const unitPrice =
          updatedProduct.discountPrice !== null && updatedProduct.discountPrice > 0
            ? updatedProduct.discountPrice
            : updatedProduct.basePrice;
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;

        resolvedItems.push({
          productId: updatedProduct.id,
          productTitle: updatedProduct.title,
          selectedSize: reqItem.selectedSize?.trim() || null,
          quantity: qty,
          unitPrice,
          lineTotal,
        });
      }

      const deliveryCharge =
        input.city === 'Dhaka' ? (subtotal > 2500 ? 0 : 80) : 150;
      const totalAmount = subtotal + deliveryCharge;

      const orderNumber = `18A-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(
        10 + Math.random() * 90
      )}`;

      const isMobileBanking = input.paymentMethod !== 'COD';

      const [createdOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: input.userId ?? null,
          customerName: input.customerName.trim(),
          phone: input.phone.trim(),
          deliveryAddress: input.deliveryAddress.trim(),
          city: input.city,
          paymentMethod: input.paymentMethod,
          paymentStatus: isMobileBanking ? 'Pending Verification' : 'Cash on Delivery',
          paymentReference: isMobileBanking ? input.paymentReference?.trim() || null : null,
          sslTranId: null,
          subtotal,
          deliveryCharge,
          totalAmount,
          status: 'Pending',
        })
        .returning();

      const insertedItems = await tx
        .insert(orderItems)
        .values(
          resolvedItems.map((item) => ({
            orderId: createdOrder.id,
            productId: item.productId,
            productTitle: item.productTitle,
            selectedSize: item.selectedSize,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          }))
        )
        .returning();

      return {
        order: createdOrder,
        items: insertedItems,
      };
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes('Insufficient stock') ||
        error.message.includes('no longer available') ||
        error.message.includes('Invalid item quantity') ||
        error.message.includes('Please select a valid size'))
    ) {
      throw error;
    }
    console.error('Checkout transaction failed:', error);
    throw new Error('Could not complete checkout. Please try again.', { cause: error });
  }
}

export async function listOrdersAdmin() {
  try {
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    const allItems = await db.select().from(orderItems);
    const itemsByOrder = new Map<number, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    return allOrders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.id) ?? [],
    }));
  } catch (error) {
    console.error('Failed to list orders:', error);
    throw new Error('Could not load orders.', { cause: error });
  }
}

export async function updateOrderStatusAdmin(
  orderId: number,
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled'
) {
  try {
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();

    return updated ?? null;
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw new Error('Could not update order status.', { cause: error });
  }
}

export async function listOrdersForUser(userId: number) {
  try {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const allItems = await db.select().from(orderItems);
    const itemsByOrder = new Map<number, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    return userOrders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.id) ?? [],
    }));
  } catch (error) {
    console.error('Failed to load user orders:', error);
    throw new Error('Could not load your orders.', { cause: error });
  }
}

export async function trackOrderByNumber(orderNumberOrId: string) {
  try {
    const cleaned = orderNumberOrId.trim().replace(/^#/, '');
    if (!cleaned) return null;

    const isNumericId = /^\d+$/.test(cleaned);
    const [order] = await db
      .select()
      .from(orders)
      .where(
        isNumericId
          ? eq(orders.id, Number(cleaned))
          : eq(orders.orderNumber, cleaned.toUpperCase())
      )
      .limit(1);

    if (!order) return null;

    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        productTitle: orderItems.productTitle,
        selectedSize: orderItems.selectedSize,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        lineTotal: orderItems.lineTotal,
        imageUrls: products.imageUrls,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      city: order.city,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference,
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: items.map((it) => ({
        id: it.id,
        productId: it.productId,
        productTitle: it.productTitle,
        selectedSize: it.selectedSize,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
        imageUrl: it.imageUrls?.[0] ?? null,
      })),
    };
  } catch (error) {
    console.error('Failed to track order:', error);
    throw new Error('Could not look up order.', { cause: error });
  }
}

export async function listFeedbacks() {
  try {
    await ensureDatabaseSeeded();
    return await db
      .select()
      .from(feedbacks)
      .orderBy(desc(feedbacks.createdAt))
      .limit(12);
  } catch (error) {
    console.error('Failed to load feedback:', error);
    throw new Error('Could not load feedback.', { cause: error });
  }
}

export async function createFeedbackRecord(input: {
  name: string;
  topic: string;
  rating: number;
  message: string;
}) {
  try {
    const [created] = await db
      .insert(feedbacks)
      .values({
        name: input.name.trim(),
        topic: input.topic.trim(),
        rating: Math.min(5, Math.max(1, Math.round(input.rating))),
        message: input.message.trim(),
      })
      .returning();

    return created;
  } catch (error) {
    console.error('Failed to save feedback:', error);
    throw new Error('Could not submit feedback.', { cause: error });
  }
}
