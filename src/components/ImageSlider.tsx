import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  ZoomIn, 
  ZoomOut,
  Image as ImageIcon 
} from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  title: string;
  level?: number;
  rank?: string;
  isSold?: boolean;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  title,
  level,
  rank,
  isSold = false,
}) => {
  const validImages = images && images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Touch swipe handling for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 45;

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
    setIsZoomed(false);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    setIsZoomed(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  // Keyboard navigation when fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      if (e.key === 'Escape') {
        setIsFullscreen(false);
        setIsZoomed(false);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, validImages.length]);

  return (
    <div className="space-y-3 select-none">
      {/* Main Large Image Box */}
      <div 
        className="relative aspect-16/10 w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-200/90 shadow-xs group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={validImages[currentIndex]}
          alt={`${title} screenshot ${currentIndex + 1}`}
          className="w-full h-full object-cover sm:object-contain bg-zinc-950 transition-opacity duration-300"
        />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
          {level !== undefined && (
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900/85 text-white font-extrabold text-[11px] backdrop-blur-md shadow-xs flex items-center gap-1">
              <span className="text-orange-400">LVL</span>
              <span>{level}</span>
            </span>
          )}
          {rank && (
            <span className="px-2.5 py-1 rounded-lg bg-orange-600 text-white font-extrabold text-[11px] backdrop-blur-md shadow-xs">
              {rank}
            </span>
          )}
        </div>

        {/* Counter Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-950/75 backdrop-blur-md text-white text-[11px] font-bold shadow-xs flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3 text-zinc-300" />
            <span>{currentIndex + 1} / {validImages.length}</span>
          </span>

          {/* Fullscreen Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="w-8 h-8 rounded-lg bg-zinc-950/75 backdrop-blur-md text-white hover:bg-orange-600 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            title="Open Fullscreen Gallery"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sold Overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-zinc-950/75 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="text-center space-y-1">
              <span className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-black text-sm uppercase tracking-widest shadow-2xl">
                ACCOUNT SOLD
              </span>
              <p className="text-xs text-zinc-300 pt-1 font-medium">This ID is no longer available</p>
            </div>
          </div>
        )}

        {/* Prev / Next Nav Buttons (Desktop) */}
        {validImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-zinc-900/75 hover:bg-orange-600 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-md cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-zinc-900/75 hover:bg-orange-600 text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 shadow-md cursor-pointer z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Mobile Swipe Hint Indicator */}
        {validImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 sm:hidden">
            {validImages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-5 bg-orange-500' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails Row (Desktop & Tablet) */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-300">
          {validImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsZoomed(false);
              }}
              className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-zinc-100 ${
                currentIndex === idx
                  ? 'border-orange-600 ring-2 ring-orange-500/20 shadow-xs scale-[1.02]'
                  : 'border-zinc-200 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white max-w-7xl mx-auto w-full py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-300">{title}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {currentIndex + 1} / {validImages.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isZoomed ? 'Zoom Out' : 'Zoom In'}
              >
                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                <span className="hidden sm:inline">{isZoomed ? 'Actual' : 'Zoom'}</span>
              </button>

              <button
                onClick={() => {
                  setIsFullscreen(false);
                  setIsZoomed(false);
                }}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-red-600 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                title="Close Fullscreen (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Image Content */}
          <div 
            className="flex-1 flex items-center justify-center relative overflow-hidden my-2"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={validImages[currentIndex]}
              alt={`${title} fullscreen view`}
              className={`max-w-full max-h-full object-contain transition-all duration-200 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            />

            {validImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-900/80 hover:bg-orange-600 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-xl cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-900/80 hover:bg-orange-600 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-xl cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {validImages.length > 1 && (
            <div className="max-w-4xl mx-auto w-full flex items-center justify-center gap-2 overflow-x-auto py-2">
              {validImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsZoomed(false);
                  }}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    currentIndex === idx ? 'border-orange-500 scale-105' : 'border-zinc-700 opacity-50 hover:opacity-90'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
