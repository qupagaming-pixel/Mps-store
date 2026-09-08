import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight, ShieldCheck } from 'lucide-react';
import { Listing } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ListingCard } from '../components/ListingCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface FavoritesPageProps {
  onNavigate: (path: string) => void;
  onSelectListing: (id: string | number) => void;
  onSellerClick: (username: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  onNavigate,
  onSelectListing,
  onSellerClick,
}) => {
  const { user, openAuthModal } = useAuth();
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await api.getFavorites();
      setFavorites(res.favorites);
    } catch (err) {
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center">
          <Heart className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900">Saved Favorites</h2>
        <p className="text-xs text-zinc-500">
          Sign in to view and save Free Fire accounts you want to track or contact later.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="py-2.5 px-5 rounded-xl bg-orange-600 text-white font-bold text-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-red-600 mb-1">
          <Heart className="w-4 h-4 fill-current" />
          <span>My Saved Collection</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight font-display">
          Favorite Gaming Accounts
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Accounts you saved for quick comparison and direct WhatsApp communication.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-zinc-100 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((item) => (
            <ListingCard
              key={item.id}
              listing={item}
              onSelect={onSelectListing}
              onSellerClick={onSellerClick}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-4 shadow-2xs max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900">No favorites yet</h3>
            <p className="text-xs text-zinc-500">
              Browse through the marketplace and click the heart icon on any listing to save it here.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/accounts')}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <span>Explore Accounts</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
