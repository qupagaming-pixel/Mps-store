import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth, googleProvider } from '../firebase.ts';
import { Listing, User, DashboardStats, SellerProfile, FilterState, Review, RatingSummary } from '../types/index.ts';

const LISTINGS_COLLECTION = 'listings';
const USERS_COLLECTION = 'users';
const FAVORITES_COLLECTION = 'favorites';
const REPORTS_COLLECTION = 'reports';
const REVIEWS_COLLECTION = 'reviews';

const INITIAL_DEMO_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    reviewer_user_id: 'buyer_vikram',
    reviewer_username: 'Vikram_YT',
    seller_username: 'Rajesh_Gamer',
    listing_id: 'ff_acc_1',
    rating: 5,
    title: 'Super smooth transfer and verified Draco AK Max!',
    comment: 'Contacted Rajesh on WhatsApp. He invited me to squad lobby to inspect the weapon vault live before transfer. Changed recovery phone number and 2FA immediately. 100% recommended seller!',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    helpful_count: 8,
    reported: false
  },
  {
    id: 'rev_2',
    reviewer_user_id: 'buyer_deepak',
    reviewer_username: 'Deepak_Pro',
    seller_username: 'Rajesh_Gamer',
    listing_id: 'ff_acc_1',
    rating: 5,
    title: 'Fast reply and genuine account',
    comment: 'Deal completed within 15 minutes over WhatsApp. No commission paid, clear communication. The Cobra bundle and old passes are completely intact.',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    helpful_count: 4,
    reported: false
  },
  {
    id: 'rev_3',
    reviewer_user_id: 'buyer_sahil',
    reviewer_username: 'SahilFF',
    seller_username: 'AmanSlayer',
    listing_id: 'ff_acc_2',
    rating: 5,
    title: 'M1014 Evo Max account as promised',
    comment: 'Aman was very transparent about the account details and login type. Guided me step by step during the credential change.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    helpful_count: 5,
    reported: false
  },
  {
    id: 'rev_4',
    reviewer_user_id: 'buyer_karan',
    reviewer_username: 'KaranGamer',
    seller_username: 'KavitaGaming',
    listing_id: 'ff_acc_3',
    rating: 4,
    title: 'Good Heroic ID at fair price',
    comment: 'The account was exactly as shown in the screenshot gallery. Smooth negotiation on WhatsApp.',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    helpful_count: 2,
    reported: false
  }
];

