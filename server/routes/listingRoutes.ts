import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { requireAuth, optionalAuth, AuthRequest } from '../auth.js';

const router = Router();

// Helper to format currency
function formatINR(price: number): string {
  return price.toLocaleString('en-IN');
}

// GET /api/listings (search, filter, sort, paginate)
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();

    const search = (req.query.search as string || '').trim();
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    const minLevel = req.query.minLevel ? Number(req.query.minLevel) : null;
    const maxLevel = req.query.maxLevel ? Number(req.query.maxLevel) : null;
    const rank = (req.query.rank as string || '').trim();
    const region = (req.query.region as string || '').trim();
    const loginType = (req.query.loginType as string || '').trim();
    const status = (req.query.status as string || 'active').trim();
    const sort = (req.query.sort as string || 'newest').trim();
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '12', 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status !== 'all') {
      conditions.push('l.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push(
        '(l.title LIKE ? OR l.description LIKE ? OR l.skins LIKE ? OR l.bundles LIKE ? OR l.emotes LIKE ? OR l.characters LIKE ? OR l.rank LIKE ? OR l.id = ?)'
      );
      const sParam = `%${search}%`;
      const numSearch = Number(search) || -1;
      params.push(sParam, sParam, sParam, sParam, sParam, sParam, sParam, numSearch);
    }

    if (minPrice !== null && !isNaN(minPrice)) {
      conditions.push('l.price >= ?');
      params.push(minPrice);
    }

    if (maxPrice !== null && !isNaN(maxPrice)) {
      conditions.push('l.price <= ?');
      params.push(maxPrice);
    }

    if (minLevel !== null && !isNaN(minLevel)) {
      conditions.push('l.level >= ?');
      params.push(minLevel);
    }

    if (maxLevel !== null && !isNaN(maxLevel)) {
      conditions.push('l.level <= ?');
      params.push(maxLevel);
    }

    if (rank && rank !== 'all') {
      conditions.push('l.rank = ?');
      params.push(rank);
    }

    if (region && region !== 'all') {
      conditions.push('l.region = ?');
      params.push(region);
    }

    if (loginType && loginType !== 'all') {
      conditions.push('l.login_type = ?');
      params.push(loginType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'l.created_at DESC';
    if (sort === 'price_asc') {
      orderBy = 'l.price ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'l.price DESC';
    } else if (sort === 'level_desc') {
      orderBy = 'l.level DESC';
    } else if (sort === 'views_desc') {
      orderBy = 'l.views DESC';
    }

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM listings l ${whereClause}`;
    const countStmt = db.prepare(countSql);
    countStmt.bind(params);
    let total = 0;
    if (countStmt.step()) {
      total = countStmt.getAsObject().total as number;
    }
    countStmt.free();

    // Query listings with primary image and seller info
    const querySql = `
      SELECT 
        l.id, l.user_id, l.title, l.price, l.level, l.rank, l.region, l.login_type,
        l.description, l.skins, l.bundles, l.emotes, l.characters, l.rare_items,
        l.status, l.views, l.created_at, l.updated_at,
        u.username as seller_username,
        (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY sort_order ASC LIMIT 1) as primary_image
      FROM listings l
      JOIN users u ON l.user_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const queryStmt = db.prepare(querySql);
    queryStmt.bind([...params, limit, offset]);

    const listings: any[] = [];
    while (queryStmt.step()) {
      listings.push(queryStmt.getAsObject());
    }
    queryStmt.free();

    // If authenticated, get user's favorite IDs
    let userFavorites: number[] = [];
    if (req.user) {
      const favStmt = db.prepare("SELECT listing_id FROM favorites WHERE user_id = ?");
      favStmt.bind([req.user.id]);
      while (favStmt.step()) {
        userFavorites.push(favStmt.getAsObject().listing_id as number);
      }
      favStmt.free();
    }

    const enhancedListings = listings.map(l => ({
      ...l,
      is_favorite: userFavorites.includes(l.id),
      primary_image: l.primary_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'
    }));

    return res.json({
      listings: enhancedListings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Fetch listings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve listings.' });
  }
});

// GET /api/listings/featured (Top 6 listings for homepage)
router.get('/featured', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();

    const sql = `
      SELECT 
        l.id, l.user_id, l.title, l.price, l.level, l.rank, l.region, l.login_type,
        l.skins, l.bundles, l.emotes, l.characters, l.rare_items,
        l.status, l.views, l.created_at,
        u.username as seller_username,
        (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY sort_order ASC LIMIT 1) as primary_image
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'active'
      ORDER BY l.views DESC, l.created_at DESC
      LIMIT 6
    `;

    const stmt = db.prepare(sql);
    const listings: any[] = [];
    while (stmt.step()) {
      listings.push(stmt.getAsObject());
    }
    stmt.free();

    let userFavorites: number[] = [];
    if (req.user) {
      const favStmt = db.prepare("SELECT listing_id FROM favorites WHERE user_id = ?");
      favStmt.bind([req.user.id]);
      while (favStmt.step()) {
        userFavorites.push(favStmt.getAsObject().listing_id as number);
      }
      favStmt.free();
    }

    const enhancedListings = listings.map(l => ({
      ...l,
      is_favorite: userFavorites.includes(l.id),
      primary_image: l.primary_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80'
    }));

    return res.json({ listings: enhancedListings });
  } catch (error) {
    console.error('Featured listings error:', error);
    return res.status(500).json({ error: 'Failed to fetch featured listings.' });
  }
});

