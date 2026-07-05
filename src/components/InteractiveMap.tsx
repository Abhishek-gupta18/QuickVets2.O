import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  Search, MapPin, Star, Phone, Navigation, Calendar, X, Layers, 
  ChevronLeft, ChevronRight, Compass, ShieldAlert, SlidersHorizontal, 
  Map as MapIcon, RotateCcw, Mic, Check, Clock, Sparkles, Info,
  Car, Footprints, Train, ArrowLeft, Volume2, ShieldCheck, CheckSquare, Plus, Minus
} from 'lucide-react';
import { VetClinic } from '../types';
import { calculateHaversineDistance } from '../data';

interface InteractiveMapProps {
  clinics: VetClinic[];
  userLocation: { lat: number; lng: number } | null;
  onBookClinic: (clinic: VetClinic) => void;
  preSelectedClinicId?: string | null;
  onSelectClinic?: (id: string | null) => void;
}

export default function InteractiveMap({
  clinics,
  userLocation,
  onBookClinic,
  preSelectedClinicId,
  onSelectClinic,
}: InteractiveMapProps) {
  // State elements
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchRadius, setSearchRadius] = useState(25);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [navigatingToClinicId, setNavigatingToClinicId] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<'drive' | 'walk' | 'transit'>('drive');
  
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [bottomSheetState, setBottomSheetState] = useState<'minimized' | 'peek' | 'expanded'>('peek');
  const [mapLayerType, setMapLayerType] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [callClinicNumber, setCallClinicNumber] = useState<string | null>(null);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.FeatureGroup | null>(null);

  // Handle pre-selection sync
  useEffect(() => {
    if (preSelectedClinicId !== undefined) {
      setSelectedClinicId(preSelectedClinicId);
      if (preSelectedClinicId) {
        setIsPanelCollapsed(true);
      }
    }
  }, [preSelectedClinicId]);

  // Sync selected ID to parent
  const handleSelectClinic = (id: string | null) => {
    setSelectedClinicId(id);
    if (onSelectClinic) {
      onSelectClinic(id);
    }
    if (id) {
      // Pan map to clinic
      const clinic = clinics.find(c => c.id === id);
      if (clinic && mapInstanceRef.current) {
        mapInstanceRef.current.setView([clinic.latitude, clinic.longitude], 15, { animate: true, duration: 0.5 });
        // Open popup
        const marker = markersRef.current[id];
        if (marker) {
          marker.openPopup();
        }
      }
    }
  };

  // Base map tiles mapping
  const tileUrl = useMemo(() => {
    switch (mapLayerType) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'streets':
      default:
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }
  }, [mapLayerType]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = userLocation?.lat ?? 12.9716; // Bengaluru fallback or India
    const initialLng = userLocation?.lng ?? 77.5946;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false, // Turn off default so we can place custom ones
      });

      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Update tile layers dynamically
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [tileUrl]);

  // Pan to user location when detected
  useEffect(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [userLocation?.lat, userLocation?.lng]);

  // Handle User Position Indicator
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) userMarkerRef.current.remove();
    if (radiusCircleRef.current) radiusCircleRef.current.remove();

    // Pulse dot for User Location
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-40"></span>
          <div class="relative rounded-full h-4.5 w-4.5 bg-blue-600 border-2 border-white shadow-xl"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup('<b class="font-display font-black text-slate-800">Your Location</b>');

    radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
      radius: searchRadius * 1000,
      color: '#58B368',
      fillColor: '#58B368',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '4, 4',
    }).addTo(map);

  }, [userLocation, searchRadius]);

  // Filtration logic
  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic) => {
      // 1. Search query matching
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = clinic.name.toLowerCase().includes(query);
        const matchesVet = clinic.veterinarianName?.toLowerCase().includes(query) || false;
        const matchesArea = clinic.area.toLowerCase().includes(query) || clinic.city.toLowerCase().includes(query);
        const matchesSpecialist = clinic.specialists.some(s => s.toLowerCase().includes(query));
        const matchesService = clinic.services.some(s => s.toLowerCase().includes(query));
        if (!matchesName && !matchesVet && !matchesArea && !matchesSpecialist && !matchesService) {
          return false;
        }
      }

      // 2. Quick filter chips
      if (selectedFilters.includes('Open Now') && !clinic.isOpenNow) return false;
      if (selectedFilters.includes('Emergency') && !clinic.hasEmergency) return false;
      if (selectedFilters.includes('Top Rated') && clinic.rating < 4.7) return false;
      
      // Pet Type Pills
      if (selectedFilters.includes('Dogs') && !clinic.specialists.includes('Dog')) return false;
      if (selectedFilters.includes('Cats') && !clinic.specialists.includes('Cat')) return false;
      if (selectedFilters.includes('Birds') && !clinic.specialists.includes('Bird')) return false;
      if (selectedFilters.includes('Rabbits') && !clinic.specialists.includes('Rabbit')) return false;
      if (selectedFilters.includes('Exotics') && !clinic.specialists.includes('Exotics')) return false;

      // 3. Distance Radius calculation
      if (userLocation) {
        const dist = calculateHaversineDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude);
        if (selectedFilters.includes('Near Me') && dist > 8) return false; // within 8 km
        if (dist > searchRadius) return false;
      }

      return true;
    });
  }, [clinics, searchQuery, selectedFilters, searchRadius, userLocation]);

  // Update Clinic Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    for (const id in markersRef.current) {
      if (markersRef.current[id]) {
        markersRef.current[id].remove();
      }
    }
    markersRef.current = {};

    filteredClinics.forEach((clinic) => {
      const isSelected = clinic.id === selectedClinicId;
      const isEmergency = clinic.hasEmergency;
      
      // Select marker styling based on type
      let markerColor = '#58B368'; // Standard Clinic (Emerald)
      let iconMarkup = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 2.91-3.34 3.12-3.5a1.16 1.16 0 0 1 .83-.1 1.05 1.05 0 0 1 .6 1.15c-.24 2.19-1 4.54-2 5.92a7.35 7.35 0 0 1 1.15 4c0 3.86-3.14 7-7 7s-7-3.14-7-7c0-1.42.42-2.73 1.15-4-1-1.38-1.74-3.73-2-5.92a1.05 1.05 0 0 1 .6-1.15 1.16 1.16 0 0 1 .83.1C6.67 1.92 7.8 3.26 9.58 5.26c.65-.17 1.33-.26 2.42-.26Z"/></svg>';

      if (isEmergency) {
        markerColor = '#EF4444'; // Emergency Clinic (Crimson Red)
        iconMarkup = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19V5"/></svg>';
      } else if (clinic.workingHours.toLowerCase().includes('24 hours') || clinic.workingHours.toLowerCase().includes('24/7')) {
        markerColor = '#805AD5'; // 24/7 Hospital (Purple)
        iconMarkup = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 2.5-2 2.5s3.5.5 6-1.5M19.5 16.5c1.5 1.26 2 2.5 2 2.5s-3.5.5-6-1.5M12 2v20M5 12h14"/></svg>';
      } else if (clinic.hasHomeVisit) {
        markerColor = '#3182CE'; // Home Visit Vet (Blue)
        iconMarkup = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
      }

      const pulseClass = isSelected ? (isEmergency ? 'pulse-emergency' : 'pulse-regular') : '';

      const markerHtml = `
        <div class="custom-vet-pin flex flex-col items-center justify-center ${pulseClass} transition-all duration-200">
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-lg" style="background-color: ${markerColor};">
            ${iconMarkup}
          </div>
          <div class="w-2.5 h-2.5 -mt-1.5 rounded-full border border-white shadow-sm" style="background-color: ${markerColor};"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: markerHtml,
        iconSize: [40, 46],
        iconAnchor: [20, 46],
        popupAnchor: [0, -42],
      });

      const marker = L.marker([clinic.latitude, clinic.longitude], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          handleSelectClinic(clinic.id);
        });

      // Bind simple popup
      marker.bindPopup(`
        <div class="p-1 font-sans min-w-[180px]">
          <h4 class="font-bold text-slate-800 text-xs">${clinic.name}</h4>
          <p class="text-[10px] text-slate-400 mt-0.5">${clinic.area}</p>
          <div class="flex items-center gap-1 mt-1 text-amber-500 font-extrabold text-[10px]">
            <span>★</span> ${clinic.rating.toFixed(1)} <span class="text-slate-400 font-normal">(${clinic.reviewsCount})</span>
          </div>
        </div>
      `);

      markersRef.current[clinic.id] = marker;

      if (isSelected) {
        marker.openPopup();
        map.panTo([clinic.latitude, clinic.longitude]);
      }
    });

  }, [filteredClinics, selectedClinicId]);

  // Draw highlighted route line
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (!userLocation || !navigatingToClinicId) return;

    const clinic = clinics.find(c => c.id === navigatingToClinicId);
    if (!clinic) return;

    const start: L.LatLngExpression = [userLocation.lat, userLocation.lng];
    const end: L.LatLngExpression = [clinic.latitude, clinic.longitude];

    // Build some routing bends
    const mid1: L.LatLngExpression = [
      userLocation.lat + (clinic.latitude - userLocation.lat) * 0.35 + 0.0008,
      userLocation.lng + (clinic.longitude - userLocation.lng) * 0.25 - 0.0006
    ];
    const mid2: L.LatLngExpression = [
      userLocation.lat + (clinic.latitude - userLocation.lat) * 0.75 - 0.0005,
      userLocation.lng + (clinic.longitude - userLocation.lng) * 0.7 + 0.0008
    ];

    const coordinates = [start, mid1, mid2, end];

    const bgRoute = L.polyline(coordinates, {
      color: '#1E3A8A',
      weight: 9,
      opacity: 0.25,
      lineCap: 'round',
      lineJoin: 'round',
    });

    const fgRoute = L.polyline(coordinates, {
      color: '#3B82F6',
      weight: 5,
      opacity: 0.9,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round',
    });

    const group = L.featureGroup([bgRoute, fgRoute]).addTo(map);
    routeLineRef.current = group;

    // Zoom path to fit
    map.fitBounds(group.getBounds(), { padding: [50, 50] });

  }, [navigatingToClinicId, userLocation, clinics]);

  // Utility logic
  const handleLocateMe = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15, { animate: true, duration: 0.5 });
    }
  };

  const handleNearbyEmergency = () => {
    setSelectedFilters(['Emergency']);
    const emergencies = clinics.filter(c => c.hasEmergency);
    if (emergencies.length > 0 && mapInstanceRef.current) {
      // pan to first emergency vet
      mapInstanceRef.current.setView([emergencies[0].latitude, emergencies[0].longitude], 14);
      handleSelectClinic(emergencies[0].id);
    }
  };

  const handleResetMap = () => {
    setSearchQuery('');
    setSelectedFilters([]);
    setSearchRadius(25);
    handleSelectClinic(null);
    setNavigatingToClinicId(null);
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13);
    }
  };

  const handleFilterToggle = (filter: string) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(prev => prev.filter(f => f !== filter));
    } else {
      setSelectedFilters(prev => [...prev, filter]);
    }
  };

  const activeClinic = useMemo(() => {
    return clinics.find(c => c.id === selectedClinicId) || null;
  }, [clinics, selectedClinicId]);

  const getDistance = (clinic: VetClinic) => {
    if (!userLocation) return null;
    return calculateHaversineDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude);
  };

  const getTravelTime = (dist: number) => {
    // Average urban velocity is 25 km/h
    const timeMins = Math.round((dist / 25) * 60);
    return timeMins < 1 ? '1 min' : `${timeMins} mins`;
  };

  // Voice recognition simulation
  const handleVoiceSearch = () => {
    setIsVoiceListening(true);
    setTimeout(() => {
      setSearchQuery('Emergency 24 Hours');
      if (!selectedFilters.includes('Emergency')) {
        setSelectedFilters(prev => [...prev, 'Emergency']);
      }
      setIsVoiceListening(false);
    }, 2200);
  };

  return (
    <div className="relative w-full h-full bg-slate-50 overflow-hidden flex flex-col font-sans">
      <style>{`
        /* Custom CSS Inject for Leaflet Markers */
        .custom-vet-pin {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-leaflet-pin:hover {
          z-index: 1000 !important;
        }
        .custom-vet-pin:hover {
          transform: scale(1.15) translateY(-2px);
        }
        @keyframes markerPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(88, 179, 104, 0.6); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 12px rgba(88, 179, 104, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(88, 179, 104, 0); }
        }
        @keyframes emergencyPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .pulse-regular {
          animation: markerPulse 1.6s infinite ease-in-out;
        }
        .pulse-emergency {
          animation: emergencyPulse 1.6s infinite ease-in-out;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      {/* 1. Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* 2. Floating Search Overlay (Top Left) */}
      <div className="absolute top-4 left-4 z-[999] flex flex-col gap-2 w-[390px] max-w-[calc(100vw-32px)]">
        <div className="backdrop-blur-md bg-white/90 border border-slate-200/60 p-2.5 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-200 hover:border-green-300">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search clinics, specialties, areas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-slate-800 text-sm font-medium placeholder:text-slate-400"
          />
          <button 
            onClick={handleVoiceSearch}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isVoiceListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-slate-200" />
          <button 
            onClick={() => handleResetMap()}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100"
            title="Reset Map"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Floating Filter Chips (Horizontally Scrollable) */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar py-1">
          {[
            { label: 'Open Now', emoji: '🟢' },
            { label: 'Emergency', emoji: '🚨' },
            { label: 'Near Me', emoji: '📍' },
            { label: 'Top Rated', emoji: '⭐' },
            { label: 'Dogs', emoji: '🐶' },
            { label: 'Cats', emoji: '🐱' },
            { label: 'Birds', emoji: '🦜' },
            { label: 'Rabbits', emoji: '🐰' },
            { label: 'Exotics', emoji: '🦁' },
          ].map((item) => {
            const isActive = selectedFilters.includes(item.label);
            return (
              <button
                key={item.label}
                onClick={() => handleFilterToggle(item.label)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 flex-shrink-0 shadow-sm transition-all duration-150 ${
                  isActive 
                    ? 'bg-[#58B368] border-[#58B368] text-white' 
                    : 'bg-white/90 backdrop-blur-sm border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowMoreFilters(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 flex-shrink-0 shadow-sm transition-all duration-150 ${
              showMoreFilters 
                ? 'bg-slate-900 border-slate-900 text-white' 
                : 'bg-white/90 backdrop-blur-sm border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>More</span>
          </button>
        </div>

        {/* More Filters Popover Panel */}
        {showMoreFilters && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xl space-y-4 text-left">
            <div className="flex justify-between items-center">
              <span className="font-display font-black text-xs uppercase tracking-wider text-slate-400">Search Radius</span>
              <span className="text-xs font-bold text-[#58B368]">{searchRadius} km</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="50" 
              step="2" 
              value={searchRadius} 
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="w-full accent-[#58B368]" 
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={() => { setSearchRadius(25); setShowMoreFilters(false); }}
                className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-50"
              >
                Reset
              </button>
              <button 
                onClick={() => setShowMoreFilters(false)}
                className="px-4 py-1.5 rounded-xl text-[10px] font-bold bg-[#58B368] text-white hover:bg-green-600 shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Voice listening status banner */}
      {isVoiceListening && (
        <div className="absolute top-28 left-4 z-[999] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 w-[390px] max-w-[calc(100vw-32px)]">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <div className="flex-1 text-xs font-extrabold flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>Voice Assistant listening for: </span>
            <span className="italic text-slate-300 font-normal">"Emergency Near Me"</span>
          </div>
        </div>
      )}

      {/* 4. Collapsible Results Panel (Desktop Sidebar Overlay) */}
      <div 
        className="hidden lg:flex absolute top-32 left-4 z-[998] w-[390px] h-[calc(100vh-212px)] flex-col transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ transform: isPanelCollapsed ? 'translateX(-406px)' : 'translateX(0)' }}
      >
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-3xl shadow-2xl h-full flex flex-col overflow-hidden relative">
          
          {/* Scrollable list content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-extrabold text-slate-500">
                {filteredClinics.length} clinical centers found
              </span>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                Sorted by Distance
              </span>
            </div>

            {filteredClinics.length === 0 ? (
              /* Google Maps style Premium Empty State */
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 h-[80%]">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center relative">
                  <MapIcon className="w-9 h-9 text-[#58B368] opacity-80" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-50 border border-white flex items-center justify-center text-xs">🔍</div>
                </div>
                <div>
                  <h4 className="font-display font-black text-slate-800 text-sm">No Vet Clinics Found</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto leading-relaxed">
                    We couldn't find any centers matching your filter combination. Let's find some nearby!
                  </p>
                </div>
                <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-left space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Try these steps:</div>
                  <button 
                    onClick={() => setSearchRadius(prev => Math.min(50, prev + 15))}
                    className="w-full flex items-center justify-between text-xs text-slate-700 hover:text-[#58B368] font-bold py-1 border-b border-slate-100/60"
                  >
                    <span>Increase search radius to {Math.min(50, searchRadius + 15)} km</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedFilters([]); }}
                    className="w-full flex items-center justify-between text-xs text-slate-700 hover:text-[#58B368] font-bold py-1"
                  >
                    <span>Clear all active filter conditions</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              filteredClinics.map((clinic) => {
                const isSelected = clinic.id === selectedClinicId;
                const dist = getDistance(clinic);
                return (
                  <div
                    key={clinic.id}
                    onClick={() => handleSelectClinic(clinic.id)}
                    className={`bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-green-200 hover:shadow-md ${
                      isSelected 
                        ? 'border-[#58B368] ring-2 ring-[#58B368]/10' 
                        : 'border-slate-100'
                    }`}
                  >
                    {/* Clinic list image */}
                    <div className="relative h-28 bg-slate-100">
                      <img 
                        src={clinic.imageUrl} 
                        alt={clinic.name}
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        {clinic.hasEmergency && (
                          <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded shadow-sm">
                            24/7 EMERGENCY
                          </span>
                        )}
                        {clinic.hasHomeVisit && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded shadow-sm">
                            HOME VISIT
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className={`px-2 py-0.5 text-white text-[9px] font-black rounded shadow-sm ${
                          clinic.isOpenNow ? 'bg-[#58B368]' : 'bg-slate-600'
                        }`}>
                          {clinic.isOpenNow ? 'OPEN' : 'CLOSED'}
                        </span>
                      </div>
                      {dist !== null && (
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-bold rounded flex items-center gap-1">
                          <Compass className="w-3 h-3 text-blue-400" />
                          <span>{dist} km</span>
                          <span className="text-slate-300">•</span>
                          <span>{getTravelTime(dist)}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content details */}
                    <div className="p-3.5 space-y-2 text-left">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <h4 className="font-display font-black text-sm text-slate-800 leading-tight">
                            {clinic.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">
                            {clinic.veterinarianName || 'Lead Vet'} • {clinic.area}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-black text-amber-700">{clinic.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Specialists pills */}
                      <div className="flex flex-wrap gap-1">
                        {clinic.specialists.slice(0, 3).map(spec => (
                          <span key={spec} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-extrabold rounded">
                            {spec}
                          </span>
                        ))}
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-extrabold rounded border border-green-100 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {clinic.workingHours}
                        </span>
                      </div>

                      {/* Action buttons inside result card */}
                      <div className="flex gap-1.5 pt-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onBookClinic(clinic); }}
                          className="flex-1 py-1.5 bg-[#58B368] hover:bg-green-600 text-white text-[10px] font-black rounded-xl transition-all shadow-sm"
                        >
                          Book Appointment
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setNavigatingToClinicId(navigatingToClinicId === clinic.id ? null : clinic.id); 
                          }}
                          className={`px-3 py-1.5 text-[10px] font-black rounded-xl border flex items-center gap-1 transition-all ${
                            navigatingToClinicId === clinic.id
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                          }`}
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{navigatingToClinicId === clinic.id ? 'Exit Route' : 'Directions'}</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCallClinicNumber(clinic.phone); }}
                          className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel collapse controller toggle handle */}
        <button
          onClick={() => setIsPanelCollapsed(prev => !prev)}
          className="absolute -right-9 top-[46%] z-[999] w-9 h-14 bg-white border border-slate-200 border-l-0 rounded-r-xl shadow-xl flex items-center justify-center text-slate-500 hover:text-[#58B368] hover:bg-slate-50 transition-all cursor-pointer"
        >
          {isPanelCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* 5. Mobile Draggable Bottom Sheet */}
      <div 
        className="lg:hidden absolute bottom-0 left-0 right-0 z-[998] bg-white/95 backdrop-blur-md rounded-t-3xl shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col overflow-hidden"
        style={{ 
          height: bottomSheetState === 'minimized' 
            ? '64px' 
            : bottomSheetState === 'peek' 
              ? '300px' 
              : '80vh' 
        }}
      >
        {/* Draggable indicator handle */}
        <div 
          onClick={() => {
            setBottomSheetState(prev => 
              prev === 'minimized' ? 'peek' : prev === 'peek' ? 'expanded' : 'minimized'
            );
          }}
          className="w-full py-3 cursor-pointer flex flex-col items-center flex-shrink-0"
        >
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1.5">
            <span>{filteredClinics.length} Centers Nearby</span>
            <span>•</span>
            <span className="text-[#58B368]">Swipe/Tap to adjust</span>
          </div>
        </div>

        {/* Mobile sheet clinic list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          {filteredClinics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <MapIcon className="w-8 h-8 text-slate-300" />
              <p className="text-xs text-slate-500">No veterinary clinics found in range.</p>
              <button 
                onClick={() => { setSearchRadius(40); setSelectedFilters([]); }}
                className="px-4 py-2 bg-[#58B368] text-white text-xs font-black rounded-xl shadow"
              >
                Expand Search Range
              </button>
            </div>
          ) : (
            filteredClinics.map((clinic) => {
              const dist = getDistance(clinic);
              return (
                <div 
                  key={clinic.id} 
                  onClick={() => { handleSelectClinic(clinic.id); setBottomSheetState('peek'); }}
                  className="bg-white border border-slate-100 rounded-2xl p-3 flex gap-3 text-left"
                >
                  <img 
                    src={clinic.imageUrl} 
                    alt={clinic.name} 
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <h5 className="font-display font-black text-xs text-slate-800 line-clamp-1">
                      {clinic.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 leading-none">
                      {clinic.veterinarianName} • {clinic.area}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-xs text-amber-500">
                        <span>★</span>
                        <span className="font-bold text-slate-700">{clinic.rating.toFixed(1)}</span>
                      </div>
                      {dist !== null && (
                        <span className="text-[10px] text-slate-400">
                          {dist} km ({getTravelTime(dist)})
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-1.5 pt-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onBookClinic(clinic); }}
                        className="flex-grow py-1 bg-[#58B368] text-white text-[9px] font-black rounded-lg"
                      >
                        Book
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setNavigatingToClinicId(clinic.id); }}
                        className="px-2 py-1 bg-slate-100 text-slate-700 text-[9px] font-bold rounded-lg flex items-center gap-0.5"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Route</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Active Clinic Detail Floating Preview Card */}
      {activeClinic && (
        <div className="absolute bottom-6 right-4 lg:left-[420px] lg:right-auto z-[999] w-[390px] max-w-[calc(100vw-32px)] transition-all duration-300">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-4 space-y-3 relative text-left">
            <button 
              onClick={() => handleSelectClinic(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-slate-900 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Preview image */}
            <div className="relative h-36 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
              <img 
                src={activeClinic.imageUrl} 
                alt={activeClinic.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-[#58B368] text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm">
                APPROVED PARTNER
              </div>
              {activeClinic.hasEmergency && (
                <div className="absolute top-3 left-32 bg-rose-500 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Emergency Care
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-start gap-1">
                <h4 className="font-display font-black text-base text-slate-800 leading-tight">
                  {activeClinic.name}
                </h4>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 flex-shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-amber-700">{activeClinic.rating.toFixed(1)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                {activeClinic.address}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <span className={`px-2 py-0.5 text-white text-[9px] font-black rounded ${
                  activeClinic.isOpenNow ? 'bg-[#58B368]' : 'bg-slate-500'
                }`}>
                  {activeClinic.isOpenNow ? 'OPEN' : 'CLOSED'}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  Hours: {activeClinic.workingHours}
                </span>
              </div>
            </div>

            {/* Featured veterinarian card details */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-black text-[#58B368] shadow-inner">
                {activeClinic.veterinarianName?.charAt(0) || 'D'}
              </div>
              <div className="text-xs">
                <span className="block font-black text-slate-800 leading-none">
                  {activeClinic.veterinarianName || 'Veterinarian Lead'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {activeClinic.yearsOfExperience || '10+'} Years Exp. • {activeClinic.specialists.join(', ')}
                </span>
              </div>
            </div>

            {/* Action panel */}
            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => onBookClinic(activeClinic)}
                className="flex-1 py-3 bg-[#58B368] hover:bg-green-600 text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-green-200"
              >
                Book Appointment
              </button>
              <button 
                onClick={() => setNavigatingToClinicId(activeClinic.id)}
                className="px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-100"
              >
                <Navigation className="w-4 h-4" />
                <span className="text-xs font-black">Directions</span>
              </button>
              <button 
                onClick={() => setCallClinicNumber(activeClinic.phone)}
                className="w-11 h-11 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Route Preview Info Overlay (Top Right) */}
      {navigatingToClinicId && (
        <div className="absolute top-4 right-4 z-[999] bg-slate-950/95 text-white rounded-3xl p-4 shadow-2xl min-w-[260px] border border-white/10 text-left space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-[10px] uppercase font-black tracking-widest text-blue-400">Navigation Active</span>
            <button 
              onClick={() => setNavigatingToClinicId(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Travel modes selectors */}
          <div className="flex bg-white/10 rounded-xl p-1 justify-between">
            {[
              { mode: 'drive', label: 'Drive', icon: Car },
              { mode: 'walk', label: 'Walk', icon: Footprints },
              { mode: 'transit', label: 'Bus', icon: Train }
            ].map((t) => {
              const Icon = t.icon;
              const isActive = travelMode === t.mode;
              return (
                <button
                  key={t.mode}
                  onClick={() => setTravelMode(t.mode as any)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-all ${
                    isActive ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Nav metrics */}
          {userLocation && (
            <div className="space-y-1">
              {(() => {
                const target = clinics.find(c => c.id === navigatingToClinicId);
                if (!target) return null;
                const distance = getDistance(target) || 0;
                // Walk speed = 5km/h, Transit = 20km/h, Drive = 30km/h
                const speed = travelMode === 'walk' ? 5 : travelMode === 'transit' ? 20 : 30;
                const timeInMins = Math.round((distance / speed) * 60) || 1;
                return (
                  <>
                    <div className="flex justify-between items-end">
                      <span className="text-xl font-black text-blue-400">{timeInMins} mins</span>
                      <span className="text-sm font-bold text-slate-300">{distance.toFixed(1)} km</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">
                      Fastest path via main corridors • Traffic light
                    </span>
                  </>
                );
              })()}
            </div>
          )}

          <div className="pt-1">
            <button 
              onClick={() => {
                const target = clinics.find(c => c.id === navigatingToClinicId);
                if (target && mapInstanceRef.current) {
                  mapInstanceRef.current.setView([target.latitude, target.longitude], 16);
                }
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl transition-colors text-center block shadow-md"
            >
              Start Guided Run
            </button>
          </div>
        </div>
      )}

      {/* 8. Floating Action Utilities buttons */}
      <div className="absolute bottom-24 right-4 z-[998] flex flex-col gap-2.5">
        {/* Layer selection button */}
        <div className="relative">
          <button 
            onClick={() => setShowLayerMenu(prev => !prev)}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl transition-all border ${
              showLayerMenu 
                ? 'bg-slate-900 border-slate-900 text-white' 
                : 'bg-white/95 border-slate-100 text-slate-600 hover:bg-slate-50'
            }`}
            title="Map Layers"
          >
            <Layers className="w-5 h-5" />
          </button>
          {showLayerMenu && (
            <div className="absolute right-13 bottom-0 bg-white border border-slate-100 p-2.5 rounded-2xl shadow-2xl flex flex-col gap-1.5 min-w-[130px] text-left">
              {[
                { type: 'streets', name: 'Standard Map', icon: MapIcon },
                { type: 'satellite', name: 'Satellite view', icon: Compass },
                { type: 'dark', name: 'Dark Mode', icon: Layers }
              ].map((l) => (
                <button
                  key={l.type}
                  onClick={() => { setMapLayerType(l.type as any); setShowLayerMenu(false); }}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2 transition-all ${
                    mapLayerType === l.type 
                      ? 'bg-green-50 text-[#58B368]' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 text-[#58B368] ${mapLayerType === l.type ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Locating button */}
        <button 
          onClick={handleLocateMe}
          className="w-11 h-11 bg-white/95 border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shadow-xl hover:bg-slate-50 transition-all"
          title="Zoom to Current Location"
        >
          <Compass className="w-5 h-5 animate-pulse text-[#58B368]" />
        </button>

        {/* Emergency quick button */}
        <button 
          onClick={handleNearbyEmergency}
          className="w-11 h-11 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-rose-600 transition-all border border-rose-600"
          title="Emergency Hotline Clinics"
        >
          <ShieldAlert className="w-5 h-5" />
        </button>

        {/* Reset button */}
        <button 
          onClick={handleResetMap}
          className="w-11 h-11 bg-white/95 border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shadow-xl hover:bg-slate-50 transition-all"
          title="Clear all selections"
        >
          <RotateCcw className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* 9. Dialing Clinic phone verification alert dialog */}
      {callClinicNumber && (
        <div className="absolute inset-0 z-[1001] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-4 text-center">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-6 h-6 text-[#58B368]" />
            </div>
            <div>
              <h4 className="font-display font-black text-slate-800 text-base">Contact Veterinary Clinic</h4>
              <p className="text-xs text-slate-400 mt-1">
                Verify availability or request guidance by contacting direct desk.
              </p>
              <span className="block text-lg font-black text-[#58B368] mt-3">
                {callClinicNumber}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCallClinicNumber(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                Dismiss
              </button>
              <a 
                href={`tel:${callClinicNumber}`}
                className="flex-1 py-2.5 bg-[#58B368] text-white rounded-xl text-xs font-black text-center shadow-md shadow-green-100"
              >
                Call Desk
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
