import React, { useState } from 'react';
import { MessageCircle, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.ts';

interface WhatsAppButtonProps {
  listingId: string | number;
  listingTitle: string;
  price: number;
  isSold?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  listingId,
  listingTitle,
  price,
  isSold = false,
  className = '',
  size = 'lg'
}) => {
  const [loading, setLoading] = useState(false);
  const [contacted, setContacted] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSold || loading) return;

    setLoading(true);
    try {
      const res = await api.getWhatsAppContactLink(listingId);
      if (res.url) {
        setContacted(true);
        // Open WhatsApp click-to-chat in new tab or native app
        window.open(res.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      alert(err.message || 'Could not connect with seller. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSold) {
    return (
      <div className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-100 text-zinc-400 font-bold cursor-not-allowed border border-zinc-200 ${className}`}>
        <span>Account Marked as Sold</span>
      </div>
    );
  }

  const sizeStyles = {
    sm: 'py-2 px-3 text-xs',
    md: 'py-2.5 px-4 text-sm',
    lg: 'py-3.5 px-6 text-base font-bold',
  };

  return (
    <div className="space-y-1.5 w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer disabled:opacity-75 ${sizeStyles[size]} ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting WhatsApp...</span>
          </>
        ) : contacted ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>Open WhatsApp Chat</span>
          </>
        ) : (
          <>
            {/* Clean SVG icon for WhatsApp */}
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.288.043.088.072.188.014.303-.058.116-.087.188-.173.289l-.26.302c-.087.087-.179.183-.077.358.101.174.452.747.971 1.21.667.594 1.23.777 1.403.864.173.087.274.072.375-.044.101-.116.433-.506.549-.68.116-.174.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.176L2 22l4.957-1.396A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.637 0-3.16-.487-4.437-1.328l-.318-.21-2.946.83.844-2.868-.23-.332A8.136 8.136 0 013.833 12c0-4.503 3.664-8.167 8.167-8.167 4.503 0 8.167 3.664 8.167 8.167 0 4.503-3.664 8.167-8.167 8.167z" />
            </svg>
            <span>CONTACT SELLER ON WHATSAPP</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Click-to-chat • Seller phone number is safely encrypted</span>
      </div>
    </div>
  );
};
