import { Router, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { optionalAuth, AuthRequest } from '../auth.js';

const router = Router();

const VALID_REASONS = [
  'Scam/suspicious listing',
  'Wrong information',
  'Fake images',
  'Offensive content',
  'Other'
];

// POST /api/reports
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { listing_id, reason, description } = req.body;

    const numListingId = parseInt(listing_id, 10);
    if (isNaN(numListingId)) {
      return res.status(400).json({ error: 'Valid listing ID is required.' });
    }

    if (!reason || !VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        error: `Invalid reason. Allowed options: ${VALID_REASONS.join(', ')}`
      });
    }

    const db = await getDb();

    // Verify listing exists
    const checkStmt = db.prepare("SELECT id, title, user_id FROM listings WHERE id = ?");
    checkStmt.bind([numListingId]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ error: 'Listing not found.' });
    }
    const listing = checkStmt.getAsObject();
    checkStmt.free();

    const reporterUserId = req.user ? req.user.id : null;
    const now = new Date().toISOString();
    const cleanDesc = description ? String(description).trim().slice(0, 1000) : '';

    db.run(
      "INSERT INTO reports (listing_id, reporter_user_id, reason, description, created_at) VALUES (?, ?, ?, ?, ?)",
      [numListingId, reporterUserId, reason, cleanDesc, now]
    );

    saveDb();

    // Secure notification logging for website owner email
    const ownerEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'owner@freefireidseller.in';
    console.log(`[ALERT NOTIFICATION EMAIL TO: ${ownerEmail}]`);
    console.log(`Timestamp: ${now}`);
    console.log(`Listing ID: ${numListingId} (${listing.title})`);
    console.log(`Report Reason: ${reason}`);
    console.log(`Details: ${cleanDesc || 'None provided'}`);
    console.log(`Reporter: ${req.user ? `User #${req.user.id} (${req.user.username})` : 'Anonymous Guest'}`);
    console.log(`--------------------------------------------------`);

    return res.status(201).json({
      success: true,
      message: 'Thank you. Your report has been submitted to the platform safety team for review.'
    });
  } catch (error) {
    console.error('Report submission error:', error);
    return res.status(500).json({ error: 'Failed to submit report. Please try again.' });
  }
});

export default router;
