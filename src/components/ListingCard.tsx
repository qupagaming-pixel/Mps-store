import React, { useState } from 'react';
import { 
  Heart, 
  MapPin, 
  Clock, 
  Sparkles, 
  MessageCircle, 
  ChevronRight,
  Star,
  Image as ImageIcon,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { Listing } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ListingCardProps {
  listing: Listing;
  onSelect: (id: string | number) => void;
  onSellerClick?: (username: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onSelect, onSellerClick }) => {
  const { user, openAuthModal } = useAuth();
  const [isFavorite, setIsFavorite] = useState<boolean>(listing.is_favorite || false);
  const [favLoading, setFavLoading] = useState<boolean>(false);

  const formatPrice = (p: number) => {
    return '₹' + p.toLocaleString('en-IN');
  };

  const getRankBadge = (rank: string) => {
    const r = rank.toLowerCase();
    if (r.includes('grandmaster')) {
      return {
        bg: 'bg-amber-500 text-white',
        dot: 'bg-amber-200',
        label: rank
      };
    }
    if (r.includes('master')) {
      return {
        bg: 'bg-purple-600 text-white',
        dot: 'bg-purple-200',
        label: rank
      };
    }
    if (r.includes('heroic')) {
      return {
        bg: 'bg-red-600 text-white',
        dot: 'bg-red-200',
        label: rank
      };
    }
    if (r.includes('diamond')) {
      return {
        bg: 'bg-sky-600 text-white',
        dot: 'bg-sky-200',
        label: rank
      };
    }
    return {
      bg: 'bg-zinc-800 text-white',
      dot: 'bg-zinc-400',
      label: rank
    };
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (favLoading) return;
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

  const handleWhatsAppDirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = listing.seller_whatsapp ? listing.seller_whatsapp.replace(/\D/g, '') : '';
    const text = encodeURIComponent(
      `Hello ${listing.seller_username}, I saw your Free Fire ID listing "${listing.title}" (ID: #${listing.id}, Price: ₹${listing.price.toLocaleString('en-IN')}) on FreeFireIDSeller. Is this account still available for lobby inspection and direct deal?`
    );

    if (phone && phone.length >= 10) {
      const waNumber = phone.startsWith('91') && phone.length === 12 ? phone : `91${phone.slice(-10)}`;
      window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
    } else {
      // If seller hasn't configured a direct number, view the listing details
      onSelect(listing.id);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Listed today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 30) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const highlights = (listing.skins || listing.bundles || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 2);

  const rankBadge = getRankBadge(listing.rank);
  const imageCount = Array.isArray(listing.images) && listing.images.length > 0 
    ? listing.images.length 
    : 1;

  return (
    <div
      onClick={() => onSelect(listing.id)}
      className="group relative bg-white rounded-2xl border border-zinc-200/90 hover:border-orange-500/40 hover:shadow-xl shadow-xs transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Image Banner */}
      <div className="relative aspect-16/10 w-full bg-zinc-950 overflow-hidden">
        <img
          src={listing.primary_image}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30 pointer-events-none" />

        {/* Top Badges: Level & Rank */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-950/85 backdrop-blur-md text-white text-[11px] font-extrabold tracking-wider shadow-sm flex items-center gap-1">
            <span className="text-orange-400">LVL</span>
            <span>{listing.level}</span>
          </span>
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 tracking-tight ${rankBadge.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${rankBadge.dot} animate-pulse`} />
            <span>{rankBadge.label}</span>
          </span>
        </div>

        {/* Top Right: Image Counter & Favorite */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {imageCount > 1 && (
            <span className="px-2 py-1 rounded-lg bg-zinc-950/75 backdrop-blur-md text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-zinc-300" />
              <span>{imageCount}</span>
            </span>
          )}

          <button
            onClick={handleFavoriteClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm cursor-pointer ${
              isFavorite
                ? 'bg-red-500 text-white scale-105'
                : 'bg-white/90 text-zinc-700 hover:bg-white hover:text-red-500 hover:scale-105'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Sold Overlay */}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 bg-zinc-950/75 backdrop-blur-xs flex items-center justify-center z-20">
            <span className="px-4 py-2 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest shadow-lg">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Bottom micro-pills inside image: Login type & Region */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white/90 text-[11px] font-medium z-10">
          <span className="px-2 py-0.5 rounded-md bg-zinc-950/60 backdrop-blur-sm border border-white/10 text-[10px] font-semibold text-zinc-200">
            {listing.login_type} Login
          </span>
          <span className="flex items-center gap-1 text-[11px] text-zinc-200 drop-shadow-xs font-semibold">
            <MapPin className="w-3 h-3 text-orange-400" />
            {listing.region}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Price Header & Listing Date */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-zinc-900 tracking-tight font-display">
                {formatPrice(listing.price)}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                0% Broker Fee
              </span>
            </div>

            <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(listing.created_at)}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="mt-2 text-sm font-bold text-zinc-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
            {listing.title}
          </h3>

          {/* Cosmetic Highlights Pills */}
          {highlights.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              {highlights.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50/80 border border-orange-200/60 text-[11px] text-orange-950 font-medium truncate max-w-[170px]"
                >
                  <Sparkles className="w-2.5 h-2.5 text-orange-600 shrink-0" />
                  <span className="truncate">{h}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Seller Info & Rating */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div
            onClick={(e) => {
              if (onSellerClick) {
                e.stopPropagation();
                onSellerClick(listing.seller_username);
              }
            }}
            className="flex items-center gap-1.5 hover:text-zinc-900 font-medium truncate max-w-[170px]"
          >
            <div className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center text-[10px] font-bold text-zinc-700 shrink-0">
              {listing.seller_username.charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-xs text-zinc-700 font-semibold hover:underline">
              {listing.seller_username}
            </span>

            {/* Seller Rating Badge */}
            {listing.seller_review_count && listing.seller_review_count > 0 && listing.seller_rating ? (
              <span 
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0"
                title={`Rating: ${listing.seller_rating.toFixed(1)} (${listing.seller_review_count} reviews)`}
              >
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{listing.seller_rating.toFixed(1)}</span>
                <span className="text-zinc-500 font-normal">({listing.seller_review_count})</span>
              </span>
            ) : (
              <span 
                className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 shrink-0"
                title="New seller - 0 reviews"
              >
                <Star className="w-2.5 h-2.5 text-zinc-400" />
                <span>New</span>
                <span className="text-zinc-400 font-normal">(0)</span>
              </span>
            )}
          </div>

          {/* Quick Contact Button */}
          <button
            onClick={handleWhatsAppDirect}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Chat directly on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-emerald-500 text-white" />
            <span className="text-[11px]">WhatsApp</span>
          </button>
        </div>

        {/* View Details Button */}
        <button
          onClick={() => onSelect(listing.id)}
          className="w-full py-2 px-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-orange-600 hover:text-white hover:border-orange-600 text-zinc-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer group-hover:shadow-sm"
        >
          <span>Inspect Full Account Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
