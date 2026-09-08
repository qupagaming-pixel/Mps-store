import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';

interface ReportModalProps {
  listingId: string | number;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Scam/suspicious listing',
  'Wrong information',
  'Fake images',
  'Offensive content',
  'Other'
];

export const ReportModal: React.FC<ReportModalProps> = ({
  listingId,
  listingTitle,
  isOpen,
  onClose,
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.submitReport(listingId, reason, description);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2200);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Report Received</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Thank you for keeping our marketplace clean and trustworthy. Our security notification system has logged this listing for review.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Report Listing</span>
            </div>

            <h3 className="text-base font-bold text-zinc-900 leading-snug">
              Why are you reporting this account?
            </h3>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
              Listing: <span className="font-semibold text-zinc-700">{listingTitle}</span>
            </p>

            {error && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Select Reason <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        reason === r
                          ? 'border-orange-500 bg-orange-50/40 text-orange-950 font-semibold'
                          : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe suspicious activity, wrong level, or discrepancy..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
