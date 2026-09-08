import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  ArrowUpDown,
  X
} from 'lucide-react';
import { Listing, FilterState } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ListingCard } from '../components/ListingCard.tsx';

interface BrowsePageProps {
  initialSearch?: string;
  initialFilters?: Partial<FilterState>;
  onSelectListing: (id: string | number) => void;
  onSellerClick: (username: string) => void;
}

const RANKS = ['all', 'Grandmaster', 'Master', 'Heroic', 'Diamond IV', 'Diamond III', 'Platinum IV'];
const REGIONS = ['all', 'India (IND)', 'Singapore (SG)', 'Bangladesh (BD)', 'Brazil (BR)', 'Global'];
const LOGIN_TYPES = ['all', 'Google', 'Facebook', 'Twitter / X', 'VK'];

export const BrowsePage: React.FC<BrowsePageProps> = ({
  initialSearch = '',
  initialFilters = {} as Partial<FilterState>,
  onSelectListing,
  onSellerClick,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: initialSearch,
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    minLevel: initialFilters.minLevel || '',
    maxLevel: initialFilters.maxLevel || '',
    rank: initialFilters.rank || 'all',
    region: initialFilters.region || 'all',
    loginType: initialFilters.loginType || 'all',
    sort: initialFilters.sort || 'newest',
    status: initialFilters.status || 'active',
    page: 1,
  });

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.getListings(filters);
      setListings(res.listings);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.minLevel,
    filters.maxLevel,
    filters.rank,
    filters.region,
    filters.loginType,
    filters.sort,
    filters.status,
    filters.page,
  ]);

  const resetFilters = () => {
    setFilters({
      search: '',
      minPrice: '',
      maxPrice: '',
      minLevel: '',
      maxLevel: '',
      rank: 'all',
      region: 'all',
      loginType: 'all',
      sort: 'newest',
      status: 'active',
      page: 1,
    });
  };

  const activeFiltersCount = [
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.minLevel,
    filters.maxLevel,
    filters.rank !== 'all' ? filters.rank : null,
    filters.region !== 'all' ? filters.region : null,
    filters.loginType !== 'all' ? filters.loginType : null,
    filters.status !== 'active' ? filters.status : null,
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight font-display">
            Browse Gaming Accounts
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Explore independent Free Fire account listings. Inspect skins and contact sellers directly on WhatsApp.
          </p>
        </div>

        {/* Sort and Mobile Filter Toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-800 shadow-2xs cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-orange-600" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value, page: 1 })}
              className="appearance-none bg-white border border-zinc-200 text-xs font-bold text-zinc-800 rounded-xl px-3 py-2 pr-8 focus:outline-hidden focus:border-orange-500 cursor-pointer shadow-2xs"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="price_asc">Sort: Price Low to High</option>
              <option value="price_desc">Sort: Price High to Low</option>
              <option value="level_desc">Sort: Highest Level</option>
              <option value="views_desc">Sort: Most Viewed</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* SIDEBAR FILTERS (DESKTOP) */}
        <aside
          className={`lg:block ${
            mobileFilterOpen ? 'block fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-xs p-4 overflow-y-auto' : 'hidden'
          }`}
        >
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-5 shadow-xs max-w-md mx-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                <Filter className="w-4 h-4 text-orange-600" />
                <span>Filter Accounts</span>
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
                {mobileFilterOpen && (
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="lg:hidden p-1 text-zinc-400 hover:text-zinc-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Search Keyword</label>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  placeholder="Skin, bundle, emote, rank..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Price Range (₹)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value, page: 1 })}
                  placeholder="Min ₹"
                  className="w-full text-xs p-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
                />
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value, page: 1 })}
                  placeholder="Max ₹"
                  className="w-full text-xs p-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            {/* Account Level */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Account Level</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={filters.minLevel}
                  onChange={(e) => setFilters({ ...filters, minLevel: e.target.value, page: 1 })}
                  placeholder="Min Lvl"
                  className="w-full text-xs p-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
                />
                <input
                  type="number"
                  value={filters.maxLevel}
                  onChange={(e) => setFilters({ ...filters, maxLevel: e.target.value, page: 1 })}
                  placeholder="Max Lvl"
                  className="w-full text-xs p-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            {/* Rank */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Rank</label>
              <select
                value={filters.rank}
                onChange={(e) => setFilters({ ...filters, rank: e.target.value, page: 1 })}
                className="w-full text-xs p-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500 bg-white"
              >
                {RANKS.map((r) => (
                  <option key={r} value={r}>
                    {r === 'all' ? 'All Ranks' : r}
                  </option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Server Region</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value, page: 1 })}
                className="w-full text-xs p-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500 bg-white"
              >
                {REGIONS.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg === 'all' ? 'All Regions' : reg}
                  </option>
                ))}
              </select>
            </div>

            {/* Login Type */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Login Type</label>
              <select
                value={filters.loginType}
                onChange={(e) => setFilters({ ...filters, loginType: e.target.value, page: 1 })}
                className="w-full text-xs p-2 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500 bg-white"
              >
                {LOGIN_TYPES.map((lt) => (
                  <option key={lt} value={lt}>
                    {lt === 'all' ? 'All Login Methods' : lt}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Listing Status</label>
              <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, status: 'active', page: 1 })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filters.status === 'active' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
                  }`}
                >
                  Active Only
                </button>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, status: 'all', page: 1 })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filters.status === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
                  }`}
                >
                  Show All
                </button>
              </div>
            </div>

            {mobileFilterOpen && (
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs"
              >
                Apply Filters ({total} Results)
              </button>
            )}
          </div>
        </aside>

        {/* MAIN LISTINGS GRID */}
        <main className="lg:col-span-3 space-y-6">
          {/* Active Chips & Total Count */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div>
              Showing <span className="font-bold text-zinc-900">{total}</span> gaming accounts
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-orange-600 font-bold hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200"></div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  onSelect={onSelectListing}
                  onSellerClick={onSellerClick}
                />
              ))}
            </div>
          ) : (
            /* Attractive Empty State (as strictly mandated in prompt) */
            <div className="py-16 px-4 text-center rounded-2xl border border-zinc-200 bg-white space-y-4 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 mx-auto flex items-center justify-center">
                <Search className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-900">No accounts found</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Try changing your filters or search terms to discover more available listings.
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="p-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-zinc-700 px-3">
                Page {filters.page} of {totalPages}
              </span>

              <button
                disabled={filters.page >= totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="p-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
