import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  PlusCircle, 
  Heart, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenLegal: (type: 'terms' | 'privacy' | 'disclaimer' | 'how-it-works' | 'contact') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenLegal }) => {
  const { user, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 shadow-2xs">
      {/* Top micro-ticker: Clean trust and speed bar */}
      <div className="bg-zinc-950 text-white text-xs py-2 px-4 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-zinc-200">Live P2P Trading</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-zinc-400 hidden sm:inline">Direct WhatsApp negotiation • 0% Broker Commission</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => onOpenLegal('how-it-works')}
              className="text-zinc-300 hover:text-orange-400 font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Safe Trading Guide</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={() => onOpenLegal('disclaimer')}
              className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Non-Affiliation Notice
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => handleNav('/')}
          className="flex items-center gap-3 text-left focus:outline-hidden cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-200 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform">
            <img
              src="/logo.png"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://i.ibb.co/RGtnTJ7k/file-00000000ecb882118ed52cdfdda67980.png';
              }}
              alt="FF ID Seller Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-lg text-zinc-950 leading-none flex items-center gap-1.5">
              <span>FF ID SELLER</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-bold uppercase tracking-wider">
                India
              </span>
            </div>
            <div className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase pt-0.5">
              freefireidseller.in
            </div>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => handleNav('/')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              currentPath === '/' 
                ? 'bg-zinc-100 text-zinc-950 shadow-2xs' 
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('/accounts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              currentPath === '/accounts' 
                ? 'bg-zinc-100 text-zinc-950 shadow-2xs' 
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
          >
            Browse Accounts
          </button>
          <button
            onClick={() => onOpenLegal('how-it-works')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav('/favorites')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentPath === '/favorites' 
                ? 'bg-zinc-100 text-zinc-950 shadow-2xs' 
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-zinc-500" />
            <span>Favorites</span>
          </button>
        </nav>

        {/* Right CTA / Auth controls */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else {
                handleNav('/sell');
              }
            }}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List Account Free</span>
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 border border-zinc-200/90 bg-white hover:bg-zinc-50 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-800 transition-colors cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center text-[11px] font-extrabold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[110px] truncate">{user.username}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {userDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-zinc-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-zinc-100">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Seller Account</p>
                    <p className="text-sm font-extrabold text-zinc-900 truncate">{user.username}</p>
                  </div>
                  <button
                    onClick={() => handleNav('/dashboard')}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-zinc-400" />
                    Dashboard &amp; Overview
                  </button>
                  <button
                    onClick={() => handleNav('/dashboard?tab=listings')}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-zinc-400" />
                    My Active Listings
                  </button>
                  <button
                    onClick={() => handleNav(`/seller/${encodeURIComponent(user.username)}`)}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-zinc-400" />
                    Public Seller Profile
                  </button>
                  <div className="border-t border-zinc-100 my-1"></div>
                  <button
                    onClick={async () => {
                      await logout();
                      setUserDropdownOpen(false);
                      handleNav('/');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              Sign In / Register
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => {
              if (!user) {
                openAuthModal('login');
              } else {
                handleNav('/sell');
              }
            }}
            className="bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Sell</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-lg">
          <button
            onClick={() => handleNav('/')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              currentPath === '/' ? 'bg-zinc-100 text-zinc-950 font-extrabold' : 'text-zinc-700'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('/accounts')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold ${
              currentPath === '/accounts' ? 'bg-zinc-100 text-zinc-950 font-extrabold' : 'text-zinc-700'
            }`}
          >
            Browse Accounts
          </button>
          <button
            onClick={() => {
              onOpenLegal('how-it-works');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-700"
          >
            How It Works &amp; Safety
          </button>
          <button
            onClick={() => handleNav('/favorites')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
              currentPath === '/favorites' ? 'bg-zinc-100 text-zinc-950 font-extrabold' : 'text-zinc-700'
            }`}
          >
            <span>Saved Favorites</span>
            <Heart className="w-4 h-4 text-zinc-400" />
          </button>

          <div className="border-t border-zinc-200 pt-3 mt-3">
            {user ? (
              <div className="space-y-1.5">
                <div className="px-3.5 py-1 text-xs text-zinc-400">
                  Signed in as <span className="font-bold text-zinc-800">{user.username}</span>
                </div>
                <button
                  onClick={() => handleNav('/dashboard')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-zinc-800 hover:bg-zinc-50 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-zinc-500" />
                  Dashboard &amp; Overview
                </button>
                <button
                  onClick={() => handleNav('/sell')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 text-orange-600" />
                  Create New Listing
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                    handleNav('/');
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-800 text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    openAuthModal('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-orange-600 text-xs font-bold text-white text-center shadow-xs"
                >
                  Register Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
