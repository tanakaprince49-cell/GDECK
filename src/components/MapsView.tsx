import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  ExternalLink,
  ArrowLeft,
  Compass,
  Layers,
  Building2,
  Phone,
  Globe,
  Clock,
  Star,
} from 'lucide-react';
import { GoogleMapsIcon } from './GoogleIcons';

interface MapsViewProps {
  onBackToOverview?: () => void;
}

interface PlaceItem {
  id: string;
  name: string;
  address: string;
  category: string;
  rating: number;
  reviewsCount: number;
  phone: string;
  status: string;
  lat: number;
  lng: number;
}

const DEFAULT_PLACES: PlaceItem[] = [
  {
    id: 'p1',
    name: 'Google HQ (Googleplex)',
    address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
    category: 'Corporate Headquarters',
    rating: 4.8,
    reviewsCount: 14200,
    phone: '+1 650-253-0000',
    status: 'Open • Closes 6 PM',
    lat: 37.422,
    lng: -122.084,
  },
  {
    id: 'p2',
    name: 'Google Pier 57',
    address: '25 11th Ave, New York, NY 10011',
    category: 'Regional Tech Office',
    rating: 4.7,
    reviewsCount: 3100,
    phone: '+1 212-565-0000',
    status: 'Open • Closes 7 PM',
    lat: 40.742,
    lng: -74.009,
  },
  {
    id: 'p3',
    name: 'Google London (King’s Cross)',
    address: '6 Pancras Sq, London N1C 4AG, United Kingdom',
    category: 'European Hub',
    rating: 4.9,
    reviewsCount: 5800,
    phone: '+44 20 7031 3000',
    status: 'Open • Closes 6 PM',
    lat: 51.533,
    lng: -0.125,
  },
];

export const MapsView: React.FC<MapsViewProps> = ({ onBackToOverview }) => {
  const [places, setPlaces] = useState<PlaceItem[]>(DEFAULT_PLACES);
  const [selectedPlace, setSelectedPlace] = useState<PlaceItem>(DEFAULT_PLACES[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPlaces = places.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="maps-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/75 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05),inset_0_1.5px_2px_rgba(255,255,255,1)]">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white/80 hover:bg-white border border-white/90 rounded-xl transition-all shadow-2xs cursor-pointer shrink-0"
              title="Return to Workspace Overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="p-2 bg-blue-500/10 border border-blue-200/60 rounded-2xl shrink-0 shadow-2xs flex items-center justify-center">
            <GoogleMapsIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Google Maps</h2>
            <p className="text-sm text-slate-500">Explore locations, corporate offices, route directions & live traffic</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer hover:scale-105"
          >
            <Navigation className="w-4 h-4" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Dual-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px]">
        {/* Left: Locations & Search */}
        <div className="lg:col-span-4 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Google campuses & locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white/80 border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            />
          </div>

          <div className="space-y-2">
            {filteredPlaces.map((p) => {
              const isSelected = p.id === selectedPlace.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlace(p)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 text-blue-950 shadow-xs'
                      : 'border-slate-200/80 bg-white/70 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-red-500'}`} />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold truncate">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.address}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-semibold text-slate-500">
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-current" /> {p.rating}
                        </span>
                        <span>({p.reviewsCount.toLocaleString()})</span>
                        <span className="text-emerald-600">• {p.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Map Stage & Location Card */}
        <div className="lg:col-span-8 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-6 space-y-6 flex flex-col justify-between">
          {/* Interactive Map Canvas Embed Simulation */}
          <div className="w-full h-80 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
            <iframe
              title="Google Map Preview"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedPlace.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
              className="w-full h-full border-0"
            />
          </div>

          {/* Place Details Bar */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{selectedPlace.name}</h3>
              <p className="text-xs text-slate-500">{selectedPlace.address}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Phone: {selectedPlace.phone} • Coordinates: {selectedPlace.lat}, {selectedPlace.lng}
              </p>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedPlace.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
