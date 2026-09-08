import React from 'react';
import { X, ShieldAlert, FileText, Lock, HelpCircle, Mail, Phone, ExternalLink } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'privacy' | 'disclaimer' | 'how-it-works' | 'contact' | null;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, onNavigate }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dynamic Content */}
        <div className="overflow-y-auto pr-2 space-y-4 text-zinc-700 text-sm leading-relaxed">
          {type === 'how-it-works' && (
            <div>
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <HelpCircle className="w-5 h-5" />
                <h3 className="text-lg font-bold text-zinc-900">How FF ID Seller Works</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-6">
                Direct P2P marketplace connecting buyers and sellers through WhatsApp click-to-chat.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-bold text-xs flex items-center justify-center">1</div>
                  <h4 className="font-bold text-zinc-900 text-xs">Browse or List</h4>
                  <p className="text-xs text-zinc-600">
                    Buyers explore listings with transparent level, rank, and skin highlights. Sellers publish accounts with zero commission.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">2</div>
                  <h4 className="font-bold text-zinc-900 text-xs">Chat on WhatsApp</h4>
                  <p className="text-xs text-zinc-600">
                    Click the green WhatsApp button to initiate a direct chat with pre-filled listing context without exposing raw phone numbers publicly.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white font-bold text-xs flex items-center justify-center">3</div>
                  <h4 className="font-bold text-zinc-900 text-xs">Inspect & Verify</h4>
                  <p className="text-xs text-zinc-600">
                    Communicate, request screen share proof, verify email / login bindings, and finalize peer-to-peer securely.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold">Safety Recommendation:</p>
                <p>
                  Always verify game credentials and avoid sharing OTPs before transferring ownership. The platform is an independent catalog and does not hold escrow funds.
                </p>
              </div>
            </div>
          )}

          {type === 'terms' && (
            <div>
              <div className="flex items-center gap-2 text-zinc-900 mb-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-bold">Terms & Conditions</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4">Last updated: September 2026</p>
              <div className="space-y-3 text-xs leading-relaxed text-zinc-600">
                <p>
                  <strong>1. Educational & Demo Purpose:</strong> FreeFireIDSeller.in is an independent demo marketplace concept. The platform acts strictly as an informational catalog facilitating direct communications between autonomous users.
                </p>
                <p>
                  <strong>2. User Responsibility:</strong> Users who list or buy gaming accounts are solely responsible for ensuring that all interactions, transfers, and agreements comply with applicable game publisher terms of service, platform policies, and local laws.
                </p>
                <p>
                  <strong>3. No Admin Guarantee:</strong> This website operates on a self-managed user architecture with NO admin approvals or transaction escrow. We do not inspect game servers or guarantee trade completions.
                </p>
                <p>
                  <strong>4. Content Standards:</strong> Users agree not to post fraudulent listings, stolen IDs, abusive language, or infringing copyright assets. Listings found violating community rules may be flagged and removed.
                </p>
              </div>
            </div>
          )}

          {type === 'privacy' && (
            <div>
              <div className="flex items-center gap-2 text-zinc-900 mb-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold">Privacy Policy</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4">Last updated: September 2026</p>
              <div className="space-y-3 text-xs leading-relaxed text-zinc-600">
                <p>
                  <strong>1. Data Collection:</strong> We collect username, email, and WhatsApp number upon account registration. Passwords are never stored in plain text and are hashed with industry-standard bcrypt encryption.
                </p>
                <p>
                  <strong>2. Phone Number Protection:</strong> Seller WhatsApp numbers are NEVER displayed as raw plain text on listing pages. Links use WhatsApp's click-to-chat API to protect user privacy from automated web scrapers.
                </p>
                <p>
                  <strong>3. Cookies & Sessions:</strong> We utilize secure HttpOnly session tokens to keep users authenticated to their private dashboards.
                </p>
                <p>
                  <strong>4. Third-Party Sharing:</strong> We do not sell or monetize personal user details to third-party advertisers.
                </p>
              </div>
            </div>
          )}

          {type === 'disclaimer' && (
            <div>
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-lg font-bold text-zinc-900">Platform Disclaimer</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4">Official Non-Affiliation Declaration</p>
              <div className="space-y-3 text-xs leading-relaxed text-zinc-600">
                <div className="p-3.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-800 font-medium">
                  FF ID Seller is an independent user-generated marketplace and is not affiliated with, endorsed by, sponsored by, or connected to Garena, Free Fire, or any of their parent companies.
                </div>
                <p>
                  All registered trademarks, character names, game titles, and item assets referenced on this website remain the property of their respective copyright holders. Reference to Free Fire terminology is solely for descriptive, educational, and classification purposes.
                </p>
                <p>
                  Users acknowledge that game publishers may prohibit account trading under their Terms of Service. FF ID Seller does not guarantee safety, warranties, or recovery of accounts.
                </p>
              </div>
            </div>
          )}

          {type === 'contact' && (
            <div>
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Mail className="w-5 h-5" />
                <h3 className="text-lg font-bold text-zinc-900">Contact & Inquiries</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-4">
                Have questions or need to submit safety inquiries?
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2 text-xs">
                  <div className="font-bold text-zinc-900">Administrative Contact:</div>
                  <p className="text-zinc-600">
                    Email: <span className="font-mono text-zinc-800">support@freefireidseller.in</span>
                  </p>
                  <p className="text-zinc-600">
                    Domain: <span className="font-mono text-zinc-800">freefireidseller.in</span>
                  </p>
                  <p className="text-zinc-500 text-[11px] pt-1">
                    For listing disputes or safety reports, please utilize the "Report Listing" button directly on the listing page.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-zinc-100 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