// Initial realistic Free Fire account dataset for Firebase Firestore seeding
const INITIAL_DEMO_LISTINGS: Omit<Listing, 'id'>[] = [
  {
    user_id: 'seller_rajesh',
    seller_username: 'Rajesh_Gamer',
    seller_whatsapp: '919876543210',
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
    primary_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1000&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    user_id: 'seller_aman',
    seller_username: 'AmanSlayer',
    seller_whatsapp: '919812345678',
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
    primary_image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1612287233207-6f6a73c1c9aa?auto=format&fit=crop&w=1000&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    user_id: 'seller_kavita',
    seller_username: 'KavitaGaming',
    seller_whatsapp: '919823456789',
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
    primary_image: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    user_id: 'seller_rohan',
    seller_username: 'RohanFire',
    seller_whatsapp: '919834567890',
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
    primary_image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    user_id: 'seller_rajesh',
    seller_username: 'Rajesh_Gamer',
    seller_whatsapp: '919876543210',
    title: 'Level 61 Diamond IV • Budget Starter Account • Alok & Chrono',
    price: 899,
    level: 61,
    rank: 'Diamond IV',
    region: 'India (IND)',
    login_type: 'Google',
    description: 'Ideal starter account for players wanting high level badges and key unlocked abilities without spending thousands. Good collection of gun crates and diamonds left.',
    skins: 'SCAR Cupid, MP40 Lightning Strike, M4A1 Cataclysm, Thompson Time Travellers',
    bundles: 'Modern Jazz, Arctic Blue Casual, Winterland Set, SWAT Soldier',
    emotes: 'Dab, Hello, Wave, High Five',
    characters: 'Alok, Chrono, Maxim, Kla, Kelly',
    rare_items: '500 Diamond Vouchers, Elite badge crate',
    status: 'active',
    views: 94,
    primary_image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    user_id: 'seller_aman',
    seller_username: 'AmanSlayer',
    seller_whatsapp: '919812345678',
    title: 'Level 69 Master ID • MP40 Predatory Cobra • Sold Demo Item',
    price: 2499,
    level: 69,
    rank: 'Master',
    region: 'India (IND)',
    login_type: 'Facebook',
    description: 'Account successfully handed over to buyer via direct WhatsApp deal. Marked as sold for transparency.',
    skins: 'MP40 Cobra Lvl 6, M1887 Rapper Underworld, AK Flamingo',
    bundles: 'Street Boy, Hip Hop Pants, Shadow Earthshaker',
    emotes: 'Tea Time, Push Up, Cobra Emote',
    characters: 'Alok, Tatsuya, K, Chrono',
    rare_items: 'Master Badge, 2 Evolution Stones',
    status: 'sold',
    views: 412,
    primary_image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1000&q=80'
    ],
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

let isSeeding = false;
let seededPromise: Promise<void> | null = null;

export class FirebaseService {
  /**
   * Auto-seed Firestore collection if it's currently empty
   */
  async ensureSeeded(): Promise<void> {
    if (seededPromise) return seededPromise;

    seededPromise = (async () => {
      try {
        const colRef = collection(db, LISTINGS_COLLECTION);
        const snapshot = await getDocs(query(colRef, limit(1)));
        if (snapshot.empty && !isSeeding) {
          isSeeding = true;
          console.log('[Firebase] Seeding initial Free Fire accounts to Cloud Firestore...');
          for (let i = 0; i < INITIAL_DEMO_LISTINGS.length; i++) {
            const item = INITIAL_DEMO_LISTINGS[i];
            const customId = `ff_acc_${i + 1}`;
            await setDoc(doc(db, LISTINGS_COLLECTION, customId), {
              ...item,
              id: customId
            });
          }
          console.log('[Firebase] Cloud Firestore listings seeding complete.');
        }

        // Check reviews
        const revCol = collection(db, REVIEWS_COLLECTION);
        const revSnap = await getDocs(query(revCol, limit(1)));
        if (revSnap.empty) {
          console.log('[Firebase] Seeding initial reviews to Cloud Firestore...');
          for (let i = 0; i < INITIAL_DEMO_REVIEWS.length; i++) {
            const r = INITIAL_DEMO_REVIEWS[i];
            await setDoc(doc(db, REVIEWS_COLLECTION, r.id), r);
          }
        }
      } catch (err) {
        console.warn('[Firebase] Firestore auto-seed check skipped or failed:', err);
      } finally {
        isSeeding = false;
      }
    })();

    return seededPromise;
  }

  calculateRatingSummary(reviews: Review[]): RatingSummary {
    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach(r => {
      const val = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))) as 1 | 2 | 3 | 4 | 5;
      sum += Number(r.rating) || 5;
      distribution[val] = (distribution[val] || 0) + 1;
    });
    const average = Number((sum / reviews.length).toFixed(1));
    return {
      average,
      total: reviews.length,
      distribution
    };
  }

  async getSellerRatingMap(): Promise<Record<string, { rating: number; count: number }>> {
    try {
      const revSnap = await getDocs(collection(db, REVIEWS_COLLECTION));
      const map: Record<string, { sum: number; count: number }> = {};
      revSnap.docs.forEach(d => {
        const data = d.data();
        const s = (data.seller_username || '').toLowerCase();
        if (!s || data.reported) return;
        if (!map[s]) map[s] = { sum: 0, count: 0 };
        map[s].sum += Number(data.rating) || 5;
        map[s].count += 1;
      });
      const result: Record<string, { rating: number; count: number }> = {};
      for (const k in map) {
        result[k] = {
          rating: Number((map[k].sum / map[k].count).toFixed(1)),
          count: map[k].count
        };
      }
      return result;
    } catch {
      return {};
    }
  }

  // --- AUTHENTICATION ---

  async loginWithEmail(emailOrUser: string, pass: string): Promise<User> {
    let email = emailOrUser.trim();
    if (!email.includes('@')) {
      // If user typed username, find email in Firestore
      try {
        const q = query(collection(db, USERS_COLLECTION), where('username', '==', emailOrUser));
        const snap = await getDocs(q);
        if (!snap.empty) {
          email = snap.docs[0].data().email;
        } else {
          email = `${emailOrUser.toLowerCase().replace(/[^a-z0-9]/g, '')}@freefireidseller.in`;
        }
      } catch {
        email = `${emailOrUser.toLowerCase().replace(/[^a-z0-9]/g, '')}@freefireidseller.in`;
      }
    }

    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, cred.user.uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: cred.user.uid,
        username: data.username || cred.user.displayName || 'Gamer',
        email: cred.user.email || '',
        whatsapp_number: data.whatsapp_number || '',
        created_at: data.created_at || new Date().toISOString()
      };
    }

    return {
      id: cred.user.uid,
      username: cred.user.displayName || email.split('@')[0],
      email: cred.user.email || email,
      whatsapp_number: '',
      created_at: new Date().toISOString()
    };
  }

  async registerWithEmail(u: { username: string; email: string; password: string; whatsapp_number: string }): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, u.email.trim(), u.password);
    
    await firebaseUpdateProfile(cred.user, {
      displayName: u.username.trim()
    });

    const userData: User = {
      id: cred.user.uid,
      username: u.username.trim(),
      email: u.email.trim(),
      whatsapp_number: u.whatsapp_number.trim(),
      created_at: new Date().toISOString()
    };

    // Store in Firestore users collection
    await setDoc(doc(db, USERS_COLLECTION, cred.user.uid), userData);
    return userData;
  }

  async loginWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    const userDocRef = doc(db, USERS_COLLECTION, fbUser.uid);
    const userSnap = await getDoc(userDocRef);

    let user: User;
    if (userSnap.exists()) {
      const data = userSnap.data();
      user = {
        id: fbUser.uid,
        username: data.username || fbUser.displayName || 'Gamer',
        email: fbUser.email || '',
        whatsapp_number: data.whatsapp_number || '',
        created_at: data.created_at || new Date().toISOString()
      };
    } else {
      user = {
        id: fbUser.uid,
        username: fbUser.displayName?.replace(/\s+/g, '_') || `Gamer_${fbUser.uid.slice(0, 5)}`,
        email: fbUser.email || '',
        whatsapp_number: '',
        created_at: new Date().toISOString()
      };
      await setDoc(userDocRef, user);
    }

    return user;
  }

  async logout(): Promise<void> {
    await firebaseSignOut(auth);
  }

  async getCurrentUserProfile(fbUser: FirebaseUser): Promise<User> {
    try {
      const userSnap = await getDoc(doc(db, USERS_COLLECTION, fbUser.uid));
      if (userSnap.exists()) {
        const d = userSnap.data();
        return {
          id: fbUser.uid,
          username: d.username || fbUser.displayName || 'Gamer',
          email: fbUser.email || d.email || '',
          whatsapp_number: d.whatsapp_number || '',
          created_at: d.created_at || new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Error fetching Firestore user profile:', e);
    }

    return {
      id: fbUser.uid,
      username: fbUser.displayName || fbUser.email?.split('@')[0] || 'Gamer',
      email: fbUser.email || '',
      whatsapp_number: '',
      created_at: new Date().toISOString()
    };
  }

  async updateProfile(userId: string, whatsapp_number: string): Promise<void> {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      whatsapp_number: whatsapp_number.replace(/\D/g, '')
    });
  }

  // --- LISTINGS CRUD ---

  async getListings(filters: Partial<FilterState> = {}): Promise<{
    listings: Listing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    await this.ensureSeeded();

    try {
      const colRef = collection(db, LISTINGS_COLLECTION);
      const snap = await getDocs(colRef);

      let all: Listing[] = snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
        } as Listing;
      });

      // Filter in memory for robust query support (matches all substrings & multi-faceted criteria)
      if (filters.status && filters.status !== 'all') {
        all = all.filter(l => l.status === filters.status);
      }

      if (filters.search) {
        const s = filters.search.toLowerCase();
        all = all.filter(l => 
          l.title.toLowerCase().includes(s) ||
          (l.description && l.description.toLowerCase().includes(s)) ||
          (l.skins && l.skins.toLowerCase().includes(s)) ||
          (l.bundles && l.bundles.toLowerCase().includes(s)) ||
          (l.emotes && l.emotes.toLowerCase().includes(s)) ||
          (l.rank && l.rank.toLowerCase().includes(s)) ||
          String(l.id).includes(s)
        );
      }

      if (filters.minPrice) {
        const min = Number(filters.minPrice);
        all = all.filter(l => l.price >= min);
      }
      if (filters.maxPrice) {
        const max = Number(filters.maxPrice);
        all = all.filter(l => l.price <= max);
      }

      if (filters.minLevel) {
        const minLvl = Number(filters.minLevel);
        all = all.filter(l => l.level >= minLvl);
      }
      if (filters.maxLevel) {
        const maxLvl = Number(filters.maxLevel);
        all = all.filter(l => l.level <= maxLvl);
      }

      if (filters.rank && filters.rank !== 'all') {
        all = all.filter(l => l.rank.toLowerCase() === filters.rank?.toLowerCase());
      }
      if (filters.region && filters.region !== 'all') {
        all = all.filter(l => l.region.toLowerCase() === filters.region?.toLowerCase());
      }
      if (filters.loginType && filters.loginType !== 'all') {
        all = all.filter(l => l.login_type.toLowerCase() === filters.loginType?.toLowerCase());
      }

      // Sort
      const sort = filters.sort || 'newest';
      all.sort((a, b) => {
        if (sort === 'price_asc') return a.price - b.price;
        if (sort === 'price_desc') return b.price - a.price;
        if (sort === 'level_desc') return b.level - a.level;
        if (sort === 'views_desc') return b.views - a.views;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      const ratingMap = await this.getSellerRatingMap();
      all = all.map(l => {
        const s = (l.seller_username || '').toLowerCase();
        const rInfo = ratingMap[s];
        return {
          ...l,
          seller_rating: rInfo ? rInfo.rating : undefined,
          seller_review_count: rInfo ? rInfo.count : 0
        };
      });

      const total = all.length;
      const page = Math.max(1, filters.page || 1);
      const limitNum = 12;
      const totalPages = Math.max(1, Math.ceil(total / limitNum));
      const start = (page - 1) * limitNum;
      const paginated = all.slice(start, start + limitNum);

      return {
        listings: paginated,
        total,
        page,
        limit: limitNum,
        totalPages
      };
    } catch (err) {
      console.error('[Firebase] Failed to fetch listings from Firestore:', err);
      return { listings: [], total: 0, page: 1, limit: 12, totalPages: 1 };
    }
  }

  async getFeaturedListings(): Promise<{ listings: Listing[] }> {
    await this.ensureSeeded();

    try {
      const colRef = collection(db, LISTINGS_COLLECTION);
      const snap = await getDocs(colRef);
      const ratingMap = await this.getSellerRatingMap();
      const all: Listing[] = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as Listing))
        .filter(l => l.status === 'active')
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 6)
        .map(l => {
          const s = (l.seller_username || '').toLowerCase();
          const rInfo = ratingMap[s];
          return {
            ...l,
            seller_rating: rInfo ? rInfo.rating : undefined,
            seller_review_count: rInfo ? rInfo.count : 0
          };
        });

      return { listings: all };
    } catch (e) {
      console.error('[Firebase] Error getting featured listings:', e);
      return { listings: [] };
    }
  }

  async getListingById(id: string | number): Promise<{ listing: Listing; seller: SellerProfile }> {
    await this.ensureSeeded();

    const docId = String(id);
    const docRef = doc(db, LISTINGS_COLLECTION, docId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error(`Listing #${id} not found in Firestore`);
    }

    // Increment view count asynchronously
    updateDoc(docRef, { views: increment(1) }).catch(() => {});

    const listing = { ...snap.data(), id: snap.id } as Listing;
    listing.views = (listing.views || 0) + 1;

    // Fetch seller profile
    let activeCount = 1;
    try {
      const sellerQ = query(
        collection(db, LISTINGS_COLLECTION),
        where('seller_username', '==', listing.seller_username),
        where('status', '==', 'active')
      );
      const sSnap = await getDocs(sellerQ);
      activeCount = sSnap.size;
    } catch {}

    const { reviews, summary } = await this.getReviewsForSeller(listing.seller_username);
    listing.seller_rating = summary.total > 0 ? summary.average : undefined;
    listing.seller_review_count = summary.total;

    const seller: SellerProfile = {
      username: listing.seller_username,
      created_at: listing.seller_joined_at || listing.created_at,
      active_listings_count: activeCount,
      rating: summary.total > 0 ? summary.average : undefined,
      review_count: summary.total,
      rating_summary: summary,
      reviews: reviews
    };

    return { listing, seller };
  }

  async createListing(data: any, currentUser: User): Promise<{ message: string; listing_id: string }> {
    await this.ensureSeeded();

    const now = new Date().toISOString();
    const images: string[] = Array.isArray(data.images) && data.images.length > 0 
      ? data.images 
      : ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80'];

    const newDocRef = doc(collection(db, LISTINGS_COLLECTION));
    const newDoc: any = {
      id: newDocRef.id,
      user_id: currentUser.id,
      seller_id: currentUser.id,
      seller_username: currentUser.username,
      seller_whatsapp: currentUser.whatsapp_number || '',
      title: data.title.trim(),
      price: Number(data.price),
      level: Number(data.level) || 50,
      rank: data.rank || 'Heroic',
      region: data.region || 'India (IND)',
      login_type: data.login_type || 'Google',
      description: data.description ? data.description.trim() : '',
      skins: data.skins || '',
      bundles: data.bundles || '',
      emotes: data.emotes || '',
      characters: data.characters || '',
      rare_items: data.rare_items || '',
      status: 'active',
      views: 0,
      primary_image: images[0],
      images: images,
      created_at: now,
      updated_at: now
    };

    await setDoc(newDocRef, newDoc);

    return {
      message: 'Free Fire ID listed successfully on Cloud Firestore',
      listing_id: newDocRef.id
    };
  }

  async updateListing(id: string | number, data: any): Promise<{ message: string }> {
    const docRef = doc(db, LISTINGS_COLLECTION, String(id));
    const updates: any = {
      ...data,
      updated_at: new Date().toISOString()
    };
    if (data.price) updates.price = Number(data.price);
    if (data.level) updates.level = Number(data.level);

    await updateDoc(docRef, updates);
    return { message: 'Listing updated in Cloud Firestore' };
  }

  async updateListingStatus(id: string | number, status: 'active' | 'sold'): Promise<{ message: string; status: string }> {
    const docRef = doc(db, LISTINGS_COLLECTION, String(id));
    await updateDoc(docRef, {
      status,
      updated_at: new Date().toISOString()
    });
    return { message: `Listing marked as ${status}`, status };
  }

  async deleteListing(id: string | number): Promise<{ message: string }> {
    await deleteDoc(doc(db, LISTINGS_COLLECTION, String(id)));
    return { message: 'Listing removed from Cloud Firestore' };
  }

  async getWhatsAppContactLink(id: string | number): Promise<{ url: string; seller_username: string }> {
    const { listing } = await this.getListingById(id);
    let rawPhone = listing.seller_whatsapp || '919876543210';
    let cleanNumber = rawPhone.replace(/\D/g, '');
    if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }

    const prefilledText = `Hello ${listing.seller_username}, I saw your Free Fire account listing #${listing.id} on freefireidseller.in: "${listing.title}" for ₹${listing.price.toLocaleString('en-IN')}. Is this account still available? I would like to verify the details.`;
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(prefilledText)}`;

    return {
      url: whatsappUrl,
      seller_username: listing.seller_username
    };
  }

  // --- DASHBOARD & SELLER PROFILE ---

  async getMyListings(userId: string | number): Promise<{ listings: Listing[] }> {
    await this.ensureSeeded();

    const colRef = collection(db, LISTINGS_COLLECTION);
    const snap = await getDocs(colRef);
    const userStr = String(userId);

    const mine = snap.docs
      .map(d => ({ ...d.data(), id: d.id } as Listing))
      .filter(l => String(l.user_id) === userStr)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { listings: mine };
  }

  async getDashboardStats(currentUser: User): Promise<{ stats: DashboardStats; profile: User }> {
    const { listings } = await this.getMyListings(currentUser.id);
    const total_listings = listings.length;
    const active_listings = listings.filter(l => l.status === 'active').length;
    const sold_listings = listings.filter(l => l.status === 'sold').length;
    const total_views = listings.reduce((acc, curr) => acc + (curr.views || 0), 0);

    return {
      stats: {
        total_listings,
        active_listings,
        sold_listings,
        total_views
      },
      profile: currentUser
    };
  }

  async getSellerProfile(username: string): Promise<{ seller: SellerProfile; listings: Listing[] }> {
    await this.ensureSeeded();

    const colRef = collection(db, LISTINGS_COLLECTION);
    const snap = await getDocs(colRef);
    const sellerListings = snap.docs
      .map(d => ({ ...d.data(), id: d.id } as Listing))
      .filter(l => l.seller_username?.toLowerCase() === username.toLowerCase());

    const activeCount = sellerListings.filter(l => l.status === 'active').length;
    const soldCount = sellerListings.filter(l => l.status === 'sold').length;

    const { reviews, summary } = await this.getReviewsForSeller(username);

    const seller: SellerProfile = {
      username,
      created_at: sellerListings[0]?.created_at || new Date().toISOString(),
      active_listings_count: activeCount,
      sold_listings_count: soldCount,
      rating: summary.total > 0 ? summary.average : undefined,
      review_count: summary.total,
      rating_summary: summary,
      reviews: reviews,
      other_listings: sellerListings
    };

    return { seller, listings: sellerListings };
  }

  // --- REVIEWS & RATINGS ---

  async getReviewsForSeller(sellerUsername: string): Promise<{ reviews: Review[]; summary: RatingSummary }> {
    await this.ensureSeeded();
    try {
      const revCol = collection(db, REVIEWS_COLLECTION);
      const snap = await getDocs(revCol);
      const lower = (sellerUsername || '').toLowerCase();
      const reviews: Review[] = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as Review))
        .filter(r => (r.seller_username || '').toLowerCase() === lower && !r.reported)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const summary = this.calculateRatingSummary(reviews);
      return { reviews, summary };
    } catch (err) {
      console.error('Error fetching reviews for seller:', err);
      return {
        reviews: [],
        summary: { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
      };
    }
  }

  async addReview(data: {
    reviewer_user_id: string;
    reviewer_username: string;
    seller_username: string;
    listing_id?: string | number;
    rating: number;
    title: string;
    comment: string;
  }): Promise<{ message: string; review: Review }> {
    await this.ensureSeeded();

    const reviewerLower = (data.reviewer_username || '').trim().toLowerCase();
    const sellerLower = (data.seller_username || '').trim().toLowerCase();

    // Prevent seller from reviewing themselves
    if (reviewerLower === sellerLower) {
      throw new Error('Sellers cannot leave reviews on their own accounts or profile.');
    }

    // Check if user already reviewed this seller (1 review per user per seller)
    const revCol = collection(db, REVIEWS_COLLECTION);
    const revSnap = await getDocs(revCol);
    const existing = revSnap.docs
      .map(d => ({ ...d.data(), id: d.id } as Review))
      .find(r => 
        (r.seller_username || '').toLowerCase() === sellerLower &&
        (
          (r.reviewer_user_id && r.reviewer_user_id === data.reviewer_user_id) ||
          (r.reviewer_username && r.reviewer_username.toLowerCase() === reviewerLower)
        ) &&
        !r.reported
      );

    if (existing) {
      throw new Error('You have already submitted a review for this seller. Please edit your existing review instead.');
    }

    const newRef = doc(collection(db, REVIEWS_COLLECTION));
    const reviewDoc: Review = {
      id: newRef.id,
      reviewer_user_id: data.reviewer_user_id,
      reviewer_username: data.reviewer_username.trim(),
      seller_username: data.seller_username.trim(),
      listing_id: data.listing_id ? String(data.listing_id) : '',
      rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
      title: data.title.trim(),
      comment: data.comment.trim(),
      created_at: new Date().toISOString(),
      helpful_count: 0,
      reported: false
    };
    await setDoc(newRef, reviewDoc);
    return {
      message: 'Thank you! Your review has been published.',
      review: reviewDoc
    };
  }

  async updateReview(
    reviewId: string,
    data: {
      rating: number;
      title: string;
      comment: string;
      reviewer_user_id?: string;
      reviewer_username?: string;
    }
  ): Promise<{ message: string; review: Review }> {
    await this.ensureSeeded();
    const ref = doc(db, REVIEWS_COLLECTION, reviewId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('Review not found');
    }
    const current = { ...snap.data(), id: snap.id } as Review;

    // Verify ownership
    if (data.reviewer_user_id && current.reviewer_user_id && current.reviewer_user_id !== data.reviewer_user_id) {
      if (data.reviewer_username && current.reviewer_username?.toLowerCase() !== data.reviewer_username.toLowerCase()) {
        throw new Error('You can only edit your own reviews.');
      }
    }

    const updates = {
      rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
      title: data.title.trim(),
      comment: data.comment.trim(),
      updated_at: new Date().toISOString()
    };

    await updateDoc(ref, updates);

    return {
      message: 'Your review has been successfully updated.',
      review: { ...current, ...updates }
    };
  }

  async deleteReview(
    reviewId: string,
    reviewer_user_id?: string,
    reviewer_username?: string
  ): Promise<{ message: string }> {
    await this.ensureSeeded();
    const ref = doc(db, REVIEWS_COLLECTION, reviewId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { message: 'Review has been removed' };
    }
    const current = snap.data() as Review;

    // Verify ownership
    if (reviewer_user_id && current.reviewer_user_id && current.reviewer_user_id !== reviewer_user_id) {
      if (reviewer_username && current.reviewer_username?.toLowerCase() !== reviewer_username.toLowerCase()) {
        throw new Error('You can only delete your own reviews.');
      }
    }

    await deleteDoc(ref);
    return { message: 'Review deleted successfully' };
  }

  async markReviewHelpful(reviewId: string): Promise<{ helpful_count: number }> {
    const ref = doc(db, REVIEWS_COLLECTION, reviewId);
    await updateDoc(ref, {
      helpful_count: increment(1)
    });
    const snap = await getDoc(ref);
    const updated = snap.data() as Review;
    return { helpful_count: updated?.helpful_count || 1 };
  }

  async reportReview(reviewId: string, _reason: string): Promise<{ success: boolean; message: string }> {
    const ref = doc(db, REVIEWS_COLLECTION, reviewId);
    await updateDoc(ref, {
      reported: true
    });
    return { success: true, message: 'Review reported and submitted to moderation queue' };
  }

  async getMyReviews(userId: string, username: string): Promise<{ given: Review[]; received: Review[] }> {
    await this.ensureSeeded();
    try {
      const snap = await getDocs(collection(db, REVIEWS_COLLECTION));
      const all = snap.docs.map(d => ({ ...d.data(), id: d.id } as Review));
      const userLower = (username || '').toLowerCase();
      const given = all.filter(r => r.reviewer_user_id === userId || (r.reviewer_username || '').toLowerCase() === userLower);
      const received = all.filter(r => (r.seller_username || '').toLowerCase() === userLower);
      return { given, received };
    } catch {
      return { given: [], received: [] };
    }
  }

  // --- FAVORITES ---

  async toggleFavorite(userId: string | number, listingId: string | number): Promise<{ isFavorite: boolean; message: string }> {
    const favId = `${userId}_${listingId}`;
    const favRef = doc(db, FAVORITES_COLLECTION, favId);
    const snap = await getDoc(favRef);

    if (snap.exists()) {
      await deleteDoc(favRef);
      return { isFavorite: false, message: 'Removed from favorites' };
    } else {
      await setDoc(favRef, {
        id: favId,
        user_id: String(userId),
        listing_id: String(listingId),
        created_at: new Date().toISOString()
      });
      return { isFavorite: true, message: 'Saved to favorites' };
    }
  }

  async getFavorites(userId: string | number): Promise<{ favorites: Listing[] }> {
    await this.ensureSeeded();

    const favCol = collection(db, FAVORITES_COLLECTION);
    const favSnap = await getDocs(query(favCol, where('user_id', '==', String(userId))));
    const listingIds = favSnap.docs.map(d => d.data().listing_id);

    if (listingIds.length === 0) {
      return { favorites: [] };
    }

    const { listings } = await this.getListings({ status: 'all' });
    const favs = listings
      .filter(l => listingIds.includes(String(l.id)))
      .map(l => ({ ...l, is_favorite: true }));

    return { favorites: favs };
  }

  // --- REPORTS ---

  async submitReport(listingId: string | number, reporterId: string | number, reason: string, description: string): Promise<{ success: boolean; message: string }> {
    await addDoc(collection(db, REPORTS_COLLECTION), {
      listing_id: String(listingId),
      reporter_id: String(reporterId),
      reason,
      description,
      created_at: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Report submitted to moderation queue'
    };
  }
}

export const firebaseService = new FirebaseService();
