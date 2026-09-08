import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';
import { auth } from '../firebase.ts';
import { firebaseService } from '../services/firebaseService.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (login: string, pass: string) => Promise<void>;
  register: (u: { username: string; email: string; password: string; whatsapp_number: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const refreshUser = async () => {
    // 1. If Firebase auth has current user
    if (auth.currentUser) {
      try {
        const profile = await firebaseService.getCurrentUserProfile(auth.currentUser);
        setUser(profile);
        setLoading(false);
        return;
      } catch (err) {
        console.warn('Could not fetch Firebase user profile:', err);
      }
    }

    // 2. Check local stored user
    const saved = localStorage.getItem('ff_user_data');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
        setLoading(false);
        return;
      } catch {}
    }

    // 3. Check token for API
    const token = localStorage.getItem('ff_auth_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      localStorage.removeItem('ff_auth_token');
      localStorage.removeItem('ff_user_data');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await firebaseService.getCurrentUserProfile(fbUser);
          setUser(profile);
          localStorage.setItem('ff_user_data', JSON.stringify(profile));
        } catch {
          // fallback
          const basicUser: User = {
            id: fbUser.uid,
            username: fbUser.displayName || 'Gamer',
            email: fbUser.email || '',
            whatsapp_number: '',
            created_at: new Date().toISOString()
          };
          setUser(basicUser);
          localStorage.setItem('ff_user_data', JSON.stringify(basicUser));
        }
        setLoading(false);
      } else {
        // Not in firebase auth, check session token
        refreshUser();
      }
    });

    const handleUnauthorized = () => {
      if (!auth.currentUser) {
        localStorage.removeItem('ff_auth_token');
        localStorage.removeItem('ff_user_data');
        setUser(null);
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      unsubscribe();
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (loginStr: string, pass: string) => {
    const res = await api.login({ login: loginStr, password: pass });
    setUser(res.user);
    setAuthModalOpen(false);
  };

  const register = async (u: { username: string; email: string; password: string; whatsapp_number: string }) => {
    const res = await api.register(u);
    setUser(res.user);
    setAuthModalOpen(false);
  };

  const loginWithGoogle = async () => {
    const res = await api.loginWithGoogle();
    setUser(res.user);
    setAuthModalOpen(false);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
