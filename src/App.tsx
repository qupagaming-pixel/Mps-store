import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LegalModal } from './components/LegalModal.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { BrowsePage } from './pages/BrowsePage.tsx';
import { AccountDetailPage } from './pages/AccountDetailPage.tsx';
import { SellPage } from './pages/SellPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { SellerProfilePage } from './pages/SellerProfilePage.tsx';
import { FavoritesPage } from './pages/FavoritesPage.tsx';

function MainApp() {
  const [currentPath, setCurrentPath] = useState<string>(
    window.location.pathname + window.location.search || '/'
  );
  const [legalModalType, setLegalModalType] = useState<
    'terms' | 'privacy' | 'disclaimer' | 'how-it-works' | 'contact' | null
  >(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Parse path & search
  const [pathname, search] = currentPath.split('?');
  const searchParams = new URLSearchParams(search || '');

  // Render active page
  const renderPage = () => {
    // 1. Account Details: /account/:id
    if (pathname.startsWith('/account/')) {
      const idStr = pathname.replace('/account/', '');
      if (idStr) {
        return (
          <AccountDetailPage
            listingId={idStr}
            onBack={() => navigate('/accounts')}
            onSelectListing={(id) => navigate(`/account/${id}`)}
            onSellerClick={(uname) => navigate(`/seller/${encodeURIComponent(uname)}`)}
          />
        );
      }
    }

    // 2. Seller Profile: /seller/:username
    if (pathname.startsWith('/seller/')) {
      const username = decodeURIComponent(pathname.replace('/seller/', ''));
      return (
        <SellerProfilePage
          username={username}
          onBack={() => navigate('/accounts')}
          onSelectListing={(id) => navigate(`/account/${id}`)}
        />
      );
    }

    // 3. Browse Accounts: /accounts
    if (pathname === '/accounts') {
      const initialFilters: any = {};
      searchParams.forEach((val, key) => {
        initialFilters[key] = val;
      });
      return (
        <BrowsePage
          initialSearch={searchParams.get('search') || ''}
          initialFilters={initialFilters}
          onSelectListing={(id) => navigate(`/account/${id}`)}
          onSellerClick={(uname) => navigate(`/seller/${encodeURIComponent(uname)}`)}
        />
      );
    }

    // 4. Sell Page: /sell
    if (pathname === '/sell') {
      return (
        <SellPage
          onListingCreated={(newId) => navigate(`/account/${newId}`)}
          onNavigate={navigate}
        />
      );
    }

    // 5. Dashboard: /dashboard
    if (pathname === '/dashboard') {
      return (
        <DashboardPage
          onNavigate={navigate}
          onSelectListing={(id) => navigate(`/account/${id}`)}
        />
      );
    }

    // 6. Favorites: /favorites
    if (pathname === '/favorites') {
      return (
        <FavoritesPage
          onNavigate={navigate}
          onSelectListing={(id) => navigate(`/account/${id}`)}
          onSellerClick={(uname) => navigate(`/seller/${encodeURIComponent(uname)}`)}
        />
      );
    }

    // Default: Home Page
    return (
      <HomePage
        onNavigate={navigate}
        onSelectListing={(id) => navigate(`/account/${id}`)}
        onSellerClick={(uname) => navigate(`/seller/${encodeURIComponent(uname)}`)}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-orange-100 selection:text-orange-900">
      {/* Top Navbar */}
      <Navbar
        currentPath={pathname}
        onNavigate={navigate}
        onOpenLegal={(type) => setLegalModalType(type)}
      />

      {/* Main Page Area */}
      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Footer with Mandatory Disclaimer */}
      <Footer
        onNavigate={navigate}
        onOpenLegal={(type) => setLegalModalType(type)}
      />

      {/* Modals */}
      <AuthModal
        onSuccess={() => {
          if (pathname === '/sell') {
            // keep on sell
          } else {
            navigate('/dashboard');
          }
        }}
      />

      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
        onNavigate={navigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
