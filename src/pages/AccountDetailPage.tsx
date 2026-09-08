import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Share2, 
  AlertTriangle, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  ChevronLeft, 
  Eye, 
  Check, 
  Sparkles,
  Layers,
  Smile,
  Users2,
  Star,
  Info,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { Listing, SellerProfile } from '../types/index.ts';
import { api } from '../services/api.ts';
import { WhatsAppButton } from '../components/WhatsAppButton.tsx';
import { ReportModal } from '../components/ReportModal.tsx';
import { ListingCard } from '../components/ListingCard.tsx';
import { ImageSlider } from '../components/ImageSlider.tsx';
import { ReviewsSection } from '../components/ReviewsSection.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface AccountDetailPageProps {
  listingId: string | number;
  onBack: () => void;
  onSelectListing: (id: string | number) => void;
  onSellerClick: (username: string) => void;
}

export const AccountDetailPage: React.FC<AccountDetailPageProps> = ({
  listingId,
  onBack,
  onSelectListing,
  onSellerClick,
}) => {
  const { user, openAuthModal } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await api.getListingById(listingId);
        setListing(res.listing);
        setSeller(res.seller);
        setIsFavorite(res.listing.is_favorite || false);
      } catch (err) {
        console.error('Failed to load listing details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [listingId]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (favLoading || !listing) return;
    setFavLoading(true);
    try {
      const res = await api.toggleFavorite(listing.id);
      setIsFavorite(res.isFavorite);
    } catch (err) {
      console.error(err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatListingDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-6 w-32 bg-zinc-200 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-96 bg-zinc-100 rounded-2xl"></div>
          <div className="lg:col-span-5 space-y-4">
            <div className="h-8 bg-zinc-200 rounded-lg w-3/4"></div>
            <div className="h-6 bg-zinc-200 rounded-lg w-1/3"></div>
            <div className="h-40 bg-zinc-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-900">Listing Not Found</h2>
        <p className="text-xs text-zinc-500">
          This account listing may have been removed or marked as sold.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const allImages = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : [listing.primary_image];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Top Breadcrumb & Share Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Browse</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShare}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            title="Copy Listing Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={handleFavoriteToggle}
            disabled={favLoading}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs ${
              isFavorite
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
            <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Primary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 Cols): Image Gallery, Specs, Cosmetics, Seller Notes */}
        <div className="lg:col-span-7 space-y-6">
          {/* Image Slider / Gallery with mobile swipe and full-screen lightbox */}
          <ImageSlider
            images={allImages}
            title={listing.title}
            level={listing.level}
            rank={listing.rank}
            isSold={listing.status === 'sold'}
          />

          {/* Account Overview & Technical Specs */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">
                Account Specifications &amp; Overview
              </h3>
              <span className="text-[11px] font-semibold text-zinc-400">
                Listed: {formatListingDate(listing.created_at)}
              </span>
            </div>

            {/* Key Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Level</span>
                <p className="text-base font-extrabold text-zinc-900 mt-0.5">{listing.level}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Rank</span>
                <p className="text-base font-extrabold text-zinc-900 mt-0.5 truncate">{listing.rank}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Region</span>
                <p className="text-base font-extrabold text-zinc-900 mt-0.5 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{listing.region}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Login Method</span>
                <p className="text-base font-extrabold text-zinc-900 mt-0.5">{listing.login_type}</p>
              </div>
            </div>

            {/* In-game Inventory Breakdown */}
            <div className="space-y-4 pt-1">
              {listing.skins && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    Highlighted Gun Skins
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.skins.split(',').map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-orange-50/70 border border-orange-200/60 text-orange-950 font-medium">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {listing.bundles && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    Rare Bundles &amp; Outfits
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.bundles.split(',').map((b, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200/80 text-zinc-800 font-medium">
                        {b.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {listing.emotes && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-amber-500" />
                    Emotes &amp; Animations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.emotes.split(',').map((e, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200/80 text-zinc-800 font-medium">
                        {e.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {listing.characters && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 text-blue-500" />
                    Characters
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.characters.split(',').map((c, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200/80 text-zinc-800 font-medium">
                        {c.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seller's Notes */}
            <div className="pt-3 border-t border-zinc-100">
              <span className="text-xs font-bold text-zinc-700 block mb-1.5">
                Seller's Detailed Notes
              </span>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line bg-zinc-50/70 p-4 rounded-xl border border-zinc-200/70">
                {listing.description || 'No additional notes provided by the seller.'}
              </p>
            </div>
          </div>

          {/* Reviews & Ratings Section */}
          <ReviewsSection
            sellerUsername={listing.seller_username}
            listingId={listing.id}
            initialReviews={seller?.reviews || []}
            initialSummary={seller?.rating_summary}
            onReviewChanged={(updatedReviews, updatedSummary) => {
              setSeller(prev => prev ? {
                ...prev,
                rating: updatedSummary.total > 0 ? updatedSummary.average : undefined,
                review_count: updatedSummary.total,
                rating_summary: updatedSummary,
                reviews: updatedReviews
              } : null);
              setListing(prev => prev ? {
                ...prev,
                seller_rating: updatedSummary.total > 0 ? updatedSummary.average : undefined,
                seller_review_count: updatedSummary.total
              } : null);
            }}
          />
        </div>

        {/* RIGHT COLUMN (5 Cols): Price Card, WhatsApp CTA, Seller Card, Safety Guidance */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Action Box */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                <span className="font-semibold">Listing ID: #{listing.id}</span>
                <span className="flex items-center gap-1 font-medium">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  {listing.views || 1} views
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-zinc-950 leading-tight">
                {listing.title}
              </h1>

              <div className="mt-3 flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight font-display">
                  ₹{listing.price.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  0% Broker Fee
                </span>
              </div>

              <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                <span>Independent Seller Listing</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Direct WhatsApp Deal
                </span>
              </div>
            </div>

            {/* Primary Action Button: WhatsApp */}
            <div className="pt-2 space-y-2">
              <WhatsAppButton
                listingId={listing.id}
                listingTitle={listing.title}
                price={listing.price}
                isSold={listing.status === 'sold'}
                size="lg"
              />
              <p className="text-center text-[11px] text-zinc-400 font-medium">
                ⚡ Direct communication with seller • No intermediary charges
              </p>
            </div>

            {/* How to Trade More Carefully Guide (Neutral Educational Guidance) */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>How to Trade More Carefully:</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-zinc-600 pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Inspect in Lobby:</strong> Ask the seller to invite you to an in-game squad lobby to verify Gun Skins, Bundles, and Badges in real-time.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Security Check:</strong> Never share external OTP verification numbers or personal banking credentials.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-orange-500 font-bold">•</span>
                  <span><strong>Credentials Transfer:</strong> Change recovery phone, backup email address, and 2-step verification immediately upon account handover.</span>
                </li>
              </ul>
            </div>

            {/* Report Listing Button */}
            <div className="pt-2 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Report this listing</span>
              </button>
            </div>
          </div>

          {/* Seller Information Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Seller Profile &amp; Reputation
            </h4>

            <div className="flex items-center justify-between">
              <div
                onClick={() => onSellerClick(listing.seller_username)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-lg text-zinc-800 group-hover:border-orange-500 transition-colors">
                  {listing.seller_username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-zinc-900 group-hover:text-orange-600 transition-colors flex items-center gap-1.5">
                    <span>{listing.seller_username}</span>
                  </h5>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {seller?.review_count && seller.review_count > 0 && seller?.rating ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{seller.rating.toFixed(1)}</span>
                        <span className="text-zinc-500 font-normal">({seller.review_count} review{seller.review_count === 1 ? '' : 's'})</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                        <Star className="w-3 h-3 text-zinc-400" />
                        <span>New Seller (0 reviews)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSellerClick(listing.seller_username)}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors cursor-pointer shadow-2xs"
              >
                View Profile
              </button>
            </div>

            <div className="pt-3 border-t border-zinc-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Active Listings</span>
                <span className="font-bold text-zinc-800">
                  {seller?.active_listings_count || 1} available
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">Privacy</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Number Protected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller's Other Listings */}
      {seller?.other_listings && seller.other_listings.length > 1 && (
        <div className="pt-10 border-t border-zinc-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-zinc-900">
              More Listings from {listing.seller_username}
            </h3>
            <button
              onClick={() => onSellerClick(listing.seller_username)}
              className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            >
              See all ({seller.active_listings_count})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {seller.other_listings
              .filter(item => String(item.id) !== String(listing.id))
              .slice(0, 3)
              .map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item as Listing}
                  onSelect={onSelectListing}
                  onSellerClick={onSellerClick}
                />
              ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        listingId={listing.id}
        listingTitle={listing.title}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
};
