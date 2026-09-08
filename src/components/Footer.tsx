import React from 'react';
import { ShieldCheck, MessageCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenLegal: (type: 'terms' | 'privacy' | 'disclaimer' | 'how-it-works' | 'contact') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLegal }) => {
  return (
    <footer className="bg-white border-t border-zinc-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-zinc-100">
          {/* Col 1: Brand & Overview */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-200 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://i.ibb.co/RGtnTJ7k/file-00000000ecb882118ed52cdfdda67980.png';
                  }}
                  alt="FF ID Seller Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-zinc-900">
                FF ID SELLER
              </span>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed max-w-md">
              FreeFireIDSeller.in is an independent marketplace directory connecting gaming enthusiasts 
              and peer-to-peer account sellers directly through WhatsApp click-to-chat.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 border border-zinc-200 text-xs text-zinc-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct seller communication • Zero hidden commission</span>
            </div>
          </div>

          {/* Col 2: Marketplace Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Marketplace
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li>
                <button
                  onClick={() => onNavigate('/accounts')}
                  className="hover:text-zinc-900 transition-colors cursor-pointer text-left"
                >
                  Browse All Accounts
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/sell')}
                  className="hover:text-zinc-900 transition-colors cursor-pointer text-left font-medium text-orange-600"
                >
                  Sell Your ID
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('how-it-works')}
                  className="hover:text-zinc-900 transition-colors cursor-pointer text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/favorites')}
                  className="hover:text-zinc-900 transition-colors cursor-pointer text-left"
                >
                  Saved Favorites
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Safety & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Safety & Policies
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li>
                <button
                  onClick={() => onOpenLegal('terms')}
                  className="hover:text-zinc-900 transition-colors cursor-pointer text-left"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-zinc-900 transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('disclaimer')}
                  className="hover:text-zinc-900 transition-colors cursor-pointer text-left"
                >
                  Disclaimer
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('contact')}
                  className="hover:text-zinc-900 transition-colors cursor-pointer text-left"
                >
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Legal Disclaimer Box */}
        <div className="mt-8 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-600 leading-relaxed space-y-1">
              <p className="font-semibold text-zinc-800">
                Important Independent Platform Notice:
              </p>
              <p>
                FF ID Seller is an independent user-generated marketplace and is not affiliated with or endorsed by Garena or Free Fire. Users are responsible for ensuring that their listings and transactions comply with applicable game rules, platform terms and applicable laws. We do not claim that transactions are guaranteed safe or officially authorized.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-3">
          <p>© {new Date().getFullYear()} FF ID Seller (freefireidseller.in). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onOpenLegal('terms')} className="hover:text-zinc-600 cursor-pointer">Terms</button>
            <span>•</span>
            <button onClick={() => onOpenLegal('privacy')} className="hover:text-zinc-600 cursor-pointer">Privacy</button>
            <span>•</span>
            <button onClick={() => onOpenLegal('disclaimer')} className="hover:text-zinc-600 cursor-pointer">Disclaimer</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
