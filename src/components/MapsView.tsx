import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Globe,
  Compass,
  Building2,
  Phone,
  Star,
  RefreshCw,
} from 'lucide-react';
import { GoogleMapsIcon } from './GoogleIcons';

interface MapsViewProps {
  onBackToOverview?: () => void;
}

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  category?: string;
  lat: number;
  lng: number;
}

const PRESET_PLACES: PlaceResult[] = [
  {
    id: 'p1',
    name: 'Googleplex (HQ)',
    address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
    category: 'Technology Campus',
    lat: 37.422,
    lng: -122.084,
  },
  {
    id: 'p2',
    name: 'Google Pier 57',
    address: '25 11th Ave, New York, NY 10011, USA',
    category: 'Regional Hub',
    lat: 40.742,
    lng: -74.009,
  },
  {
    id: 'p3',
    name: 'Google London (King’s Cross)',
    address: '6 Pancras Sq, London N1C 4AG, United Kingdom',
    category: 'European Headquarters',
    lat: 51.533,
    lng: -0.125,
  },
  {
    id: 'p4',
    name: 'Tokyo Tower & Roppongi',
    address: '4 Chome-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan',
    category: 'Landmark & Tech District',
    lat: 35.6586,
    lng: 139.7454,
  },
];

export const MapsView: React.FC<MapsViewProps> = ({ onBackToOverview }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>(PRESET_PLACES);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult>(PRESET_PLACES[0]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      // Use Nominatim open geocoder to search real places worldwide
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );

      if (!res.ok) {
        throw new Error('Search service busy, showing direct map query');
      }

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const places: PlaceResult[] = data.map((item: any, idx: number) => {
          const mainName =
            item.name ||
            item.display_name.split(',')[0] ||
            item.address?.city ||
            item.address?.town ||
            query;
          return {
            id: `geo-${idx}-${Date.now()}`,
            name: mainName,
            address: item.display_name,
            category: item.type ? item.type.replace(/_/g, ' ') : 'Location',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });

        setSearchResults(places);
        setSelectedPlace(places[0]);
      } else {
        // If not found in nominatim, create a custom query place so Google Maps embeds it directly!
        const fallbackPlace: PlaceResult = {
          id: `custom-${Date.now()}`,
          name: query,
          address: query,
          category: 'Searched Place',
          lat: 0,
          lng: 0,
        };
        setSearchResults([fallbackPlace, ...PRESET_PLACES]);
        setSelectedPlace(fallbackPlace);
      }
    } catch (err: any) {
      // Fallback to direct location map search
      const directPlace: PlaceResult = {
        id: `direct-${Date.now()}`,
        name: query,
        address: query,
        category: 'Custom Search',
        lat: 0,
        lng: 0,
      };
      setSearchResults([directPlace, ...PRESET_PLACES]);
      setSelectedPlace(directPlace);
    } finally {
      setIsSearching(false);
    }
  };

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    selectedPlace.lat && selectedPlace.lng
      ? `${selectedPlace.lat},${selectedPlace.lng}`
      : selectedPlace.address
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

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
            <p className="text-sm text-slate-500">
              Live location search, satellite previews, coordinates & turn-by-turn navigation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              selectedPlace.address
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform"
          >
            <Navigation className="w-4 h-4" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Dual-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
        {/* Left: Location Search & Results List */}
        <div className="lg:col-span-4 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-4 sm:p-5 space-y-4 flex flex-col">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search any place, city, address, or business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-2xs text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Quick pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <button
              onClick={() => {
                setSearchQuery('Coffee near me');
                setSearchResults(PRESET_PLACES);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-medium whitespace-nowrap cursor-pointer"
            >
              ☕ Cafés
            </button>
            <button
              onClick={() => {
                setSearchQuery('Airport');
                setSearchResults(PRESET_PLACES);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-medium whitespace-nowrap cursor-pointer"
            >
              ✈️ Airports
            </button>
            <button
              onClick={() => {
                setSearchResults(PRESET_PLACES);
                setSelectedPlace(PRESET_PLACES[0]);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-medium whitespace-nowrap cursor-pointer"
            >
              🏢 Tech Campuses
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[420px] pr-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Search Results ({searchResults.length})
            </p>

            {searchResults.map((place) => {
              const isSelected = place.id === selectedPlace.id;
              return (
                <div
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/80 text-blue-950 shadow-xs'
                      : 'border-slate-200/80 bg-white/70 hover:bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isSelected ? 'text-blue-600' : 'text-red-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold truncate text-slate-900">{place.name}</h4>
                        {place.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 capitalize">
                            {place.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {place.address}
                      </p>
                      {place.lat !== 0 && (
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Map Canvas & Details */}
        <div className="lg:col-span-8 bg-white/75 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-[0_16px_40px_rgba(0,15,40,0.05)] p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          {/* Map Viewer */}
          <div className="w-full h-96 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-inner">
            <iframe
              key={mapEmbedUrl}
              title={`Map Preview for ${selectedPlace.name}`}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={mapEmbedUrl}
              className="w-full h-full border-0"
            />
          </div>

          {/* Place Details Bar */}
          <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900">{selectedPlace.name}</h3>
              </div>
              <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                {selectedPlace.address}
              </p>
              {selectedPlace.lat !== 0 && (
                <p className="text-[11px] text-slate-400 pl-6 font-mono">
                  Coordinates: {selectedPlace.lat.toFixed(5)}, {selectedPlace.lng.toFixed(5)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  selectedPlace.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-105"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedPlace.address
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Full Map</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
