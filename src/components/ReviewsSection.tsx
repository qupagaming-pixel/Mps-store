import React, { useState } from 'react';
import { 
  Star, 
  ThumbsUp, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  User, 
  Sparkles,
  LogIn,
  Edit3,
  Trash2,
  X,
  Clock
} from 'lucide-react';
import { Review, RatingSummary } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ReviewsSectionProps {
  sellerUsername: string;
  listingId?: string | number;
  initialReviews?: Review[];
  initialSummary?: RatingSummary;
  onReviewChanged?: (updatedReviews: Review[], updatedSummary: RatingSummary) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  sellerUsername,
  listingId,
  initialReviews = [],
  initialSummary,
  onReviewChanged,
}) => {
  const { user, openAuthModal } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [summary, setSummary] = useState<RatingSummary>(() => {
    if (initialSummary && initialSummary.total > 0) return initialSummary;
    if (initialReviews.length > 0) {
      const total = initialReviews.length;
      const sum = initialReviews.reduce((acc, curr) => acc + curr.rating, 0);
      const avg = Number((sum / total).toFixed(1));
      const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      initialReviews.forEach(r => {
        const s = (r.rating >= 1 && r.rating <= 5 ? r.rating : 5) as 1 | 2 | 3 | 4 | 5;
        dist[s] = (dist[s] || 0) + 1;
      });
      return { average: avg, total, distribution: dist };
    }
    return { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  });

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Helpful click tracker
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});

  const ratingDescriptions: Record<number, string> = {
    5: '5 Stars — Excellent! Fast response, honest specs & safe trade',
    4: '4 Stars — Good! Smooth deal and decent communication',
    3: '3 Stars — Average! Transaction completed with minor delays',
    2: '2 Stars — Below Average! Discrepancies or slow WhatsApp response',
    1: '1 Star — Poor! Unresponsive, deceptive, or unsatisfactory trade'
  };

  // Check if logged in user is the seller
  const isSellerSelf = Boolean(
    user && user.username.trim().toLowerCase() === sellerUsername.trim().toLowerCase()
  );

  // Check if current user already reviewed this seller
  const userExistingReview = user
    ? reviews.find(
        (r) =>
          (r.reviewer_user_id && String(r.reviewer_user_id) === String(user.id)) ||
          (r.reviewer_username && r.reviewer_username.trim().toLowerCase() === user.username.trim().toLowerCase())
      )
    : null;

  const calculateSummary = (revs: Review[]): RatingSummary => {
    if (revs.length === 0) {
      return { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const total = revs.length;
    const sum = revs.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0);
    const average = Number((sum / total).toFixed(1));
    const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    revs.forEach((r) => {
      const s = (r.rating >= 1 && r.rating <= 5 ? Math.round(r.rating) : 5) as 1 | 2 | 3 | 4 | 5;
      distribution[s] = (distribution[s] || 0) + 1;
    });
    return { average, total, distribution };
  };

  const handleOpenCreateForm = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (isSellerSelf) return;

    if (userExistingReview) {
      // User already reviewed, switch to editing mode for their existing review
      handleStartEdit(userExistingReview);
      return;
    }

    setEditingReviewId(null);
    setRating(5);
    setHoverRating(0);
    setTitle('');
    setComment('');
    setErrorMsg('');
    setShowForm(true);
  };

  const handleStartEdit = (rev: Review) => {
    setEditingReviewId(rev.id);
    setRating(rev.rating);
    setHoverRating(0);
    setTitle(rev.title);
    setComment(rev.comment);
    setErrorMsg('');
    setShowForm(true);
    // Scroll smoothly to form
    const formElement = document.getElementById('review-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingReviewId(null);
    setTitle('');
    setComment('');
    setErrorMsg('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (isSellerSelf) {
      setErrorMsg('Sellers cannot leave reviews on their own accounts.');
      return;
    }

    if (!title.trim() || !comment.trim()) {
      setErrorMsg('Please enter both a review headline and detailed comments.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingReviewId) {
        // Update existing review
        const res = await api.updateReview(editingReviewId, {
          rating,
          title: title.trim(),
          comment: comment.trim(),
        });

        const updatedReviews = reviews.map((r) => (r.id === editingReviewId ? res.review : r));
        const newSummary = calculateSummary(updatedReviews);
        setReviews(updatedReviews);
        setSummary(newSummary);
        onReviewChanged?.(updatedReviews, newSummary);

        setSuccessMsg('Your review has been updated successfully!');
      } else {
        // Submit brand new review
        const res = await api.addReview({
          seller_username: sellerUsername,
          listing_id: listingId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        });

        const updatedReviews = [res.review, ...reviews];
        const newSummary = calculateSummary(updatedReviews);
        setReviews(updatedReviews);
        setSummary(newSummary);
        onReviewChanged?.(updatedReviews, newSummary);

        setSuccessMsg('Thank you! Your review has been published.');
      }

      handleCancelForm();
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteReview = (reviewId: string) => {
    setDeletingId(reviewId);
    setDeleteConfirmOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!deletingId) return;
    setSubmitting(true);
    try {
      await api.deleteReview(deletingId);
      const updatedReviews = reviews.filter((r) => r.id !== deletingId);
      const newSummary = calculateSummary(updatedReviews);
      setReviews(updatedReviews);
      setSummary(newSummary);
      onReviewChanged?.(updatedReviews, newSummary);

      if (editingReviewId === deletingId) {
        handleCancelForm();
      }

      setSuccessMsg('Your review has been deleted.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    } finally {
      setSubmitting(false);
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (helpfulClicked[reviewId]) return;
    try {
      setHelpfulClicked((prev) => ({ ...prev, [reviewId]: true }));
      const res = await api.markReviewHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpful_count: res.helpful_count } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportReview = async (reviewId: string) => {
    const reason = prompt(
      'Please state the issue with this review (e.g. offensive language, fake details, spam):'
    );
    if (!reason || !reason.trim()) return;
    try {
      await api.reportReview(reviewId, reason.trim());
      alert('Review reported to community moderators for investigation.');
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-6 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <span>Seller Reviews &amp; Ratings</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 font-bold border border-orange-200">
              Seller: {sellerUsername}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Genuine buyer feedback from WhatsApp deal handovers and lobby inspections.
          </p>
        </div>

        {/* Action Button */}
        <div>
          {isSellerSelf ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-semibold border border-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
              <span>Your Seller Account</span>
            </span>
          ) : !user ? (
            <button
              onClick={() => openAuthModal('login')}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login to Review</span>
            </button>
          ) : userExistingReview ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartEdit(userExistingReview)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                <span>{showForm && editingReviewId ? 'Editing Review' : 'Edit Your Review'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenCreateForm}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{showForm ? 'Cancel Review' : 'Write a Review'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Ratings Summary Bar Chart & Score */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
        {/* Score Card */}
        <div className="md:col-span-4 text-center md:text-left space-y-1.5 md:border-r md:border-zinc-200/80 md:pr-6">
          <div className="text-4xl font-black text-zinc-950 font-display flex items-baseline justify-center md:justify-start gap-1">
            <span>{summary.total > 0 ? summary.average.toFixed(1) : 'New'}</span>
            {summary.total > 0 && <span className="text-lg font-bold text-zinc-400">/ 5.0</span>}
          </div>
          <div className="flex items-center justify-center md:justify-start gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(summary.average)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-zinc-300'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            {summary.total > 0
              ? `Calculated from ${summary.total} verified review${summary.total === 1 ? '' : 's'}`
              : 'No reviews yet for this seller'}
          </p>
        </div>

        {/* 5 to 1 Star Bars */}
        <div className="md:col-span-8 space-y-1.5">
          {[5, 4, 3, 2, 1].map((starNum) => {
            const count = summary.distribution[starNum as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
            return (
              <div key={starNum} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-zinc-600 shrink-0 flex items-center gap-1">
                  <span>{starNum}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-zinc-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-zinc-400 text-[11px] font-medium shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write / Edit Review Form */}
      {showForm && (
        <div id="review-form-container">
          <form 
            onSubmit={handleSubmitReview}
            className="p-5 sm:p-6 rounded-2xl bg-orange-50/40 border border-orange-200 space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>
                  {editingReviewId
                    ? `Edit Your Review for ${sellerUsername}`
                    : `Write a Review for ${sellerUsername}`}
                </span>
              </h4>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Star Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 block">
                Select Your Rating (1–5 Stars)
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-hidden cursor-pointer hover:scale-110 transition-transform"
                      title={`${star} Star`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold text-zinc-700 sm:ml-2">
                  {ratingDescriptions[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 block">
                Review Headline / Summary
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fast response, lobby verification was 100% genuine!"
                maxLength={80}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-xs font-medium text-zinc-900 focus:outline-hidden focus:border-orange-500 shadow-2xs"
                required
              />
            </div>

            {/* Detailed Experience */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 block">
                Your Feedback &amp; Trade Experience
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe the trade process: Did you inspect in game lobby? Was WhatsApp response fast? Was account details delivered safely?"
                rows={3}
                maxLength={600}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-xs font-medium text-zinc-900 focus:outline-hidden focus:border-orange-500 resize-none shadow-2xs"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 flex-wrap gap-2">
              {editingReviewId ? (
                <button
                  type="button"
                  onClick={() => confirmDeleteReview(editingReviewId)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Review</span>
                </button>
              ) : (
                <span className="text-[11px] text-zinc-500">
                  Note: You can submit 1 review per seller.
                </span>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-600 hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? 'Saving...'
                      : editingReviewId
                      ? 'Update Review'
                      : 'Publish Review'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Review List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
            All Reviews ({reviews.length})
          </h4>
          {userExistingReview && !showForm && (
            <span className="text-[11px] text-zinc-500">
              You have already reviewed this seller
            </span>
          )}
        </div>

        {reviews.length > 0 ? (
          reviews.map((rev) => {
            const isMyReview = Boolean(
              user &&
                ((rev.reviewer_user_id && String(rev.reviewer_user_id) === String(user.id)) ||
                  (rev.reviewer_username &&
                    rev.reviewer_username.trim().toLowerCase() === user.username.trim().toLowerCase()))
            );

            return (
              <div
                key={rev.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                  isMyReview
                    ? 'bg-orange-50/20 border-orange-200 shadow-2xs'
                    : 'bg-white border-zinc-200 shadow-2xs'
                }`}
              >
                {/* Reviewer Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-800 border border-orange-200 flex items-center justify-center text-xs font-black shrink-0">
                      {rev.reviewer_username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900">
                          {rev.reviewer_username}
                        </span>
                        {isMyReview && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-bold">
                            Your Review
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-400 font-mono">•</span>
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {formatDate(rev.created_at)}
                        </span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-zinc-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-zinc-700 ml-1">
                          {rev.rating}.0
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Edit/Delete for owner, or Helpful/Report for others */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isMyReview ? (
                      <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-1 shadow-2xs">
                        <button
                          onClick={() => handleStartEdit(rev)}
                          className="px-2.5 py-1 text-xs font-bold text-zinc-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Edit your review"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => confirmDeleteReview(rev.id)}
                          className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleMarkHelpful(rev.id)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                            helpfulClicked[rev.id]
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                          title="Mark this review as helpful"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Helpful ({rev.helpful_count || 0})</span>
                        </button>

                        <button
                          onClick={() => handleReportReview(rev.id)}
                          className="p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Report review"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Review Headline & Body */}
                <div className="space-y-1 pt-1">
                  <h5 className="text-xs font-bold text-zinc-900">{rev.title}</h5>
                  <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line">
                    {rev.comment}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center space-y-2 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <MessageSquare className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="text-xs font-bold text-zinc-700">No community reviews yet</p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Have you bought an account or communicated with {sellerUsername}? Share your feedback to guide fellow gamers!
            </p>
            {!user ? (
              <button
                onClick={() => openAuthModal('login')}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Login to be the first reviewer</span>
              </button>
            ) : !isSellerSelf ? (
              <button
                onClick={handleOpenCreateForm}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 cursor-pointer"
              >
                <Star className="w-3 h-3 fill-current" />
                <span>Write First Review</span>
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 max-w-sm w-full space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-zinc-900">Delete Your Review?</h4>
              <p className="text-xs text-zinc-500">
                Are you sure you want to remove your rating and comments for {sellerUsername}? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeletingId(null);
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
