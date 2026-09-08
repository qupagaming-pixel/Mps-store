import { Listing, User, DashboardStats, SellerProfile, FilterState } from '../types/index.ts';
import { firebaseService } from './firebaseService.ts';
import { auth } from '../firebase.ts';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('ff_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        if (!auth.currentUser) {
          localStorage.removeItem('ff_auth_token');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          }
        }
      }
      throw new Error(data.error || 'An unexpected error occurred');
    }
    return data as T;
  }

  // --- Auth ---

  async register(userData: { username: string; email: string; password: string; whatsapp_number: string }) {
    try {
      // Firebase Authentication + Firestore user record
      const fbUser = await firebaseService.registerWithEmail(userData);
      localStorage.setItem('ff_user_data', JSON.stringify(fbUser));
      return { user: fbUser, token: 'firebase-token', message: 'Registered successfully with Firebase' };
    } catch (fbErr: any) {
      console.warn('[Firebase Auth fallback]', fbErr);
      // Fallback to server auth
      const res = await this.request<{ user: User; token: string; message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (res.token) {
        localStorage.setItem('ff_auth_token', res.token);
      }
      return res;
    }
  }

  async login(credentials: { login: string; password: string }) {
    try {
      const fbUser = await firebaseService.loginWithEmail(credentials.login, credentials.password);
      localStorage.setItem('ff_user_data', JSON.stringify(fbUser));
      return { user: fbUser, token: 'firebase-token', message: 'Logged in successfully with Firebase' };
    } catch (fbErr: any) {
      console.warn('[Firebase Login fallback]', fbErr);
      const res = await this.request<{ user: User; token: string; message: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (res.token) {
        localStorage.setItem('ff_auth_token', res.token);
      }
      return res;
    }
  }

  async loginWithGoogle(): Promise<{ user: User; token: string; message: string }> {
    const fbUser = await firebaseService.loginWithGoogle();
    localStorage.setItem('ff_user_data', JSON.stringify(fbUser));
    return { user: fbUser, token: 'firebase-token', message: 'Logged in with Google' };
  }

  async logout() {
    try {
      await firebaseService.logout();
    } catch {}
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('ff_auth_token');
    localStorage.removeItem('ff_user_data');
  }

  async getMe(): Promise<{ user: User }> {
    if (auth.currentUser) {
      const u = await firebaseService.getCurrentUserProfile(auth.currentUser);
      return { user: u };
    }
    const saved = localStorage.getItem('ff_user_data');
    if (saved) {
      try {
        return { user: JSON.parse(saved) };
      } catch {}
    }
    return this.request<{ user: User }>('/api/auth/me');
  }

  async updateProfile(arg: string | { whatsapp_number: string }) {
    const whatsapp_number = typeof arg === 'string' ? arg : arg.whatsapp_number;
    if (auth.currentUser) {
      await firebaseService.updateProfile(auth.currentUser.uid, whatsapp_number);
      const u = await firebaseService.getCurrentUserProfile(auth.currentUser);
      localStorage.setItem('ff_user_data', JSON.stringify(u));
      return { user: u, token: 'firebase-token', message: 'Profile updated in Firebase' };
    }
    return this.request<{ user: User; token: string; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ whatsapp_number }),
    });
  }

  // --- Listings (Firestore Cloud Persistence) ---

  async getListings(filters: Partial<FilterState> = {}): Promise<{
    listings: Listing[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      return await firebaseService.getListings(filters);
    } catch (e) {
      console.warn('Firestore getListings fallback to server:', e);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.minLevel) params.append('minLevel', filters.minLevel);
      if (filters.maxLevel) params.append('maxLevel', filters.maxLevel);
      if (filters.rank && filters.rank !== 'all') params.append('rank', filters.rank);
      if (filters.region && filters.region !== 'all') params.append('region', filters.region);
      if (filters.loginType && filters.loginType !== 'all') params.append('loginType', filters.loginType);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.page) params.append('page', filters.page.toString());
      return this.request(`/api/listings?${params.toString()}`);
    }
  }

  async getFeaturedListings(): Promise<{ listings: Listing[] }> {
    try {
      return await firebaseService.getFeaturedListings();
    } catch (e) {
      return this.request('/api/listings/featured');
    }
  }

  async getListingById(id: string | number): Promise<{ listing: Listing; seller: SellerProfile }> {
    try {
      return await firebaseService.getListingById(id);
    } catch (e) {
      return this.request(`/api/listings/${id}`);
    }
  }

  async getWhatsAppContactLink(id: string | number): Promise<{ url: string; seller_username: string }> {
    try {
      return await firebaseService.getWhatsAppContactLink(id);
    } catch (e) {
      return this.request(`/api/listings/${id}/contact`);
    }
  }

  async createListing(data: any): Promise<{ message: string; listing_id: string | number }> {
    let currentUser: User | null = null;
    if (auth.currentUser) {
      try {
        currentUser = await firebaseService.getCurrentUserProfile(auth.currentUser);
      } catch {
        currentUser = {
          id: auth.currentUser.uid,
          username: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Seller',
          email: auth.currentUser.email || '',
          whatsapp_number: '',
          created_at: new Date().toISOString()
        };
      }
    } else {
      const saved = localStorage.getItem('ff_user_data');
      if (saved) {
        try {
          currentUser = JSON.parse(saved);
        } catch {}
      }
    }

    if (currentUser) {
      return await firebaseService.createListing(data, currentUser);
    }

    const token = localStorage.getItem('ff_auth_token');
    if (token) {
      return this.request('/api/listings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }

    throw new Error('Please sign in to list your Free Fire account.');
  }

  async updateListing(id: string | number, data: any): Promise<{ message: string }> {
    try {
      return await firebaseService.updateListing(id, data);
    } catch {
      return this.request(`/api/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  }

  async updateListingStatus(id: string | number, status: 'active' | 'sold'): Promise<{ message: string; status: string }> {
    try {
      return await firebaseService.updateListingStatus(id, status);
    } catch {
      return this.request(`/api/listings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    }
  }

  async deleteListing(id: string | number): Promise<{ message: string }> {
    try {
      return await firebaseService.deleteListing(id);
    } catch {
      return this.request(`/api/listings/${id}`, {
        method: 'DELETE',
      });
    }
  }

  // --- Seller Profile ---

  async getSellerProfile(username: string): Promise<{ seller: SellerProfile; listings: Listing[] }> {
    try {
      return await firebaseService.getSellerProfile(username);
    } catch {
      return this.request(`/api/listings/seller/${encodeURIComponent(username)}`);
    }
  }

  // --- User Dashboard ---

  async getMyListings(): Promise<{ listings: Listing[] }> {
    let currentUser: User | null = null;
    if (auth.currentUser) {
      currentUser = await firebaseService.getCurrentUserProfile(auth.currentUser);
    } else {
      const saved = localStorage.getItem('ff_user_data');
      if (saved) currentUser = JSON.parse(saved);
    }

    if (currentUser) {
      try {
        return await firebaseService.getMyListings(currentUser.id);
      } catch {}
    }
    return this.request('/api/listings/user/my-listings');
  }

  async getDashboardStats(): Promise<{ stats: DashboardStats; profile: User }> {
    let currentUser: User | null = null;
    if (auth.currentUser) {
      currentUser = await firebaseService.getCurrentUserProfile(auth.currentUser);
    } else {
      const saved = localStorage.getItem('ff_user_data');
      if (saved) currentUser = JSON.parse(saved);
    }

    if (currentUser) {
      try {
        return await firebaseService.getDashboardStats(currentUser);
      } catch {}
    }
    return this.request('/api/listings/user/dashboard-stats');
  }

  // --- Favorites ---

  async getFavorites(): Promise<{ favorites: Listing[] }> {
    let currentUser: User | null = null;
    if (auth.currentUser) {
      currentUser = await firebaseService.getCurrentUserProfile(auth.currentUser);
    } else {
      const saved = localStorage.getItem('ff_user_data');
      if (saved) currentUser = JSON.parse(saved);
    }

    if (currentUser) {
      try {
        return await firebaseService.getFavorites(currentUser.id);
      } catch {}
    }
    return this.request('/api/favorites');
  }

  async toggleFavorite(listingId: string | number): Promise<{ isFavorite: boolean; message: string }> {
    let currentUser: User | null = null;
    if (auth.currentUser) {
      currentUser = await firebaseService.getCurrentUserProfile(auth.currentUser);
    } else {
      const saved = localStorage.getItem('ff_user_data');
      if (saved) currentUser = JSON.parse(saved);
    }

    if (currentUser) {
      try {
        return await firebaseService.toggleFavorite(currentUser.id, listingId);
      } catch {}
    }
    return this.request('/api/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId }),
    });
  }

  // --- Reports ---

  async submitReport(listingId: string | number, reason: string, description: string): Promise<{ success: boolean; message: string }> {
    let currentUserId: string | number = 'anonymous_user';
    if (auth.currentUser) {
      currentUserId = auth.currentUser.uid;
    } else {
      const saved = localStorage.getItem('ff_user_data');
      if (saved) {
        try {
          currentUserId = JSON.parse(saved).id;
        } catch {}
      }
    }

    try {
      return await firebaseService.submitReport(listingId, currentUserId, reason, description);
    } catch {
      return this.request('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          listing_id: listingId,
          reason,
          description,
        }),
      });
    }
  }

  // --- Reviews & Ratings ---

  async getReviewsForSeller(sellerUsername: string) {
    try {
      return await firebaseService.getReviewsForSeller(sellerUsername);
    } catch {
      return {
        reviews: [],
        summary: { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
      };
    }
  }

  async addReview(data: {
    seller_username: string;
    listing_id?: string | number;
    rating: number;
    title: string;
    comment: string;
  }) {
    let currentUser: User | null = null;
    if (auth.currentUser) {
      currentUser = await firebaseService.getCurrentUserProfile(auth.currentUser);
    } else {
      const saved = localStorage.getItem('ff_user_data');
      if (saved) currentUser = JSON.parse(saved);
    }

    if (!currentUser) {
      throw new Error('Please login to leave a rating and review');
    }

    return await firebaseService.addReview({
      reviewer_user_id: String(currentUser.id),
      reviewer_username: currentUser.username,
      seller_username: data.seller_username,
      listing_id: data.listing_id,
      rating: data.rating,
      title: data.title,
      comment: data.comment
    });
  }

  async updateReview(
    reviewId: string,
    data: {
      rating: number;
      title: string;
      comment: string;
    }
  ) {
    let currentUser: User | null = null;
    if (auth.currentUser) {
      currentUser = await firebaseService.getCurrentUserProfile(auth.currentUser);
    } else {
      const saved = localStorage.getItem('ff_user_data');
      if (saved) currentUser = JSON.parse(saved);
    }

    if (!currentUser) {
      throw new Error('Please login to update your review');
    }

    return await firebaseService.updateReview(reviewId, {
      ...data,
      reviewer_user_id: String(currentUser.id),
      reviewer_username: currentUser.username
    });
  }

  async deleteReview(reviewId: string) {
    let currentUser: User | null = null;
    if (auth.currentUser) {
      currentUser = await firebaseService.getCurrentUserProfile(auth.currentUser);
    } else {
      const saved = localStorage.getItem('ff_user_data');
      if (saved) currentUser = JSON.parse(saved);
    }

    return await firebaseService.deleteReview(
      reviewId,
      currentUser ? String(currentUser.id) : undefined,
      currentUser ? currentUser.username : undefined
    );
  }

  async markReviewHelpful(reviewId: string) {
    try {
      return await firebaseService.markReviewHelpful(reviewId);
    } catch {
      return { helpful_count: 1 };
    }
  }

  async reportReview(reviewId: string, reason: string) {
    try {
      return await firebaseService.reportReview(reviewId, reason);
    } catch {
      return { success: true, message: 'Report submitted' };
    }
  }

  async getMyReviews() {
    let currentUser: User | null = null;
    if (auth.currentUser) {
      currentUser = await firebaseService.getCurrentUserProfile(auth.currentUser);
    } else {
      const saved = localStorage.getItem('ff_user_data');
      if (saved) currentUser = JSON.parse(saved);
    }

    if (!currentUser) {
      return { given: [], received: [] };
    }

    return await firebaseService.getMyReviews(String(currentUser.id), currentUser.username);
  }

  // --- Image Upload (ImgBB API) ---

  async getUploadStatus(): Promise<{ configured: boolean; provider: string; endpoint: string }> {
    try {
      return await this.request('/api/upload/status');
    } catch {
      return { configured: false, provider: 'ImgBB API', endpoint: 'https://api.imgbb.com/1/upload' };
    }
  }

  async uploadImage(image: string, name?: string): Promise<{
    success: boolean;
    url: string;
    display_url: string;
    thumb_url: string;
    delete_url?: string;
    provider: string;
  }> {
    return this.request('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ image, name }),
    });
  }
}

export const api = new ApiService();