// GET /api/listings/:id (Single listing details + images + seller profile)
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }

    const db = await getDb();

    // Increment views
    db.run("UPDATE listings SET views = views + 1 WHERE id = ?", [id]);
    saveDb();

    const sql = `
      SELECT 
        l.*,
        u.username as seller_username,
        u.created_at as seller_joined_at,
        (SELECT COUNT(*) FROM listings WHERE user_id = u.id AND status = 'active') as seller_active_listings_count
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `;

    const stmt = db.prepare(sql);
    stmt.bind([id]);

    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ error: 'Listing not found or has been removed.' });
    }

    const listing = stmt.getAsObject();
    stmt.free();

    // Fetch images
    const imgStmt = db.prepare("SELECT id, image_url, sort_order FROM listing_images WHERE listing_id = ? ORDER BY sort_order ASC");
    imgStmt.bind([id]);
    const images: any[] = [];
    while (imgStmt.step()) {
      images.push(imgStmt.getAsObject());
    }
    imgStmt.free();

    // Check favorite status
    let isFavorite = false;
    if (req.user) {
      const favStmt = db.prepare("SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?");
      favStmt.bind([req.user.id, id]);
      if (favStmt.step()) {
        isFavorite = true;
      }
      favStmt.free();
    }

    // Fetch seller's other active listings (up to 3)
    const otherStmt = db.prepare(`
      SELECT 
        l.id, l.title, l.price, l.level, l.rank, l.region, l.status,
        (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY sort_order ASC LIMIT 1) as primary_image
      FROM listings l
      WHERE l.user_id = ? AND l.id != ? AND l.status = 'active'
      LIMIT 3
    `);
    otherStmt.bind([listing.user_id, id]);
    const otherListings: any[] = [];
    while (otherStmt.step()) {
      otherListings.push(otherStmt.getAsObject());
    }
    otherStmt.free();

    // IMPORTANT: Note that seller's WhatsApp number is NOT included in this response!
    // The seller's phone is protected and only accessed through the secure /contact endpoint.
    return res.json({
      listing: {
        ...listing,
        images: images.length > 0 ? images.map(i => i.image_url) : [
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80'
        ],
        is_favorite: isFavorite,
      },
      seller: {
        username: listing.seller_username,
        joined_at: listing.seller_joined_at,
        active_listings_count: listing.seller_active_listings_count,
        other_listings: otherListings
      }
    });
  } catch (error) {
    console.error('Fetch listing detail error:', error);
    return res.status(500).json({ error: 'Failed to load listing.' });
  }
});

// GET /api/listings/:id/contact (WhatsApp click-to-chat generator)
// Generates: "Hello, I am interested in your FF ID listed on FF ID Seller. Listing: [listing title]. Price: ₹[price]. Is it available?"
router.get('/:id/contact', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }

    const db = await getDb();
    const stmt = db.prepare(`
      SELECT l.title, l.price, u.username, u.whatsapp_number
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `);
    stmt.bind([id]);

    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ error: 'Listing or seller not found.' });
    }

    const row = stmt.getAsObject();
    stmt.free();

    let cleanPhone = (row.whatsapp_number as string || '').replace(/\D/g, '');
    // If phone is 10 digits without country code, default to 91 (India)
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const message = `Hello, I am interested in your FF ID listed on FF ID Seller.\n\nListing: ${row.title}\nPrice: ₹${formatINR(row.price as number)}\n\nIs it available?`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    return res.json({
      url: whatsappUrl,
      seller_username: row.username
    });
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ error: 'Failed to generate WhatsApp contact link.' });
  }
});

