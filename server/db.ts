import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'marketplace.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Failed to load existing database, creating fresh:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

function initSchema(db: Database) {
  // Create tables according to exact requirements:
  // users, listings, listing_images, favorites, reports
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      level INTEGER NOT NULL,
      rank TEXT NOT NULL,
      region TEXT NOT NULL,
      login_type TEXT NOT NULL,
      description TEXT NOT NULL,
      skins TEXT DEFAULT '',
      bundles TEXT DEFAULT '',
      emotes TEXT DEFAULT '',
      characters TEXT DEFAULT '',
      rare_items TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      views INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS listing_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, listing_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      reporter_user_id INTEGER,
      reason TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
    );
  `);

  // Check if initial demo listings exist, if not populate realistic listings
  const checkUsers = db.exec("SELECT COUNT(*) as count FROM users");
  const userCount = checkUsers[0]?.values[0]?.[0] as number || 0;

  if (userCount === 0) {
    seedDatabase(db);
  }
}

function seedDatabase(db: Database) {
  console.log('Seeding initial marketplace demo accounts...');
  const now = new Date().toISOString();
  const samplePasswordHash = bcrypt.hashSync('demo12345', 10);

  // Seed demo sellers
  const sellers = [
    { username: 'Rajesh_Gamer', email: 'rajesh.gamer@demo.in', whatsapp: '919876543210' },
    { username: 'AmanSlayer', email: 'aman.slayer@demo.in', whatsapp: '919812345678' },
    { username: 'KavitaGaming', email: 'kavita.pro@demo.in', whatsapp: '919823456789' },
    { username: 'RohanFire', email: 'rohan.ff@demo.in', whatsapp: '919834567890' }
  ];

  for (const s of sellers) {
    db.run(
      "INSERT INTO users (username, email, password_hash, whatsapp_number, created_at) VALUES (?, ?, ?, ?, ?)",
      [s.username, s.email, samplePasswordHash, s.whatsapp, now]
    );
  }

  // Realistic sample Free Fire listings
  const demoListings = [
    {
      user_id: 1,
      title: 'Level 72 Grandmaster Account • Evo Draco AK Max • Cobra Bundle',
      price: 4999,
      level: 72,
      rank: 'Grandmaster',
      region: 'India (IND)',
      login_type: 'Google',
      description: 'Selling my main Free Fire account due to university exams. Fully unlocked Blue Flame Draco AK (Max Level 7), Predatory Cobra MP40, Megalodon Alpha Scar. All old Elite passes from Season 8 onwards. Clean history, no bans or warnings.',
      skins: 'AK-47 Blue Flame Draco (Max Lvl 7), MP40 Predatory Cobra (Lvl 5), SCAR Megalodon Alpha, M1014 Green Flame Draco',
      bundles: 'Cobra Rage Bundle, Arctic Blue Bundle, Hip Hop Bundle (Original), Red Criminal, Sakura S1',
      emotes: 'Tea Time, Throne Emote, Flowers of Love, Dab Emote, Pirate Flag, Cobra Dance',
      characters: 'Alok (Max), Chrono, Homer, Dimitri, K, Kelly Awakened, Hayato Firebrand',
      rare_items: 'Season 8-24 Elite Pass Badges, 3x Magic Cubes, 850+ Diamond Royale Vouchers, Rare Weapon Crates',
      status: 'active',
      views: 342,
      images: [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      user_id: 2,
      title: 'Level 68 Master ID • Green Criminal & M1014 Evo Max • Facebook Login',
      price: 3299,
      level: 68,
      rank: 'Master',
      region: 'India (IND)',
      login_type: 'Facebook',
      description: 'Clean Indian server account. Includes Green Criminal Bundle and rare EVO M1014 Dragon. Over 18,000 likes. KD Ratio 4.2 in Ranked Clash Squad. Instant transfer upon WhatsApp communication.',
      skins: 'M1014 Green Flame Draco Max, MP5 Platinum Diva, AWM Duke Swallowtail, Desert Eagle Golden',
      bundles: 'Green Criminal Bundle, Samurai Bundle, Street Boy Bundle, Shadow Earthshaker',
      emotes: 'Captain Booyah, Shoot Dance, Push Up Emote, LOL Emote, FFWC Throne',
      characters: 'Alok, Wukong, Chrono, Steffie, Dasha, Tatsuya',
      rare_items: 'Level 68 Badge, 4 Evolution Stones, 1 Incubator Blueprint',
      status: 'active',
      views: 215,
      images: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1612287233207-6f6a73c1c9aa?auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      user_id: 3,
      title: 'Level 65 Heroic Rank • Bunny Warrior Bundle • Twitter/X Login',
      price: 1999,
      level: 65,
      rank: 'Heroic',
      region: 'India (IND)',
      login_type: 'Twitter / X',
      description: 'Affordable competitive ID ready for rank push. Equipped with Bunny Warrior bundle and multiple Incubator weapon skins. 100% verified gameplay history.',
      skins: 'M4A1 Griffin Fury, UMP Wilderness Hunter, MP40 Carnival Carnage, Groza Great Plunder',
      bundles: 'Bunny Warrior, Golden Sunrise, Night Panther Set, Cyber Bunny',
      emotes: 'Arm Wave, Baby Shark, Hello Emote, Applause, Eat My Dust',
      characters: 'Kelly, Alok, Moco Rebirth, Rafael, Jota',
      rare_items: 'Season 12 Heroic Avatar & Banner, 2 Magic Cube Fragments packages',
      status: 'active',
      views: 128,
      images: [
        'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      user_id: 4,
      title: 'Level 75 Veteran ID • All Old Pass Items • 25,000+ Likes • Google Login',
      price: 7499,
      level: 75,
      rank: 'Grandmaster',
      region: 'India (IND)',
      login_type: 'Google',
      description: 'Collector grade Free Fire account active since 2018. Contains legendary Hip Hop pants, Sakura top, Yellow Criminal, and 5 EVO weapons at level 5+. High level guild master account.',
      skins: 'AK Blue Flame Max, MP40 Cobra Max, XM8 Destiny Guardian Lvl 6, FAMAS Demonic Grin, M1014 Draco Max',
      bundles: 'Sakura Season 1, Hip Hop Season 2, Yellow Criminal, Zombie Samurai, Breakdancer',
      emotes: 'I Heart You, Doge Emote, Throne, FFWC 2019 Trophy, Kung Fu, Money Throw',
      characters: 'All characters unlocked up to latest patch (All level maxed)',
      rare_items: 'Exclusive Season 1 Old Avatars, 15x Evolution Stones, 12,000 Extra Guild Tokens',
      status: 'active',
      views: 580,
      images: [
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      user_id: 1,
      title: 'Level 61 Diamond IV • Budget Starter Account • Alok & Chrono',
      price: 899,
      level: 61,
      rank: 'Diamond IV',
      region: 'India (IND)',
      login_type: 'Google',
      description: 'Ideal starter account for players wanting high level badges and key unlocked abilities without spending thousands. Good collection of gun crates and diamonds left.',
      skins: 'SCAR Cupid, MP40 Lightning Strike, M4A1 Cataclysm, Thompson Time Travellers',
      bundles: 'Modern Jazz, Arctic Blue Casual, Winterland Set, SWAT Soldier',
      emotes: 'High Five, Shake With Me, Provoke, Dab',
      characters: 'Alok, Chrono, Maxim, Ford, Andrew',
      rare_items: '500 Unopened Weapon Crates, Diamond Royale Vouchers',
      status: 'active',
      views: 94,
      images: [
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80'
      ]
    },
    {
      user_id: 2,
      title: 'Level 70 Master Rank • Singapore Region ID • Rare Esports Emotes',
      price: 3799,
      level: 70,
      rank: 'Master',
      region: 'Singapore (SG)',
      login_type: 'Google',
      description: 'Singapore regional Free Fire ID. Can be played seamlessly with low ping across Southeast Asia. High tournament stats and rare global event skins.',
      skins: 'MP40 Royal Flush, AK Flaming Red, AWM Duke Swallowtail, Katana Swordsman Legends',
      bundles: 'Dino Bundle, Toxic-Lime Python, Street Thug, Phoenix Force Esports Jersey',
      emotes: 'Selfie Emote, Dragon Fist, Throne, Sitar Emote, Bhangra',
      characters: 'Alok, Santino, Luna, Iris, Nairi, K',
      rare_items: 'Regional Tournament Badges 2021-2023, Elite Pass Badges',
      status: 'sold',
      views: 412,
      images: [
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1000&q=80'
      ]
    }
  ];

  for (const item of demoListings) {
    db.run(
      `INSERT INTO listings (
        user_id, title, price, level, rank, region, login_type,
        description, skins, bundles, emotes, characters, rare_items,
        status, views, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.user_id, item.title, item.price, item.level, item.rank, item.region, item.login_type,
        item.description, item.skins, item.bundles, item.emotes, item.characters, item.rare_items,
        item.status, item.views, now, now
      ]
    );

    // Get the listing ID
    const res = db.exec("SELECT last_insert_rowid() as id");
    const listingId = res[0]?.values[0]?.[0] as number;

    if (listingId && item.images) {
      let sort = 0;
      for (const img of item.images) {
        db.run(
          "INSERT INTO listing_images (listing_id, image_url, sort_order) VALUES (?, ?, ?)",
          [listingId, img, sort++]
        );
      }
    }
  }

  saveDb();
  console.log('Sample demo accounts seeded successfully.');
}
