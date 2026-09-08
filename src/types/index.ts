export interface User {
  id: string | number;
  username: string;
  email: string;
  whatsapp_number: string;
  created_at?: string;
  role?: string;
}

export interface Listing {
  id: string | number;
  user_id: string | number;
  title: string;
  price: number;
  level: number;
  rank: string;
  region: string;
  login_type: string;
  description: string;
  skins?: string;
  bundles?: string;
  emotes?: string;
  characters?: string;
  rare_items?: string;
  status: 'active' | 'sold';
  views: number;
  created_at: string;
  updated_at: string;
  seller_username: string;
  seller_whatsapp?: string;
  seller_joined_at?: string;
  seller_active_listings_count?: number;
  seller_rating?: number;
  seller_review_count?: number;
  primary_image: string;
  images?: string[];
  is_favorite?: boolean;
}

export interface RatingSummary {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface Review {
  id: string;
  reviewer_user_id: string;
  reviewer_username: string;
  seller_username: string;
  listing_id?: string | number;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  created_at: string;
  updated_at?: string;
  helpful_count: number;
  reported?: boolean;
}

export interface SellerProfile {
  username: string;
  created_at: string;
  active_listings_count: number;
  sold_listings_count?: number;
  rating?: number;
  review_count?: number;
  rating_summary?: RatingSummary;
  reviews?: Review[];
  other_listings?: Partial<Listing>[];
}

export interface FilterState {
  search: string;
  minPrice: string;
  maxPrice: string;
  minLevel: string;
  maxLevel: string;
  rank: string;
  region: string;
  loginType: string;
  sort: string;
  status: string;
  page: number;
}

export interface DashboardStats {
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  total_views: number;
}
