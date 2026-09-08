import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { hashPassword, comparePassword, signUserToken, requireAuth, AuthRequest } from '../auth.js';

const router = Router();

// Email regex validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sanitize whatsapp phone number (keep only digits, ensure 10-15 digits)
function sanitizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned;
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, whatsapp_number } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }
    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    const cleanEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (!whatsapp_number || typeof whatsapp_number !== 'string') {
      return res.status(400).json({ error: 'WhatsApp number is required.' });
    }
    const cleanWhatsApp = sanitizePhone(whatsapp_number);
    if (cleanWhatsApp.length < 10 || cleanWhatsApp.length > 15) {
      return res.status(400).json({ error: 'Please provide a valid WhatsApp number (10 to 15 digits).' });
    }

    const db = await getDb();

    // Check unique username
    const checkUserStmt = db.prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)");
    checkUserStmt.bind([cleanUsername]);
    if (checkUserStmt.step()) {
      checkUserStmt.free();
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }
    checkUserStmt.free();

    // Check unique email
    const checkEmailStmt = db.prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)");
    checkEmailStmt.bind([cleanEmail]);
    if (checkEmailStmt.step()) {
      checkEmailStmt.free();
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    checkEmailStmt.free();

    // Hash password
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    db.run(
      "INSERT INTO users (username, email, password_hash, whatsapp_number, created_at) VALUES (?, ?, ?, ?, ?)",
      [cleanUsername, cleanEmail, passwordHash, cleanWhatsApp, now]
    );

    saveDb();

    const lastIdRes = db.exec("SELECT last_insert_rowid() as id");
    const userId = lastIdRes[0]?.values[0]?.[0] as number;

    const userPayload = {
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      whatsapp_number: cleanWhatsApp,
    };

    const token = signUserToken(userPayload);

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      message: 'Registration successful!',
      user: userPayload,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'An error occurred during registration. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Please enter your email/username and password.' });
    }

    const db = await getDb();
    const queryTerm = login.trim().toLowerCase();

    const stmt = db.prepare(
      "SELECT id, username, email, password_hash, whatsapp_number FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?"
    );
    stmt.bind([queryTerm, queryTerm]);

    if (!stmt.step()) {
      stmt.free();
      return res.status(401).json({ error: 'Invalid credentials. Please check your username/email and password.' });
    }

    const row = stmt.getAsObject();
    stmt.free();

    const isMatch = comparePassword(password, row.password_hash as string);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Please check your username/email and password.' });
    }

    const userPayload = {
      id: row.id as number,
      username: row.username as string,
      email: row.email as string,
      whatsapp_number: row.whatsapp_number as string,
    };

    const token = signUserToken(userPayload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      message: 'Logged in successfully!',
      user: userPayload,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An error occurred during login. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { whatsapp_number } = req.body;
    if (!whatsapp_number) {
      return res.status(400).json({ error: 'WhatsApp number is required.' });
    }

    const cleanPhone = sanitizePhone(whatsapp_number);
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return res.status(400).json({ error: 'Please enter a valid WhatsApp number (10 to 15 digits).' });
    }

    const db = await getDb();
    db.run("UPDATE users SET whatsapp_number = ? WHERE id = ?", [cleanPhone, req.user!.id]);
    saveDb();

    req.user!.whatsapp_number = cleanPhone;
    const newToken = signUserToken(req.user!);

    return res.json({
      message: 'Profile updated successfully',
      user: req.user,
      token: newToken
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;
