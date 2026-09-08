import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ShieldCheck, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2,
  Star,
  MessageSquare,
  Package,
  CheckCircle,
  MessageCircle
} from 'lucide-react';
import { Listing, SellerProfile } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ListingCard } from '../components/ListingCard.tsx';
import { ReviewsSection } from '../components/ReviewsSection.tsx';

interface SellerProfilePageProps {
  username: string;
  onBack: () => void;
  onSelectListing: (id: string | number) => void;
}

export const SellerProfilePage: React.FC<SellerProfilePageProps> = ({
  username,
  onBack,
  onSelectListing,
}) => {
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

  useEffect(() => {
    const fetchSellerData = async () => {
      setLoading(true);
      try {
        const res = await api.getSellerProfile(username);
        setSeller(res.seller);
        setListings(res.listings);
      } catch (err) {
        console.error('Failed to load seller profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSellerData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [username]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Active Member';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return 'Active Member';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-zinc-200 rounded-lg"></div>
        <div className="h-44 bg-zinc-100 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-zinc-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-900">Seller Not Found</h2>
        <p className="text-xs text-zinc-500">
          The requested seller profile does not exist or has been removed.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const activeListings = listings.filter(l => l.status === 'active');
  const soldListings = listings.filter(l => l.status === 'sold');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Browse</span>
      </button>

      {/* Seller Header Banner */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-600 text-white flex items-center justify-center font-extrabold text-2xl font-mono shadow-xs">
              {seller.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                  {seller.username}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Independent Seller
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Member since {formatDate(seller.created_at)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  WhatsApp Direct Trading
                </span>
              </div>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3 border-t md:border-t-0 border-zinc-100 pt-4 md:pt-0 w-full md:w-auto flex-wrap">
            <div className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center min-w-[90px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Active Listings
              </span>
              <span className="text-lg font-extrabold text-zinc-900">
                {activeListings.length}
              </span>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center min-w-[90px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Sold Accounts
              </span>
              <span className="text-lg font-extrabold text-zinc-800">
                {soldListings.length}
              </span>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-center min-w-[90px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block flex items-center justify-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                Rating
              </span>
              <span className="text-lg font-extrabold text-zinc-900">
                {seller.rating ? seller.rating.toFixed(1) : 'New'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Listings vs Reviews */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'listings'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Accounts for Sale ({activeListings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'reviews'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ratings &amp; Reviews ({seller.review_count || 0})</span>
        </button>
      </div>

      {/* Tab 1: Listings Content */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          {activeListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeListings.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onSelect={onSelectListing}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-2">
              <Package className="w-10 h-10 text-zinc-300 mx-auto" />
              <p className="text-sm font-bold text-zinc-800">No active accounts currently available</p>
              <p className="text-xs text-zinc-500">
                This seller does not have any active Free Fire IDs listed right now.
              </p>
            </div>
          )}

          {/* Sold Accounts Section if any */}
          {soldListings.length > 0 && (
            <div className="pt-6 border-t border-zinc-200 space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-zinc-400" />
                <span>Previously Sold Accounts ({soldListings.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                {soldListings.map((item) => (
                  <ListingCard
                    key={item.id}
                    listing={item}
                    onSelect={onSelectListing}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reviews Content */}
      {activeTab === 'reviews' && (
        <ReviewsSection
          sellerUsername={seller.username}
          initialReviews={seller.reviews || []}
          initialSummary={seller.rating_summary}
          onReviewChanged={(updatedReviews, updatedSummary) => {
            setSeller(prev => prev ? {
              ...prev,
              rating: updatedSummary.total > 0 ? updatedSummary.average : undefined,
              review_count: updatedSummary.total,
              rating_summary: updatedSummary,
              reviews: updatedReviews
            } : null);
          }}
        />
      )}
    </div>
  );
};
