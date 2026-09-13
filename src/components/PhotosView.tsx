import React, { useState } from 'react';
import {
  Image,
  Plus,
  Search,
  ExternalLink,
  Heart,
  Share2,
  Trash2,
  ArrowLeft,
  X,
  UploadCloud,
  FolderPlus,
  Sparkles,
} from 'lucide-react';
import { GooglePhotosIcon } from './GoogleIcons';

interface PhotosViewProps {
  onBackToOverview?: () => void;
}

interface PhotoItem {
  id: string;
  url: string;
  title: string;
  album: string;
  date: string;
  isFavorite: boolean;
}

const DEFAULT_PHOTOS: PhotoItem[] = [
  {
    id: 'p1',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    title: 'Alpine Valley Morning',
    album: 'Nature',
    date: 'Sep 10, 2026',
    isFavorite: true,
  },
  {
    id: 'p2',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    title: 'Workspace Product Brainstorm',
    album: 'Team Events',
    date: 'Sep 8, 2026',
    isFavorite: false,
  },
  {
    id: 'p3',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
    title: 'Modern Architecture HQ',
    album: 'Offices',
    date: 'Sep 4, 2026',
    isFavorite: true,
  },
  {
    id: 'p4',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    title: 'Satellite Cloud Network',
    album: 'Design',
    date: 'Aug 29, 2026',
    isFavorite: false,
  },
  {
    id: 'p5',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    title: 'Engineering All-Hands',
    album: 'Team Events',
    date: 'Aug 22, 2026',
    isFavorite: false,
  },
  {
    id: 'p6',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    title: 'Sunset Coastline',
    album: 'Nature',
    date: 'Aug 15, 2026',
    isFavorite: true,
  },
];

export const PhotosView: React.FC<PhotosViewProps> = ({ onBackToOverview }) => {
  const [photos, setPhotos] = useState<PhotoItem[]>(DEFAULT_PHOTOS);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadUrl, setUploadUrl] = useState<string>('');
  const [uploadAlbum, setUploadAlbum] = useState<string>('General');

  const albums = ['All', 'Favorites', ...Array.from(new Set(photos.map((p) => p.album)))];

  const handleToggleFavorite = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  const handleUploadPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) return;
    const newPhoto: PhotoItem = {
      id: `p-${Date.now()}`,
      url: uploadUrl.trim(),
      title: uploadTitle.trim() || 'Uploaded Photo',
      album: uploadAlbum.trim() || 'General',
      date: 'Just now',
      isFavorite: false,
    };
    setPhotos([newPhoto, ...photos]);
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadUrl('');
  };

  const filteredPhotos = photos.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.album.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedAlbum === 'All') return matchesSearch;
    if (selectedAlbum === 'Favorites') return p.isFavorite && matchesSearch;
    return p.album === selectedAlbum && matchesSearch;
  });

  return (
    <div id="photos-view" className="space-y-6">
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
            <p className="text-sm text-slate-500">Cloud photo library, albums, backup & visual search</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs border border-amber-400/40 flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Photo
          </button>
          <a
            href="https://photos.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-slate-600 hover:text-amber-600 bg-white/70 hover:bg-white rounded-xl border border-white/90 transition-colors shadow-2xs cursor-pointer"
            title="Open Google Photos Web"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Album Filters & Search */}
      <div className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {albums.map((alb) => (
            <button
              key={alb}
              onClick={() => setSelectedAlbum(alb)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedAlbum === alb
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white/70 hover:bg-white text-slate-600 border border-slate-200/80'
              }`}
            >
              {alb}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search photos & places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/80 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
          />
        </div>
      </div>

      {/* Photos Masonry / Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {filteredPhotos.map((p) => (
          <div
            key={p.id}
            className="bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 overflow-hidden shadow-[0_12px_30px_rgba(0,15,40,0.04)] group transition-all hover:scale-[1.02] cursor-pointer"
            onClick={() => setLightboxPhoto(p)}
          >
            <div className="aspect-4/3 relative overflow-hidden bg-slate-100">
              <img
                src={p.url}
                alt={p.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(p.id);
                }}
                className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                  p.isFavorite
                    ? 'bg-red-500/90 text-white'
                    : 'bg-black/30 hover:bg-black/50 text-white'
                }`}
                title={p.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
              >
                <Heart className={`w-3.5 h-3.5 ${p.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 truncate">{p.title}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{p.album} • {p.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 text-white">
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[70vh] object-contain bg-black"
            />
            <div className="p-5 bg-slate-900/90 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{lightboxPhoto.title}</h3>
                <p className="text-xs text-slate-400">{lightboxPhoto.album} • {lightboxPhoto.date}</p>
              </div>
              <button
                onClick={() => handleToggleFavorite(lightboxPhoto.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  lightboxPhoto.isFavorite ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Heart className={`w-4 h-4 ${lightboxPhoto.isFavorite ? 'fill-current' : ''}`} />
                <span>{lightboxPhoto.isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GooglePhotosIcon className="w-6 h-6" />
                <h3 className="text-base font-bold text-slate-900">Upload to Google Photos</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadPhoto} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Photo Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Team Offsite"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Album
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nature, Team Events"
                  value={uploadAlbum}
                  onChange={(e) => setUploadAlbum(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
