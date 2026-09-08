import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowRight, 
  PlusCircle, 
  ShieldCheck, 
  MessageCircle, 
  Zap, 
  Filter, 
  Sparkles,
  Trophy,
  Users,
  CheckCircle2,
  ChevronRight,
  Flame,
  Clock,
  Lock,
  BadgeCheck,
  Shield,
  Layers,
  ArrowUpRight,
  X
} from 'lucide-react';
import { Listing } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ListingCard } from '../components/ListingCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectListing: (id: string | number) => void;
  onSellerClick: (username: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectListing, onSellerClick }) => {
  const { user, openAuthModal } = useAuth();
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatedNotice, setShowCreatedNotice] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.search.includes('created=true');
  });

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await api.getFeaturedListings();
        setFeaturedListings(res.listings);
      } catch (err) {
        console.error('Error fetching featured listings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/accounts?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('/accounts');
    }
  };

  const handleQuickFilter = (param: string) => {
    onNavigate(`/accounts?${param}`);
  };

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* SUCCESS NOTICE FOR NEWLY LISTED ID */}
      {showCreatedNotice && (
        <div className="bg-emerald-600 text-white px-4 py-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <span>Free Fire ID Listed Successfully! Your account is now live on the marketplace.</span>
            </div>
            <button
              onClick={() => setShowCreatedNotice(false)}
              className="p-1 rounded-lg hover:bg-emerald-700 text-emerald-100 transition-colors cursor-pointer"
              aria-label="Close notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-14 border-b border-zinc-200/80 bg-gradient-to-b from-zinc-50/80 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Heading & Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Live Marketplace Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/90 text-orange-800 text-xs font-bold tracking-tight shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
                <span>India's Premier Gaming Account Exchange</span>
              </div>

              {/* Display Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-zinc-950 leading-[1.08] font-display">
                Buy &amp; Sell Gaming <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700">
                  Account IDs Directly
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed font-normal">
                Discover authentic Free Fire account listings from independent players across India. Connect directly on WhatsApp with zero middlemen, 0% platform commission, and instantaneous seller responses.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  onClick={() => onNavigate('/accounts')}
                  className="px-7 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-sm transition-all shadow-sm hover:shadow-md flex items-center gap-2.5 cursor-pointer"
                >
                  <span>Explore All Accounts</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (!user) {
                      openAuthModal('login');
                    } else {
                      onNavigate('/sell');
                    }
                  }}
                  className="px-6 py-3.5 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-900 font-bold text-sm transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-orange-600" />
                  <span>List Your ID For Free</span>
                </button>
              </div>

              {/* Key Trust Metrics Bar */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-zinc-200/90 text-zinc-700">
                <div className="space-y-0.5">
                  <div className="text-xl font-extrabold text-zinc-950 font-display">0%</div>
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Commission</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xl font-extrabold text-zinc-950 font-display">Direct</div>
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">WhatsApp Chat</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xl font-extrabold text-zinc-950 font-display">100% P2P</div>
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Direct Transfer</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xl font-extrabold text-zinc-950 font-display">&lt;15 Min</div>
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">Avg Seller Reply</div>
                </div>
              </div>
            </div>

            {/* Right Column: High-End Live Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                
                {/* Soft glow behind card */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-orange-200/40 via-amber-100/30 to-zinc-100 rounded-3xl blur-2xl opacity-80" />

                {/* Main Showcase Spec Card */}
                <div className="relative bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden p-5 space-y-4">
                  
                  {/* Image & Verified Stamp */}
                  <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-100">
                    <img 
                      src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80" 
                      alt="Verified Showcase Account" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    
                    {/* Top Tier Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-950/85 text-white text-[11px] font-extrabold backdrop-blur-md flex items-center gap-1">
                        <span className="text-orange-400">LVL</span>
                        <span>72</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[11px] font-extrabold backdrop-blur-md shadow-xs flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>Grandmaster</span>
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-400" />
                        <span>Featured ID</span>
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <span className="font-semibold text-zinc-200">Google Login • IND Server</span>
                      <span className="font-bold text-amber-300">18,500+ Likes</span>
                    </div>
                  </div>

                  {/* Account Highlights */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-zinc-950 tracking-tight font-display">
                          ₹4,999
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                          Direct P2P
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-zinc-500">Fixed Price</span>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-900 leading-snug">
                      Grandmaster Account • Evo Draco AK Max (Lvl 7) • Cobra Bundle
                    </h4>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-orange-50/80 border border-orange-200 text-orange-900 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-600" />
                        Draco AK Max
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 font-semibold">
                        Cobra Rage Bundle
                      </span>
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 font-semibold">
                        Season 8+ Passes
                      </span>
                    </div>
                  </div>

                  {/* Direct Contact Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => onNavigate('/accounts')}
                      className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1caa51] text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Contact Seller on WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Floating Trust Shield */}
                <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl border border-zinc-200/90 shadow-lg p-3.5 flex items-center gap-3 max-w-[220px]">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] leading-tight">
                    <div className="font-extrabold text-zinc-900">Direct P2P Trading</div>
                    <div className="text-zinc-500 font-medium">Deal directly on WhatsApp</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SEARCH BAR & QUICK FILTERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-5 sm:p-7 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, level, rank, weapon skin or bundle (e.g. Draco AK, Cobra, Level 70)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-zinc-50/60 font-medium"
              />
            </div>
            <button
              type="submit"
              className="py-3.5 px-7 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm transition-colors shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Search Accounts</span>
            </button>
          </form>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="font-bold text-zinc-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Popular Filters:
            </span>
            <button
              onClick={() => handleQuickFilter('rank=Grandmaster')}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold transition-colors cursor-pointer"
            >
              ⭐ Grandmaster
            </button>
            <button
              onClick={() => handleQuickFilter('rank=Heroic')}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold transition-colors cursor-pointer"
            >
              🔥 Heroic Rank
            </button>
            <button
              onClick={() => handleQuickFilter('maxPrice=2000')}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold transition-colors cursor-pointer"
            >
              💰 Under ₹2,000
            </button>
            <button
              onClick={() => handleQuickFilter('minLevel=70')}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold transition-colors cursor-pointer"
            >
              🎖️ Level 70+
            </button>
            <button
              onClick={() => handleQuickFilter('loginType=Google')}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-bold transition-colors cursor-pointer"
            >
              Google Login
            </button>
            <button
              onClick={() => onNavigate('/accounts')}
              className="px-3 py-1.5 rounded-lg text-orange-600 font-bold hover:underline cursor-pointer ml-auto flex items-center gap-1"
            >
              <span>View All Filters</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-zinc-200/80 pb-4">
          <div>
            <div className="text-xs font-extrabold text-orange-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Direct From Independent Owners
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-display">
              Featured Gaming Accounts
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/accounts')}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-zinc-700 hover:text-orange-600 transition-colors cursor-pointer"
          >
            <span>Browse All Listings</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-84 rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200"></div>
            ))}
          </div>
        ) : featuredListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onSelect={onSelectListing}
                onSellerClick={onSellerClick}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl border border-zinc-200 bg-zinc-50 space-y-3">
            <p className="text-sm font-bold text-zinc-700">No accounts found</p>
            <p className="text-xs text-zinc-500">Be the first to list your account!</p>
            <button
              onClick={() => onNavigate('/sell')}
              className="py-2.5 px-5 rounded-xl bg-orange-600 text-white text-xs font-bold"
            >
              Sell Your Account
            </button>
          </div>
        )}

        <div className="sm:hidden pt-4 text-center">
          <button
            onClick={() => onNavigate('/accounts')}
            className="w-full py-3.5 rounded-xl border border-zinc-300 text-sm font-bold text-zinc-900 hover:bg-zinc-50"
          >
            Browse All Available Accounts
          </button>
        </div>
      </section>

      {/* 3-STEP SAFE TRADING PROTOCOL (सुरक्षित लेन-देन प्रक्रिया) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-8 sm:p-12 shadow-xs space-y-8">
          <div className="max-w-3xl mx-auto text-center space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Safety First
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-display">
              How To Safely Trade Accounts
            </h2>
            <p className="text-sm text-zinc-600 max-w-xl mx-auto">
              Follow our 3-step verification protocol to guarantee a smooth and secure account exchange.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 space-y-3 relative">
              <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white font-extrabold text-sm flex items-center justify-center">
                01
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">
                1. Inspect &amp; Video Verify
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Always ask the seller for an in-game lobby squad invite or an unbroken screen recording showing collection vault, EVO levels, and rank badges before paying.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 space-y-3 relative">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center">
                02
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">
                2. Direct WhatsApp Deal
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Communicate directly with the real owner over WhatsApp. Agree on price, verify their linked contact number, and discuss handover steps.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 space-y-3 relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center">
                03
              </div>
              <h3 className="text-base font-extrabold text-zinc-900">
                3. Credential &amp; 2FA Transfer
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Log in, change the linked password, replace the recovery phone number and backup email, and enable Two-Factor Authentication (2FA) immediately.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* WHY TRADERS USE FF ID SELLER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-50 rounded-3xl border border-zinc-200/80 p-8 sm:p-12 space-y-10">
          <div className="max-w-3xl mx-auto text-center space-y-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-display">
              Built for Transparent Gaming Trades
            </h2>
            <p className="text-sm text-zinc-600">
              FreeFireIDSeller.in provides a dedicated, scam-resistant directory for gamers to meet and negotiate without broker commissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Instant WhatsApp Redirection</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Skip complicated checkout forms. Every listing offers a one-click WhatsApp button with pre-filled account specifications.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Zero Commission &amp; Hidden Fees</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                We never take cuts or platform margins. What the seller asks is what you negotiate, keeping gaming IDs affordable.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Number Obfuscation &amp; Anti-Spam</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Sellers' phone numbers are protected from malicious automated web harvesters and marketing robots.
              </p>
            </div>
          </div>

          {/* Sell CTA Banner */}
          <div className="bg-zinc-950 rounded-2xl p-7 sm:p-9 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-orange-400 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 fill-orange-400" />
                <span>Ready to sell your gaming ID?</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Get Direct WhatsApp Offers Within Hours
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                List your Free Fire account in under 2 minutes. Add your photos, price, weapon skins, and start receiving buyers directly on WhatsApp.
              </p>
            </div>
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                } else {
                  onNavigate('/sell');
                }
              }}
              className="px-7 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-extrabold transition-all shrink-0 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-2"
            >
              <span>List Your ID Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
