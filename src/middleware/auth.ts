import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { adminUsers } from '../db/schema.ts';
import { getOrCreateUser } from '../db/users.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

export const ADMIN_COOKIE_NAME = 'eighteen_aana_admin_token';

// Ephemeral fallback secret per process if JWT_SECRET env is not set
const RUNTIME_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || RUNTIME_FALLBACK_SECRET;
}

export interface AdminJwtPayload {
  adminId: number;
  email: string;
  role: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUserId?: number;
  admin?: AdminJwtPayload;
}

export const optionalFirebaseAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    if (decoded.email) {
      const dbUser = await getOrCreateUser(decoded.uid, decoded.email, decoded.name ?? null);
      req.dbUserId = dbUser.id;
    }
  } catch (err) {
    console.warn('Optional Firebase token could not be verified:', err);
  }
  return next();
};

export const requireFirebaseAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    if (decodedToken.email) {
      const dbUser = await getOrCreateUser(
        decodedToken.uid,
        decodedToken.email,
        decodedToken.name ?? null
      );
      req.dbUserId = dbUser.id;
    }
    return next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid authentication token.' });
  }
};

export const verifyCsrfOrigin = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const origin = req.headers.origin;
  const forwardedHost = req.headers['x-forwarded-host'];
  const host =
    (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ||
    req.headers.host;

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host && originHost !== req.headers.host) {
        return res.status(403).json({ error: 'Forbidden: Cross-origin request rejected.' });
      }
    } catch {
      return res.status(403).json({ error: 'Forbidden: Invalid request origin.' });
    }
  }

  // Require custom X-Requested-With header for state-changing JSON/multipart admin calls
  const xRequestedWith = req.headers['x-requested-with'];
  if (xRequestedWith !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'Forbidden: Missing CSRF verification header.' });
  }

  return next();
};

export const requireAdminAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    }) as AdminJwtPayload;

    const [admin] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        role: adminUsers.role,
        name: adminUsers.name,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, decoded.adminId))
      .limit(1);

    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized: Admin account not found.' });
    }

    req.admin = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      name: admin.name,
    };

    return next();
  } catch (error) {
    console.error('Admin JWT verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired admin session.' });
  }
};
