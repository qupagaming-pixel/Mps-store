import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ff_id_seller_secret_key_2026_super_secure';

export interface UserPayload {
  id: number;
  username: string;
  email: string;
  whatsapp_number: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signUserToken(user: UserPayload): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      whatsapp_number: user.whatsapp_number
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyUserToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const payload = verifyUserToken(token);
  if (!payload) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  // Verify that user still exists in database
  const db = await getDb();
  let stmt = db.prepare("SELECT id, username, email, whatsapp_number FROM users WHERE id = ?");
  stmt.bind([payload.id]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    req.user = {
      id: row.id as number,
      username: row.username as string,
      email: row.email as string,
      whatsapp_number: row.whatsapp_number as string,
    };
    return next();
  }
  stmt.free();

  // Fallback: search by email or username in case user ID changed
  if (payload.email || payload.username) {
    const fallbackStmt = db.prepare(
      "SELECT id, username, email, whatsapp_number FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)"
    );
    fallbackStmt.bind([payload.email || '', payload.username || '']);
    if (fallbackStmt.step()) {
      const row = fallbackStmt.getAsObject();
      fallbackStmt.free();
      req.user = {
        id: row.id as number,
        username: row.username as string,
        email: row.email as string,
        whatsapp_number: row.whatsapp_number as string,
      };
      return next();
    }
    fallbackStmt.free();
  }

  res.clearCookie('token');
  return res.status(401).json({ error: 'User account not found. Please log in again.' });
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next();
  }

  const payload = verifyUserToken(token);
  if (payload) {
    try {
      const db = await getDb();
      let stmt = db.prepare("SELECT id, username, email, whatsapp_number FROM users WHERE id = ?");
      stmt.bind([payload.id]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        req.user = {
          id: row.id as number,
          username: row.username as string,
          email: row.email as string,
          whatsapp_number: row.whatsapp_number as string,
        };
        stmt.free();
      } else {
        stmt.free();
        if (payload.email || payload.username) {
          const fallbackStmt = db.prepare(
            "SELECT id, username, email, whatsapp_number FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)"
          );
          fallbackStmt.bind([payload.email || '', payload.username || '']);
          if (fallbackStmt.step()) {
            const row = fallbackStmt.getAsObject();
            req.user = {
              id: row.id as number,
              username: row.username as string,
              email: row.email as string,
              whatsapp_number: row.whatsapp_number as string,
            };
          }
          fallbackStmt.free();
        }
      }
    } catch {
      // ignore
    }
  }

  next();
}