// POST /api/listings (Create new listing)
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      price,
      level,
      rank,
      region,
      login_type,
      description,
      skins,
      bundles,
      emotes,
      characters,
      rare_items,
      images
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      return res.status(400).json({ error: 'Listing title must be at least 5 characters long.' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Please specify a valid price in ₹.' });
    }

    const numLevel = parseInt(level, 10);
    if (isNaN(numLevel) || numLevel < 1 || numLevel > 100) {
      return res.status(400).json({ error: 'Account level must be between 1 and 100.' });
    }

    if (!rank || typeof rank !== 'string') {
      return res.status(400).json({ error: 'Rank is required.' });
    }

    if (!region || typeof region !== 'string') {
      return res.status(400).json({ error: 'Region is required.' });
    }

    if (!login_type || typeof login_type !== 'string') {
      return res.status(400).json({ error: 'Login type is required.' });
    }

    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters long.' });
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const userId = req.user!.id; // Authenticated user ID

    db.run(
      `INSERT INTO listings (
        user_id, title, price, level, rank, region, login_type,
        description, skins, bundles, emotes, characters, rare_items,
        status, views, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?)`,
      [
        userId,
        title.trim(),
        numPrice,
        numLevel,
        rank.trim(),
        region.trim(),
        login_type.trim(),
        description.trim(),
        (skins || '').trim(),
        (bundles || '').trim(),
        (emotes || '').trim(),
        (characters || '').trim(),
        (rare_items || '').trim(),
        now,
        now
      ]
    );

    const lastIdRes = db.exec("SELECT last_insert_rowid() as id");
    const listingId = lastIdRes[0]?.values[0]?.[0] as number;

    // Handle image URLs
    const imageList = Array.isArray(images) && images.length > 0
      ? images
      : ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80'];

    let sort = 0;
    for (const imgUrl of imageList) {
      if (typeof imgUrl === 'string' && imgUrl.trim()) {
        db.run(
          "INSERT INTO listing_images (listing_id, image_url, sort_order) VALUES (?, ?, ?)",
          [listingId, imgUrl.trim(), sort++]
        );
      }
    }

    saveDb();

    return res.status(201).json({
      message: 'Your listing is now live!',
      listing_id: listingId
    });
  } catch (error) {
    console.error('Create listing error:', error);
    return res.status(500).json({ error: 'Failed to create listing.' });
  }
});

// PUT /api/listings/:id (Update listing - owner only)
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }

    const db = await getDb();

    // Check ownership
    const checkStmt = db.prepare("SELECT user_id FROM listings WHERE id = ?");
    checkStmt.bind([id]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ error: 'Listing not found.' });
    }

    const ownerId = checkStmt.getAsObject().user_id as number;
    checkStmt.free();

    if (ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized. You can only edit your own listings.' });
    }

    const {
      title,
      price,
      level,
      rank,
      region,
      login_type,
      description,
      skins,
      bundles,
      emotes,
      characters,
      rare_items,
      images,
      status
    } = req.body;

    const numPrice = Number(price);
    const numLevel = parseInt(level, 10);
    const now = new Date().toISOString();

    db.run(
      `UPDATE listings SET
        title = ?, price = ?, level = ?, rank = ?, region = ?, login_type = ?,
        description = ?, skins = ?, bundles = ?, emotes = ?, characters = ?, rare_items = ?,
        status = ?, updated_at = ?
      WHERE id = ?`,
      [
        title.trim(),
        numPrice,
        numLevel,
        rank.trim(),
        region.trim(),
        login_type.trim(),
        description.trim(),
        (skins || '').trim(),
        (bundles || '').trim(),
        (emotes || '').trim(),
        (characters || '').trim(),
        (rare_items || '').trim(),
        status === 'sold' ? 'sold' : 'active',
        now,
        id
      ]
    );

    // If new images provided, update
    if (Array.isArray(images) && images.length > 0) {
      db.run("DELETE FROM listing_images WHERE listing_id = ?", [id]);
      let sort = 0;
      for (const imgUrl of images) {
        if (typeof imgUrl === 'string' && imgUrl.trim()) {
          db.run(
            "INSERT INTO listing_images (listing_id, image_url, sort_order) VALUES (?, ?, ?)",
            [id, imgUrl.trim(), sort++]
          );
        }
      }
    }

    saveDb();

    return res.json({ message: 'Listing updated successfully.' });
  } catch (error) {
    console.error('Update listing error:', error);
    return res.status(500).json({ error: 'Failed to update listing.' });
  }
});

// PATCH /api/listings/:id/status (Mark as sold / active toggle)
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['active', 'sold'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or sold.' });
    }

    const db = await getDb();
    const checkStmt = db.prepare("SELECT user_id FROM listings WHERE id = ?");
    checkStmt.bind([id]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ error: 'Listing not found.' });
    }

    const ownerId = checkStmt.getAsObject().user_id as number;
    checkStmt.free();

    if (ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized. You can only modify your own listings.' });
    }

    const now = new Date().toISOString();
    db.run("UPDATE listings SET status = ?, updated_at = ? WHERE id = ?", [status, now, id]);
    saveDb();

    return res.json({ message: `Listing marked as ${status}.`, status });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: 'Failed to update status.' });
  }
});

