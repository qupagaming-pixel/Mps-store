import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  X, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Image as ImageIcon,
  Sparkles,
  Cloud,
  CloudUpload,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface SellPageProps {
  onListingCreated: (listingId: string | number) => void;
  onNavigate: (path: string) => void;
}

const RANKS = [
  'Grandmaster',
  'Master',
  'Heroic',
  'Diamond IV',
  'Diamond III',
  'Diamond II',
  'Diamond I',
  'Platinum IV',
  'Gold IV',
  'Silver'
];

const REGIONS = [
  'India (IND)',
  'Singapore (SG)',
  'Bangladesh (BD)',
  'Brazil (BR)',
  'Global / Other'
];

const LOGIN_TYPES = [
  'Google',
  'Facebook',
  'Twitter / X',
  'VK'
];

// High quality gaming placeholder screenshots for quick fill or demo
const SAMPLE_SCREENSHOTS = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80'
];

export const SellPage: React.FC<SellPageProps> = ({ onListingCreated, onNavigate }) => {
  const { user, openAuthModal } = useAuth();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [level, setLevel] = useState('65');
  const [rank, setRank] = useState('Heroic');
  const [region, setRegion] = useState('India (IND)');
  const [loginType, setLoginType] = useState('Google');

  const [skins, setSkins] = useState('');
  const [bundles, setBundles] = useState('');
  const [emotes, setEmotes] = useState('');
  const [characters, setCharacters] = useState('');
  const [rareItems, setRareItems] = useState('');
  const [description, setDescription] = useState('');

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successListingId, setSuccessListingId] = useState<string | number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ configured: boolean; provider: string } | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');

  useEffect(() => {
    api.getUploadStatus()
      .then((st) => setUploadStatus(st))
      .catch(() => setUploadStatus({ configured: false, provider: 'ImgBB API' }));
  }, []);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 mx-auto flex items-center justify-center">
          <Upload className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
          Sign In to List Your Gaming Account
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
          Please log in or register a free account to publish your Free Fire ID listing and connect directly with buyers on WhatsApp.
        </p>
        <div className="pt-2">
          <button
            onClick={() => openAuthModal('login')}
            className="py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Log In or Register
          </button>
        </div>
      </div>
    );
  }

  // Handle image file upload using ImgBB API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    const validFiles: File[] = [];

    Array.from(files).forEach((file: File) => {
      // Validate format
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPG, PNG, and WebP images are allowed.');
        return;
      }
      // Validate size (max 8MB per image)
      if (file.size > 8 * 1024 * 1024) {
        setError('Image file size exceeds 8MB limit.');
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length === 0) return;

    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      if (images.length + uploadedUrls.length >= 6) break;

      setUploadProgressMsg(`Uploading to ImgBB (${i + 1}/${validFiles.length})...`);

      try {
        const base64Data: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload to ImgBB via backend proxy
        const res = await api.uploadImage(base64Data, file.name);
        if (res && res.url) {
          uploadedUrls.push(res.url);
        } else {
          uploadedUrls.push(base64Data);
        }
      } catch (err: any) {
        console.warn('ImgBB upload error or missing key:', err);
        // If ImgBB upload fails or key not yet added, fallback to base64 preview so user is not blocked
        const base64Fallback: string = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        uploadedUrls.push(base64Fallback);
        if (err.message && err.message.includes('IMGBB_API_KEY')) {
          setError('ImgBB API key is not configured in Settings. Saved as direct preview.');
        } else if (err.message) {
          setError(`ImgBB upload notice: ${err.message}`);
        }
      }
    }

    setImages((prev) => [...prev, ...uploadedUrls].slice(0, 6));
    setIsUploadingImages(false);
    setUploadProgressMsg('');
    // Clear input
    e.target.value = '';
  };

  const addSampleImage = (url: string) => {
    if (images.length < 6 && !images.includes(url)) {
      setImages([...images, url]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || title.trim().length < 5) {
      setError('Please provide a descriptive title (at least 5 characters).');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid price in Indian Rupees (₹).');
      return;
    }

    const numLevel = parseInt(level, 10);
    if (isNaN(numLevel) || numLevel < 1 || numLevel > 150) {
      setError('Account level must be between 1 and 150.');
      return;
    }

    if (images.length === 0) {
      setError('Please provide at least one screenshot or image of your account.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createListing({
        title: title.trim(),
        price: numPrice,
        level: numLevel,
        rank,
        region,
        login_type: loginType,
        skins: skins.trim(),
        bundles: bundles.trim(),
        emotes: emotes.trim(),
        characters: characters.trim(),
        rare_items: rareItems.trim(),
        description: description.trim(),
        images,
      });

      setSuccessListingId(res.listing_id);
      // Automatically redirect to Home page after short confirmation
      setTimeout(() => {
        onNavigate('/?created=true');
      }, 1600);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing. Please check form fields.');
    } finally {
      setLoading(false);
    }
  };

  if (successListingId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            Your Listing is Now Live!
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Buyers can now discover your Free Fire ID in the marketplace.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Listing ID #{successListingId} • WhatsApp click-to-chat enabled</span>
        </div>

        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-800 font-semibold flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
          <span>Redirecting to Home Page...</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('/?created=true')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Go to Home Page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onListingCreated(successListingId)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold text-xs cursor-pointer"
          >
            View Published Listing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight font-display">
          Sell Your Gaming Account
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Create a listing and connect with interested buyers directly through WhatsApp.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5 shadow-2xs">
          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
            1. Basic Information
          </h3>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              Listing Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Level 72 Grandmaster ID with Evo Draco AK Max & Cobra Bundle"
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Price in Rupees (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="text-zinc-400 absolute left-3 top-2.5 text-xs font-bold">₹</span>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 3500"
                  className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Account Level <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g. 70"
                min="1"
                max="150"
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Rank <span className="text-red-500">*</span>
              </label>
              <select
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500 bg-white"
              >
                {RANKS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Server Region <span className="text-red-500">*</span>
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500 bg-white"
              >
                {REGIONS.map((reg) => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Login Type / Binding <span className="text-red-500">*</span>
              </label>
              <select
                value={loginType}
                onChange={(e) => setLoginType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500 bg-white"
              >
                {LOGIN_TYPES.map((lt) => (
                  <option key={lt} value={lt}>{lt} Account</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Account Details & In-game Items */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
            2. Account Details &amp; Rare Items
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Gun Skins (comma separated)
              </label>
              <input
                type="text"
                value={skins}
                onChange={(e) => setSkins(e.target.value)}
                placeholder="e.g. Draco AK (Lvl 7), MP40 Predatory Cobra, Scar Titan"
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Bundles &amp; Outfits (comma separated)
              </label>
              <input
                type="text"
                value={bundles}
                onChange={(e) => setBundles(e.target.value)}
                placeholder="e.g. Cobra Bundle, Hip Hop, Arctic Blue, Season 2"
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Emotes (comma separated)
              </label>
              <input
                type="text"
                value={emotes}
                onChange={(e) => setEmotes(e.target.value)}
                placeholder="e.g. Tea Time, Flag, Lol, Pirate, Flowers of Love"
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Unlocked Characters (comma separated)
              </label>
              <input
                type="text"
                value={characters}
                onChange={(e) => setCharacters(e.target.value)}
                placeholder="e.g. Alok (Max), Chrono, K, Wukong, Tatsuya"
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Detailed Description &amp; Extra Notes
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete details about badges, elite passes, win-rate, KD, clean binding status, etc."
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:outline-hidden focus:border-orange-500"
            ></textarea>
          </div>
        </div>

        {/* SECTION 3: Screenshots / Image Upload */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">
                  3. Account Screenshots
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                  <CloudUpload className="w-3 h-3 text-orange-600" />
                  ImgBB Cloud
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Upload up to 6 screenshots stored securely on ImgBB CDN image servers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400">
                {images.length}/6 images
              </span>
            </div>
          </div>

          {/* Upload Progress Notification */}
          {isUploadingImages && (
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-900 flex items-center gap-2.5 animate-pulse">
              <Loader2 className="w-4 h-4 text-orange-600 animate-spin shrink-0" />
              <div className="font-bold">
                {uploadProgressMsg || 'Uploading screenshots to ImgBB API...'}
              </div>
            </div>
          )}

          {/* Upload Drop Area */}
          <div className="border-2 border-dashed border-zinc-300 hover:border-orange-500 rounded-2xl p-6 text-center transition-colors bg-zinc-50/50">
            <input
              type="file"
              id="file-upload"
              multiple
              disabled={isUploadingImages || images.length >= 6}
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className={`block space-y-2 ${isUploadingImages || images.length >= 6 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center">
                {isUploadingImages ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </div>
              <div className="text-xs font-bold text-zinc-800">
                {isUploadingImages ? 'Uploading screenshots to ImgBB...' : 'Click to upload screenshots or drag & drop'}
              </div>
              <p className="text-[11px] text-zinc-400">
                Direct storage on ImgBB • PNG, JPG, WebP (Max 8MB per file)
              </p>
            </label>
          </div>

          {/* Quick Demo Templates / Samples */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-zinc-500 block mb-1.5">
              Or pick instant showcase screenshots for this demo:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_SCREENSHOTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addSampleImage(s)}
                  className="relative aspect-16/10 rounded-xl overflow-hidden border border-zinc-200 hover:border-orange-500 transition-all cursor-pointer group"
                >
                  <img src={s} alt="sample" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center text-white text-[10px] font-bold">
                    + Add
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Previews */}
          {images.length > 0 && (
            <div className="pt-3">
              <span className="text-xs font-bold text-zinc-700 block mb-2">
                Uploaded Screenshots ({images.length}/6) – First is Primary Cover:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-16/10 rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-100">
                    <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    {index === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-zinc-900/80 text-white text-[9px] font-bold">
                        Primary Cover
                      </span>
                    )}
                    {img.includes('ibb.co') && (
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-orange-600/90 text-white text-[8px] font-bold">
                        ImgBB CDN
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs hover:bg-red-700 cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Seller Profile Confirmation */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-3 shadow-2xs">
          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
            4. Seller Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Seller Username</span>
              <p className="font-bold text-zinc-900">{user.username}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Registered WhatsApp</span>
              <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                •••• •••• {user.whatsapp_number.slice(-4)} (Protected)
              </p>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400">
            Buyers will click "Contact Seller on WhatsApp" to message you directly. Your phone number is never exposed in plain text.
          </p>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-bold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Publishing Listing...</span>
              </>
            ) : (
              <span>Publish Listing</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
