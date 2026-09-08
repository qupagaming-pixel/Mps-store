import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  CheckCircle, 
  Eye, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Heart,
  MessageSquare,
  Settings,
  RefreshCw,
  X,
  ExternalLink,
  Star,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Listing, DashboardStats, Review } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ListingCard } from '../components/ListingCard.tsx';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
  onSelectListing: (id: string | number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onSelectListing }) => {
  const { user, openAuthModal, refreshUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'listings' | 'favorites' | 'reviews' | 'profile'>('listings');

  const [stats, setStats] = useState<DashboardStats>({
    total_listings: 0,
    active_listings: 0,
    sold_listings: 0,
    total_views: 0,
  });
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [reviewsData, setReviewsData] = useState<{ given: Review[]; received: Review[] }>({
    given: [],
    received: [],
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>('');

  // Edit Listing Modal state
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Profile update state
  const [newPhone, setNewPhone] = useState('');
  const [phoneUpdating, setPhoneUpdating] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Delete modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Review management state in Dashboard
  const [editingRev, setEditingRev] = useState<Review | null>(null);
  const [editRevRating, setEditRevRating] = useState(5);
  const [editRevTitle, setEditRevTitle] = useState('');
  const [editRevComment, setEditRevComment] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [deleteRevConfirmId, setDeleteRevConfirmId] = useState<string | null>(null);
  const [revMsg, setRevMsg] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [statsRes, listingsRes, favsRes, revsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getMyListings(),
        api.getFavorites(),
        api.getMyReviews(),
      ]);
      setStats(statsRes.stats);
      setMyListings(listingsRes.listings);
      setFavorites(favsRes.favorites || []);
      setReviewsData(revsRes);
      if (statsRes.profile.whatsapp_number) {
        setNewPhone(statsRes.profile.whatsapp_number);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      const errMsg = err?.message || 'Failed to load dashboard data';
      if (
        errMsg.includes('User account not found') ||
        errMsg.includes('Authentication required') ||
        errMsg.includes('Session expired') ||
        errMsg.includes('invalid token')
      ) {
        await logout();
        openAuthModal('login');
      } else {
        setLoadError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-zinc-900">Dashboard Access Required</h2>
        <p className="text-xs text-zinc-500">
          Please sign in to manage your listings, favorites, reviews, and profile.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="py-2.5 px-5 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Toggle Sold Status
  const handleToggleSold = async (id: string | number, currentStatus: 'active' | 'sold') => {
    const nextStatus = currentStatus === 'active' ? 'sold' : 'active';
    try {
      await api.updateListingStatus(id, nextStatus);
      setMyListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: nextStatus } : l))
      );
      setStats((prev) => ({
        ...prev,
        active_listings: nextStatus === 'active' ? prev.active_listings + 1 : prev.active_listings - 1,
        sold_listings: nextStatus === 'sold' ? prev.sold_listings + 1 : prev.sold_listings - 1,
      }));
    } catch (err: any) {
      alert(err.message || 'Could not update status');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (listing: Listing) => {
    setEditingListing(listing);
    setEditTitle(listing.title);
    setEditPrice(String(listing.price));
    setEditLevel(String(listing.level));
    setEditDescription(listing.description || '');
    setEditError('');
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    setEditLoading(true);
    setEditError('');

    try {
      await api.updateListing(editingListing.id, {
        title: editTitle.trim(),
        price: parseFloat(editPrice),
        level: parseInt(editLevel, 10),
        description: editDescription.trim(),
      });

      setMyListings((prev) =>
        prev.map((l) =>
          l.id === editingListing.id
            ? {
                ...l,
                title: editTitle.trim(),
                price: parseFloat(editPrice),
                level: parseInt(editLevel, 10),
                description: editDescription.trim(),
              }
            : l
        )
      );
      setEditingListing(null);
    } catch (err: any) {
      setEditError(err.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Listing
  const handleConfirmDelete = async () => {
    if (deleteConfirmId === null) return;
    setDeleteLoading(true);
    try {
      await api.deleteListing(deleteConfirmId);
      setMyListings((prev) => prev.filter((l) => l.id !== deleteConfirmId));
      setStats((prev) => ({
        ...prev,
        total_listings: Math.max(0, prev.total_listings - 1),
      }));
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || 'Could not delete listing');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Update Profile Phone
  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneUpdating(true);
    setPhoneSuccess('');
    setPhoneError('');

    try {
      await api.updateProfile(newPhone.trim());
      await refreshUser();
      setPhoneSuccess('WhatsApp contact number updated successfully!');
      setTimeout(() => setPhoneSuccess(''), 4000);
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to update phone number');
    } finally {
      setPhoneUpdating(false);
    }
  };

  const handleOpenEditRev = (rev: Review) => {
    setEditingRev(rev);
    setEditRevRating(rev.rating);
    setEditRevTitle(rev.title);
    setEditRevComment(rev.comment);
    setRevMsg('');
  };

  const handleUpdateRevSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRev) return;
    setRevSubmitting(true);
    setRevMsg('');
    try {
      const res = await api.updateReview(editingRev.id, {
        rating: editRevRating,
        title: editRevTitle.trim(),
        comment: editRevComment.trim(),
      });
      setReviewsData(prev => ({
        ...prev,
        given: prev.given.map(r => r.id === editingRev.id ? res.review : r)
      }));
      setEditingRev(null);
      setRevMsg('Review updated successfully!');
      setTimeout(() => setRevMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update review');
    } finally {
      setRevSubmitting(false);
    }
  };

  const handleDeleteRevExecute = async () => {
    if (!deleteRevConfirmId) return;
    setRevSubmitting(true);
    try {
      await api.deleteReview(deleteRevConfirmId);
      setReviewsData(prev => ({
        ...prev,
        given: prev.given.filter(r => r.id !== deleteRevConfirmId)
      }));
      setDeleteRevConfirmId(null);
      setRevMsg('Review deleted successfully.');
      setTimeout(() => setRevMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    } finally {
      setRevSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
              Seller Dashboard
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Active Member
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Manage your Free Fire ID listings, WhatsApp buyer inquiries, reviews, and saved favorites.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/sell')}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Listing</span>
          </button>
          <button
            onClick={loadDashboardData}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 text-xs font-semibold cursor-pointer shadow-2xs"
            title="Refresh dashboard data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
          <span>{loadError}</span>
          <button onClick={loadDashboardData} className="font-bold underline">Retry</button>
        </div>
      )}

      {/* Metric Cards (Overview) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Listings</span>
          <p className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{stats.total_listings}</p>
          <p className="text-[10px] text-zinc-400">Accounts posted by you</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Active for Sale</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">{stats.active_listings}</p>
          <p className="text-[10px] text-zinc-400">Visible to buyers</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Marked Sold</span>
          <p className="text-2xl sm:text-3xl font-black text-zinc-800 tracking-tight">{stats.sold_listings}</p>
          <p className="text-[10px] text-zinc-400">Completed deals</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Total Views</span>
          <p className="text-2xl sm:text-3xl font-black text-orange-600 tracking-tight">{stats.total_views}</p>
          <p className="text-[10px] text-zinc-400">Buyer impressions</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'listings'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>My Listings ({myListings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'favorites'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Favorites ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'reviews'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>My Reviews ({reviewsData.received.length + reviewsData.given.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'profile'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Profile Settings</span>
        </button>
      </div>

      {/* TAB 1: MY LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-zinc-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : myListings.length > 0 ? (
            <div className="space-y-3">
              {myListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-2xs hover:border-zinc-300 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Thumbnail */}
                    <div
                      onClick={() => onSelectListing(item.id)}
                      className="relative w-24 h-18 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0 cursor-pointer group"
                    >
                      <img
                        src={item.primary_image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {item.status === 'sold' && (
                        <div className="absolute inset-0 bg-zinc-950/70 flex items-center justify-center text-[9px] font-black text-white uppercase">
                          Sold
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          item.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}>
                          {item.status === 'active' ? 'Active for Sale' : 'Sold Out'}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">#{item.id}</span>
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {item.views || 0}
                        </span>
                      </div>

                      <h4
                        onClick={() => onSelectListing(item.id)}
                        className="text-sm font-bold text-zinc-900 hover:text-orange-600 transition-colors truncate cursor-pointer"
                      >
                        {item.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="font-extrabold text-zinc-950 font-display">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                        <span>•</span>
                        <span>Level {item.level}</span>
                        <span>•</span>
                        <span>{item.rank}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                    <button
                      onClick={() => handleToggleSold(item.id, item.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        item.status === 'active'
                          ? 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {item.status === 'active' ? 'Mark as Sold' : 'Reactivate'}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-colors cursor-pointer"
                      title="Edit Account Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-2 rounded-xl border border-zinc-200 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onSelectListing(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-zinc-300 mx-auto" />
              <h4 className="text-sm font-bold text-zinc-900">You haven't listed any accounts yet</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Got a Free Fire account with rare gun skins, bundles, or emotes? Put it up for sale with 0% broker commission.
              </p>
              <button
                onClick={() => onNavigate('/sell')}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Post Free Listing Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FAVORITES */}
      {activeTab === 'favorites' && (
        <div className="space-y-4">
          {favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onSelect={onSelectListing}
                  onSellerClick={(uname) => onNavigate(`/seller/${encodeURIComponent(uname)}`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-3">
              <Heart className="w-10 h-10 text-zinc-300 mx-auto" />
              <h4 className="text-sm font-bold text-zinc-900">No saved favorites yet</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Click the heart icon on any account card in the marketplace to bookmark it here for easy access.
              </p>
              <button
                onClick={() => onNavigate('/accounts')}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs cursor-pointer"
              >
                Browse Marketplace Accounts
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Reviews Received */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-2xs">
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Reviews Received on Your Seller Profile ({reviewsData.received.length})</span>
              </h3>
              <p className="text-xs text-zinc-500">Feedback left by buyers who traded with you.</p>
            </div>

            {reviewsData.received.length > 0 ? (
              <div className="space-y-3">
                {reviewsData.received.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900">{rev.reviewer_username}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <h5 className="text-xs font-bold text-zinc-800">{rev.title}</h5>
                    <p className="text-xs text-zinc-600">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-4">No reviews received yet. Share your listings to get started!</p>
            )}
          </div>

          {/* Reviews Given */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-2xs">
            <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-600" />
                  <span>Reviews You've Written for Other Sellers ({reviewsData.given.length})</span>
                </h3>
                <p className="text-xs text-zinc-500">Your experiences posted on other accounts. You can edit or delete them anytime.</p>
              </div>
            </div>

            {revMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{revMsg}</span>
              </div>
            )}

            {/* Edit Review Form if open */}
            {editingRev && (
              <form onSubmit={handleUpdateRevSubmit} className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-900">
                    Edit Review for Seller: <span className="text-orange-600">@{editingRev.seller_username}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingRev(null)}
                    className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditRevRating(s)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= editRevRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-zinc-700 ml-2">{editRevRating} / 5 Stars</span>
                </div>

                <input
                  type="text"
                  value={editRevTitle}
                  onChange={(e) => setEditRevTitle(e.target.value)}
                  placeholder="Review Headline"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-300 text-xs font-medium text-zinc-900 focus:outline-hidden focus:border-orange-500"
                />

                <textarea
                  value={editRevComment}
                  onChange={(e) => setEditRevComment(e.target.value)}
                  placeholder="Review Comments"
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-300 text-xs font-medium text-zinc-900 focus:outline-hidden focus:border-orange-500 resize-none"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRev(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={revSubmitting}
                    className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    {revSubmitting ? 'Saving...' : 'Update Review'}
                  </button>
                </div>
              </form>
            )}

            {reviewsData.given.length > 0 ? (
              <div className="space-y-3">
                {reviewsData.given.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-2">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">Seller: {rev.seller_username}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-zinc-600">{rev.rating}.0</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditRev(rev)}
                          className="px-2.5 py-1 text-xs font-bold text-zinc-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-zinc-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteRevConfirmId(rev.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-zinc-200"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h5 className="text-xs font-bold text-zinc-800">{rev.title}</h5>
                    <p className="text-xs text-zinc-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-4">You haven't posted any reviews yet.</p>
            )}

            {/* Delete Review Confirm Dialog */}
            {deleteRevConfirmId && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 max-w-sm w-full space-y-4 shadow-xl">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="text-center space-y-1">
                    <h4 className="text-sm font-bold text-zinc-900">Delete Review?</h4>
                    <p className="text-xs text-zinc-500">
                      Are you sure you want to permanently delete this review? The seller's overall rating will automatically update.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteRevConfirmId(null)}
                      disabled={revSubmitting}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteRevExecute}
                      disabled={revSubmitting}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {revSubmitting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PROFILE SETTINGS */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-zinc-200 p-6 space-y-6 shadow-2xs">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-base font-bold text-zinc-900">Profile &amp; WhatsApp Contact Settings</h3>
            <p className="text-xs text-zinc-500">
              When buyers click "Chat on WhatsApp", they are redirected directly to your number.
            </p>
          </div>

          {phoneSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{phoneSuccess}</span>
            </div>
          )}

          {phoneError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {phoneError}
            </div>
          )}

          {/* Account Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Username</span>
              <p className="text-sm font-extrabold text-zinc-900 mt-0.5">{user.username}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Email Address</span>
              <p className="text-sm font-extrabold text-zinc-900 mt-0.5 truncate">{user.email || 'None'}</p>
            </div>
          </div>

          {/* Update WhatsApp Number Form */}
          <form onSubmit={handleUpdatePhone} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 block">
                WhatsApp Phone Number (for Buyer Negotiation)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 9876543210 (10 digits)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-xs font-medium text-zinc-900 focus:outline-hidden focus:border-orange-500"
                  required
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Indian 10-digit mobile number. Country code +91 will be applied automatically.
              </p>
            </div>

            <button
              type="submit"
              disabled={phoneUpdating}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
            >
              {phoneUpdating ? 'Saving...' : 'Update WhatsApp Number'}
            </button>
          </form>

          {/* Public Profile Link */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-800 block">Public Seller Profile</span>
              <span className="text-[11px] text-zinc-500">View what buyers see when clicking your username</span>
            </div>
            <button
              onClick={() => onNavigate(`/seller/${encodeURIComponent(user.username)}`)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center gap-1 cursor-pointer"
            >
              <span>View Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-bold text-zinc-900">Edit Account #{editingListing.id}</h3>
              <button
                onClick={() => setEditingListing(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-900"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 block">Account Level</label>
                  <input
                    type="number"
                    value={editLevel}
                    onChange={(e) => setEditLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-900"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 block">Seller Description / Notes</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-zinc-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900">Delete Account Listing?</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to permanently delete listing #{deleteConfirmId}? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