// DELETE /api/listings/:id (Delete listing - owner only)
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }

    const db = await getDb();
    const checkStmt = db.prepare("SELECT user_id FROM listings WHERE id = ?");
    checkStmt.bind([id]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ error: 'Listing not found.' });
    }

    const ownerId = checkStmt.getAsObject().user_id as number;
    checkStmt.free();

    if (ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized. You can only delete your own listings.' });
    }

    db.run("DELETE FROM listing_images WHERE listing_id = ?", [id]);
    db.run("DELETE FROM favorites WHERE listing_id = ?", [id]);
    db.run("DELETE FROM reports WHERE listing_id = ?", [id]);
    db.run("DELETE FROM listings WHERE id = ?", [id]);

    saveDb();

    return res.json({ message: 'Listing deleted successfully.' });
  } catch (error) {
    console.error('Delete listing error:', error);
    return res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

// GET /api/seller/:username (Public seller profile)
router.get('/seller/:username', async (req: Request, res: Response) => {
  try {
    const username = req.params.username.trim();
    const db = await getDb();

    const stmt = db.prepare(`
      SELECT id, username, created_at
      FROM users
      WHERE LOWER(username) = LOWER(?)
    `);
    stmt.bind([username]);

    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ error: 'Seller not found.' });
    }

    const seller = stmt.getAsObject();
    stmt.free();

    // Get active listings for this seller
    const listStmt = db.prepare(`
      SELECT 
        l.id, l.title, l.price, l.level, l.rank, l.region, l.login_type,
        l.status, l.views, l.created_at,
        (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY sort_order ASC LIMIT 1) as primary_image
      FROM listings l
      WHERE l.user_id = ? AND l.status = 'active'
      ORDER BY l.created_at DESC
    `);
    listStmt.bind([seller.id]);

    const listings: any[] = [];
    while (listStmt.step()) {
      listings.push(listStmt.getAsObject());
    }
    listStmt.free();

    // Count sold listings
    const soldStmt = db.prepare("SELECT COUNT(*) as count FROM listings WHERE user_id = ? AND status = 'sold'");
    soldStmt.bind([seller.id]);
    let soldCount = 0;
    if (soldStmt.step()) {
      soldCount = soldStmt.getAsObject().count as number;
    }
    soldStmt.free();

    return res.json({
      seller: {
        username: seller.username,
        created_at: seller.created_at,
        active_listings_count: listings.length,
        sold_listings_count: soldCount,
      },
      listings
    });
  } catch (error) {
    console.error('Fetch seller profile error:', error);
    return res.status(500).json({ error: 'Failed to load seller profile.' });
  }
});

// GET /api/user/my-listings (Current user's listings)
router.get('/user/my-listings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const stmt = db.prepare(`
      SELECT 
        l.*,
        (SELECT image_url FROM listing_images WHERE listing_id = l.id ORDER BY sort_order ASC LIMIT 1) as primary_image
      FROM listings l
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `);
    stmt.bind([req.user!.id]);

    const listings: any[] = [];
    while (stmt.step()) {
      listings.push(stmt.getAsObject());
    }
    stmt.free();

    return res.json({ listings });
  } catch (error) {
    console.error('Fetch my-listings error:', error);
    return res.status(500).json({ error: 'Failed to fetch your listings.' });
  }
});

// GET /api/user/dashboard-stats (Current user stats)
router.get('/user/dashboard-stats', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.user!.id;

    const statsStmt = db.prepare(`
      SELECT 
        COUNT(*) as total_listings,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_listings,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_listings,
        COALESCE(SUM(views), 0) as total_views
      FROM listings
      WHERE user_id = ?
    `);
    statsStmt.bind([userId]);

    let stats = {
      total_listings: 0,
      active_listings: 0,
      sold_listings: 0,
      total_views: 0
    };

    if (statsStmt.step()) {
      const row = statsStmt.getAsObject();
      stats = {
        total_listings: Number(row.total_listings) || 0,
        active_listings: Number(row.active_listings) || 0,
        sold_listings: Number(row.sold_listings) || 0,
        total_views: Number(row.total_views) || 0
      };
    }
    statsStmt.free();

    return res.json({
      stats,
      profile: {
        id: req.user!.id,
        username: req.user!.username,
        email: req.user!.email,
        whatsapp_number: req.user!.whatsapp_number
      }
    });
  } catch (error) {
    console.error('Fetch dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard stats.' });
  }
});

export default router;
