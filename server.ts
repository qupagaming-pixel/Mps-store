import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getDb } from './server/db.js';
import authRoutes from './server/routes/authRoutes.js';
import listingRoutes from './server/routes/listingRoutes.js';
import favoriteRoutes from './server/routes/favoriteRoutes.js';
import reportRoutes from './server/routes/reportRoutes.js';
import uploadRoutes from './server/routes/uploadRoutes.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database
  await getDb();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      platform: 'FF ID Seller',
      domain: 'freefireidseller.in',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/listings', listingRoutes);
  app.use('/api/favorites', favoriteRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/upload', uploadRoutes);

  // SEO: robots.txt
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /api/

Sitemap: https://freefireidseller.in/sitemap.xml
`);
  });

  // SEO: sitemap.xml
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const db = await getDb();
      const stmt = db.prepare("SELECT id, updated_at FROM listings WHERE status = 'active' ORDER BY updated_at DESC LIMIT 500");
      const listings: { id: number; updated_at: string }[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        listings.push({ id: row.id as number, updated_at: row.updated_at as string });
      }
      stmt.free();

      const urls = [
        `  <url>
    <loc>https://freefireidseller.in/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
        `  <url>
    <loc>https://freefireidseller.in/accounts</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`,
        `  <url>
    <loc>https://freefireidseller.in/sell</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
        ...listings.map(l => `  <url>
    <loc>https://freefireidseller.in/account/${l.id}</loc>
    <lastmod>${l.updated_at.split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`)
      ];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

      res.type('application/xml');
      res.send(sitemap);
    } catch (err) {
      res.status(500).send('Error generating sitemap');
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FF ID Seller server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
