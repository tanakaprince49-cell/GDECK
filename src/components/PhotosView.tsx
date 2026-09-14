import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Search,
  ExternalLink,
  Heart,
  Share2,
  Trash2,
  ArrowLeft,
  X,
  UploadCloud,
  Loader2,
  Sparkles,
  Download,
  FolderOpen,
} from 'lucide-react';
import { GooglePhotosIcon } from './GoogleIcons';
import { searchUserPhotos, WorkspacePhotoItem } from '../services/workspace';

interface PhotosViewProps {
  token?: string | null;
  onBackToOverview?: () => void;
}

export interface UserPhoto {
  id: string;
  url: string;
  title: string;
  date: string;
  source: 'drive' | 'upload';
  isFavorite?: boolean;
  size?: string;
  webViewLink?: string;
}

export const PhotosView: React.FC<PhotosViewProps> = ({ token, onBackToOverview }) => {
  const [photos, setPhotos] = useState<UserPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('gdeck_user_uploaded_photos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'drive' | 'uploads'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  // Fetch real user photos from Google Drive if token exists
  useEffect(() => {
    let isMounted = true;
    const fetchDrivePhotos = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const driveItems: WorkspacePhotoItem[] = await searchUserPhotos(token);
        if (isMounted && Array.isArray(driveItems)) {
          const drivePhotos: UserPhoto[] = driveItems.map((item) => {
            // Google Drive thumbnail link can be upscaled by appending =s800
            const thumb = item.thumbnailLink
              ? item.thumbnailLink.replace(/=s\d+/, '=s1000')
              : item.webContentLink || item.webViewLink || '';
            return {
              id: item.id,
              url: thumb,
              title: item.name.replace(/\.[^/.]+$/, ''),
              date: item.modifiedTime
                ? new Date(item.modifiedTime).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recent',
              source: 'drive',
              size: item.size
                ? `${(parseInt(item.size, 10) / (1024 * 1024)).toFixed(1)} MB`
                : undefined,
              webViewLink: item.webViewLink,
            };
          });

          // Combine with user uploaded photos without duplicates
          setPhotos((prev) => {
            const uploadedOnly = prev.filter((p) => p.source === 'upload');
            return [...drivePhotos, ...uploadedOnly];
          });
        }
      } catch (err) {
        console.warn('Could not load Google Drive photos:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDrivePhotos();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const saveUploadedPhotos = (newPhotos: UserPhoto[]) => {
    setPhotos(newPhotos);
    try {
      const uploadedOnly = newPhotos.filter((p) => p.source === 'upload');
      localStorage.setItem('gdeck_user_uploaded_photos', JSON.stringify(uploadedOnly));
    } catch {}
  };

  const handleToggleFavorite = (id: string) => {
    const updated = photos.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    saveUploadedPhotos(updated);
    if (selectedPhoto && selectedPhoto.id === id) {
      setSelectedPhoto({ ...selectedPhoto, isFavorite: !selectedPhoto.isFavorite });
    }
  };

  const handleDeletePhoto = (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    saveUploadedPhotos(updated);
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDataUrl) return;

    const newPhoto: UserPhoto = {
      id: `upload-${Date.now()}`,
      url: previewDataUrl,
      title: uploadTitle.trim() || 'My Photo',
      date: new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      source: 'upload',
    };

    saveUploadedPhotos([newPhoto, ...photos]);
    setShowUploadModal(false);
    setUploadTitle('');
    setPreviewDataUrl('');
  };

  const filteredPhotos = photos.filter((p) => {
    const matchesQuery = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesQuery) return false;
    if (activeFilter === 'favorites') return p.isFavorite;
    if (activeFilter === 'drive') return p.source === 'drive';
    if (activeFilter === 'uploads') return p.source === 'upload';
    return true;
  });

  return (
    <div id="photos-view" className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-amber-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-amber-500/10 border border-amber-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GooglePhotosIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Photos</h2>
            <p className="text-sm text-slate-500">
              Your personal photos & images from Google Drive and uploads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photos</span>
          </button>
          <a
            href="https://photos.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Photos Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Toolbar: Search & Album Filters */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search your photos by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 shadow-2xs text-slate-900 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({photos.length})
          </button>
          <button
            onClick={() => setActiveFilter('favorites')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeFilter === 'favorites'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Favorites ({photos.filter((p) => p.isFavorite).length})
          </button>
          <button
            onClick={() => setActiveFilter('drive')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeFilter === 'drive'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Drive ({photos.filter((p) => p.source === 'drive').length})
          </button>
          <button
            onClick={() => setActiveFilter('uploads')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              activeFilter === 'uploads'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Uploads ({photos.filter((p) => p.source === 'upload').length})
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 text-center bg-white/70 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-sm flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
          <p className="text-xs text-slate-600 font-medium">
            Fetching your photos from Google Drive...
          </p>
        </div>
      )}

      {/* Empty State (Honest & Clean) */}
      {!isLoading && filteredPhotos.length === 0 && (
        <div className="p-12 text-center bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Photos Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery
                ? `No photos matched "${searchQuery}".`
                : 'You have no image files stored in this view yet. Upload your own photos or store pictures in your connected Google Drive.'}
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Photos Now</span>
          </button>
        </div>
      )}

      {/* Photos Masonry / Grid */}
      {!isLoading && filteredPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-pointer aspect-square"
            >
              <img
                src={photo.url}
                alt={photo.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(photo.id);
                    }}
                    className={`p-1.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                      photo.isFavorite
                        ? 'bg-rose-500 text-white'
                        : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                <div>
                  <p className="text-white text-xs font-bold truncate drop-shadow-sm">
                    {photo.title}
                  </p>
                  <p className="text-white/80 text-[10px] drop-shadow-sm flex items-center justify-between mt-0.5">
                    <span>{photo.date}</span>
                    <span className="capitalize text-[9px] bg-white/20 px-1 rounded">
                      {photo.source}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Photo Inspector Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {selectedPhoto.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedPhoto.date} • {selectedPhoto.source === 'drive' ? 'Google Drive' : 'Local Upload'}
                  {selectedPhoto.size ? ` • ${selectedPhoto.size}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleFavorite(selectedPhoto.id)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    selectedPhoto.isFavorite
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'border-slate-200 text-slate-400 hover:text-slate-700'
                  }`}
                  title="Toggle Favorite"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
                {selectedPhoto.webViewLink && (
                  <a
                    href={selectedPhoto.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                    title="Open original file in Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete from G-Deck Gallery"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-950 flex items-center justify-center min-h-[320px]">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Photo Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Your Photo</h3>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewDataUrl('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Photo Title / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Profile Photo, Vacation in Hawaii..."
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                />
              </div>

              {previewDataUrl && (
                <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <img
                    src={previewDataUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setPreviewDataUrl('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!previewDataUrl}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
