import { Router, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { requireAuth, AuthRequest } from '../auth.js';

const router = Router();

// POST /api/favorites/toggle
router.post('/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { listing_id } = req.body;
    const numId = parseInt(listing_id, 10);
    if (isNaN(numId)) {
      return res.status(400).json({ error: 'Valid listing ID is required.' });
    }

    const db = await getDb();
    const userId = req.user!.id;

    // Check if listing exists
    const checkListing = db.prepare("SELECT id FROM listings WHERE id = ?");
    checkListing.bind([numId]);
    if (!checkListing.step()) {
      checkListing.free();
      return res.status(404).json({ error: 'Listing not found.' });
    }
    checkListing.free();

    // Check if favorite exists
    const checkFav = db.prepare("SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?");
    checkFav.bind([userId, numId]);

    let isFavorite = false;
    if (checkFav.step()) {
      checkFav.free();
      // Remove favorite
      db.run("DELETE FROM favorites WHERE user_id = ? AND listing_id = ?", [userId, numId]);
      isFavorite = false;
    } else {
      checkFav.free();
      // Add favorite
      const now = new Date().toISOString();
      db.run("INSERT INTO favorites (user_id, listing_id, created_at) VALUES (?, ?, ?)", [userId, numId, now]);
      isFavorite = true;
    }

    saveDb();

    return res.json({
      isFavorite,
      message: isFavorite ? 'Added to your favorites' : 'Removed from favorites'
    });
  } catch (error) {
    console.error('Favorite toggle error:', error);
    return res.status(500).json({ error: 'Failed to update favorite.' });
  }
});

// GET /api/favorites (Get all favorited listings)
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.user!.id;

    const sql = `
      SELECT 
        l.id, l.title, l.price, l.level, l.rank, l.region, l.login_type,
        l.skins, l.bundles, l.emotes, l.characters, l.status, l.views, l.created_at,
        u.username as seller_username,
        f.created_at as favorited_at,
        (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY sort_order ASC LIMIT 1) as primary_image
      FROM favorites f
      JOIN listings l ON f.listing_id = l.id
      JOIN users u ON l.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;

    const stmt = db.prepare(sql);
    stmt.bind([userId]);

    const favorites: any[] = [];
    while (stmt.step()) {
      favorites.push({
        ...stmt.getAsObject(),
        is_favorite: true
      });
    }
    stmt.free();

    return res.json({ favorites });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    return res.status(500).json({ error: 'Failed to fetch favorites.' });
  }
});

// GET /api/favorites/ids (Get list of favorite IDs)
router.get('/ids', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.user!.id;

    const stmt = db.prepare("SELECT listing_id FROM favorites WHERE user_id = ?");
    stmt.bind([userId]);

    const ids: number[] = [];
    while (stmt.step()) {
      ids.push(stmt.getAsObject().listing_id as number);
    }
    stmt.free();

    return res.json({ ids });
  } catch (error) {
    console.error('Fetch favorite IDs error:', error);
    return res.status(500).json({ error: 'Failed to fetch favorite IDs.' });
  }
});

export default router;
