import { useState, useEffect, useCallback } from 'react';
import { 
  Search, MapPin, SlidersHorizontal, Star, 
  Sparkles, ShieldAlert, Heart, CalendarDays, ClipboardList
} from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InteractiveMap from './components/InteractiveMap';
import ClinicCard from './components/ClinicCard';
import BookingModal from './components/BookingModal';
import ReviewsModal from './components/ReviewsModal';
import EmergencyWidget from './components/EmergencyWidget';
import UserDashboard from './components/UserDashboard';
import VetDashboard from './components/VetDashboard';
import AdminDashboard from './components/AdminDashboard';
import VetRegistrationModal from './components/VetRegistrationModal';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import { VetClinic, Booking, EmergencyRequest, User, ClinicReview } from './types';
import { calculateHaversineDistance } from './data';
import { motion, AnimatePresence } from 'motion/react';

// ===== Auth Storage Keys =====
const STORAGE_KEY_USER = 'vetfinder_user';
const STORAGE_KEY_TOKEN = 'vetfinder_token';

// ===== API Base URL =====
// In development: empty string (same origin, Express serves both)
// In production: set VITE_API_URL to your Render backend URL (e.g. https://quickvet-api.onrender.com)
const API_BASE = import.meta.env.VITE_API_URL || '';


// ===== Authenticated Fetch Helper =====
function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  return res;
}

/**
 * Safely parse JSON from a Response object.
 * Returns null if the response body is not valid JSON (e.g., HTML error page).
 */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    console.warn(`Expected JSON but got "${contentType}" from ${res.url}`);
    return null;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}


export default function App() {
  // Global State Engine
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocationLabel, setUserLocationLabel] = useState<string | null>(null);
  const [userCityName, setUserCityName] = useState<string>('your area');

  // Database lists fetched from Express
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);

  // Modals Visibility triggers
  const [authModalType, setAuthModalType] = useState<'login' | 'signup' | null>(null);
  const [bookingClinic, setBookingClinic] = useState<VetClinic | null>(null);
  const [reviewsClinic, setReviewsClinic] = useState<VetClinic | null>(null);

  // Search & Filtration States
  const [searchName, setSearchName] = useState<string>('');
  const [searchArea, setSearchArea] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [filterOpenNow, setFilterOpenNow] = useState<boolean>(false);
  const [filterEmergency, setFilterEmergency] = useState<boolean>(false);
  const [filterHomeVisit, setFilterHomeVisit] = useState<boolean>(false);
  const [filterHighestRated, setFilterHighestRated] = useState<boolean>(false);
  const [filterSpecialist, setFilterSpecialist] = useState<string>('All');

  // Map control
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [navigatingToClinicId, setNavigatingToClinicId] = useState<string | null>(null);


  // ===== Session Handling: Handle 401/403 by forcing logout =====
  const handleForceLogout = useCallback(() => {
    setCurrentUser(null);
    setSessionToken(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    setActiveTab('home');
  }, []);

  const resolveLocationLabel = useCallback(async (lat: number, lng: number) => {
    const formatLabel = (city?: string, state?: string, country?: string) => {
      const parts = [city, state, country].filter(Boolean);
      return parts.join(', ');
    };

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`, {
        headers: { 'Accept-Language': 'en' },
      });

      if (response.ok) {
        const data = await response.json();
        const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.suburb || '';
        const state = data?.address?.state || data?.address?.region || '';
        const country = data?.address?.country || '';
        const label = formatLabel(city, state, country);
        if (label) {
          setUserLocationLabel(label);
          setUserCityName(city || state || country || 'your area');
          return;
        }
      }
    } catch {
      // Fall back to a broader IP-based label below.
    }

    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('Location lookup failed');

      const data = await response.json();
      const city = data?.city || '';
      const region = data?.region || data?.region_code || '';
      const country = data?.country_name || data?.country || '';
      const label = formatLabel(city, region, country);
      if (label) {
        setUserLocationLabel(label);
        setUserCityName(city || region || country || 'your area');
      } else {
        setUserLocationLabel('Location detected');
        setUserCityName('your area');
      }
    } catch {
      setUserLocationLabel('Location detected');
      setUserCityName('your area');
    }
  }, []);

  const requestUserLocation = useCallback(() => {
    setUserLocationLabel('Detecting your city...');

    if (!('geolocation' in navigator)) {
      setUserLocation(null);
      setUserLocationLabel('Location unavailable');
      setUserCityName('your area');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(nextLocation);
        await resolveLocationLabel(nextLocation.lat, nextLocation.lng);
      },
      async () => {
        try {
          const response = await fetch('https://ipapi.co/json/');
          if (!response.ok) throw new Error('Location lookup failed');

          const data = await response.json();
          if (data?.latitude != null && data?.longitude != null) {
            const fallbackLocation = { lat: data.latitude, lng: data.longitude };
            setUserLocation(fallbackLocation);
            await resolveLocationLabel(fallbackLocation.lat, fallbackLocation.lng);
          } else {
            setUserLocation(null);
            setUserLocationLabel('Location unavailable');
            setUserCityName('your area');
          }
        } catch {
          setUserLocation(null);
          setUserLocationLabel('Location unavailable');
          setUserCityName('your area');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  }, [resolveLocationLabel]);

  // On mount: Auto-detect user geolocation & restore session
  useEffect(() => {
    requestUserLocation();

    // Restore user session from persistent storage
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setSessionToken(savedToken);
      } catch (err) {
        console.error('Session parse error:', err);
        handleForceLogout();
      }
    }
  }, [handleForceLogout]);


  // ===== Data Fetching with Auth Headers =====
  const pullConfiguration = useCallback(async () => {
    try {
      // Clinics are public
      const cRes = await fetch(`${API_BASE}/api/clinics`);
      if (!cRes.ok) return;
      const cData = await safeJson(cRes);
      if (cData && Array.isArray(cData)) setClinics(cData);

      // Bookings & Emergencies require auth
      const token = getStoredToken();
      if (token) {
        const bRes = await authFetch('/api/bookings');
        if (bRes.status === 401 || bRes.status === 403) {
          handleForceLogout();
          return;
        }
        if (bRes.ok) {
          const bData = await safeJson(bRes);
          if (bData && Array.isArray(bData)) setBookings(bData);
        }

        const eRes = await authFetch('/api/emergency');
        if (eRes.status === 401 || eRes.status === 403) {
          handleForceLogout();
          return;
        }
        if (eRes.ok) {
          const eData = await safeJson(eRes);
          if (eData && Array.isArray(eData)) setEmergencies(eData);
        }
      }
    } catch (err) {
      console.warn('Backend REST fetch failure:', err);
    }
  }, [handleForceLogout]);

  useEffect(() => {
    pullConfiguration();
    const interval = setInterval(pullConfiguration, 6000);
    return () => clearInterval(interval);
  }, [pullConfiguration]);


  // ===== Authentication Handlers =====
  const handleAuthSuccess = useCallback((user: User, token: string) => {
    setCurrentUser(user);
    setSessionToken(token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);

    // Route to correct dashboard by role
    if (user.role === 'admin') {
      setActiveTab('admin_dashboard');
    } else if (user.role === 'veterinarian') {
      if (!user.clinicId) {
        setActiveTab('vet_register');
      } else {
        setActiveTab('vet_dashboard');
      }
    } else {
      setActiveTab('user_dashboard');
    }

    // Immediately refresh data with new credentials
    setTimeout(() => pullConfiguration(), 100);
  }, [pullConfiguration]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('oauth_token');
    const oauthError = params.get('oauth_error');

    if (!oauthToken && !oauthError) {
      return;
    }

    window.history.replaceState({}, document.title, window.location.pathname);

    if (oauthError) {
      setAuthModalType('login');
      return;
    }

    const finishGoogleLogin = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/user/me`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${oauthToken}`,
          },
        });

        if (!res.ok) {
          throw new Error('Google login could not be completed.');
        }

        const user = await safeJson<User>(res);
        if (!user) {
          throw new Error('Google login returned an invalid user profile.');
        }

        handleAuthSuccess(user, oauthToken);
        setAuthModalType(null);
      } catch (err) {
        console.error('Google OAuth handoff error:', err);
        handleForceLogout();
        setAuthModalType('login');
      }
    };

    void finishGoogleLogin();
  }, [handleAuthSuccess, handleForceLogout]);

  const handleLogout = () => {
    handleForceLogout();
  };

  // ===== Pet Management =====
  const handleAddPet = async (petData: any) => {
    const res = await authFetch('/api/user/pets', {
      method: 'POST',
      body: JSON.stringify(petData),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      return;
    }
    if (!res.ok) throw new Error('Failed to save pet');
    const updatedUser = await safeJson(res);
    if (updatedUser) {
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    }
  };


  // ===== Favorites Toggle =====
  const handleToggleFavorite = async (clinicId: string) => {
    if (!currentUser) {
      setAuthModalType('login');
      return;
    }
    const res = await authFetch('/api/user/favorites', {
      method: 'POST',
      body: JSON.stringify({ clinicId }),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      return;
    }
    if (!res.ok) return;
    const data = await safeJson(res);
    if (!data) return;

    const updatedUser = { ...currentUser, favoriteClinics: data.favoriteClinics };
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
  };

  // ===== Booking Submission =====
  const handleSubmitBooking = async (bookingPayload: any) => {
    const res = await authFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingPayload),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      throw new Error('Session expired');
    }
    if (!res.ok) throw new Error('Booking failed');
    await pullConfiguration();
  };

  // ===== Vet Registration =====
  const handleSubmitVetRegistration = async (registrationPayload: any) => {
    if (!currentUser || !sessionToken) {
      setAuthModalType('signup');
      throw new Error('Please sign in as a veterinarian before submitting verification.');
    }

    if (!['veterinarian', 'admin'].includes(currentUser.role)) {
      setAuthModalType('signup');
      throw new Error('Only veterinarian accounts can submit clinic verification.');
    }

    const res = await authFetch('/api/clinics', {
      method: 'POST',
      body: JSON.stringify(registrationPayload),
    });

    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      setAuthModalType('login');
      const data = await safeJson(res);
      throw new Error(data?.error || 'Your session is no longer valid. Please sign in again.');
    }

    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || 'Registration failed. Please try again.');
    }

    const createdClinic = await safeJson(res);
    await pullConfiguration();

    if (currentUser && currentUser.role === 'veterinarian' && createdClinic) {
      const updatedUser = { ...currentUser, clinicId: createdClinic.id };
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
      setActiveTab('vet_dashboard');
    }
  };

  const handleUpdateClinicVerification = async (clinicId: string, status: VetClinic['verificationStatus'] | 'suspended') => {
    const res = await authFetch(`/api/clinics/${clinicId}/verification`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      return;
    }
    if (!res.ok) console.error('Failed to update verification status');
    await pullConfiguration();
  };


  // ===== Booking Status Updates (Vet only) =====
  const handleUpdateBookingStatus = async (id: string, status: string) => {
    const res = await authFetch(`/api/bookings/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      return;
    }
    if (!res.ok) console.error('Failed to change booking status');
    await pullConfiguration();
  };

  // ===== Emergency Status Updates (Vet only) =====
  const handleUpdateEmergencyStatus = async (id: string, status: string, clinicId: string, clinicName: string) => {
    const res = await authFetch(`/api/emergency/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, clinicId, clinicName }),
    });
    if (res.status === 401 || res.status === 403) {
      handleForceLogout();
      return;
    }
    if (!res.ok) console.error('Failed to update emergency status');
    await pullConfiguration();
  };


  // ===== Clinic Filtering Logic =====
  const publicClinics = clinics.filter((clinic) => clinic.verificationStatus === 'approved');
  const areaFilterLabel = userCityName && userCityName !== 'your area' ? `All Areas (${userCityName})` : 'All Areas (Your Location)';
  const filteredClinics = publicClinics
    .filter((clinic) => {
      if (searchName && !clinic.name.toLowerCase().includes(searchName.toLowerCase())) return false;
      if (searchArea && !clinic.area.toLowerCase().includes(searchArea.toLowerCase())) return false;
      if (filterOpenNow && !clinic.isOpenNow) return false;
      if (filterEmergency && !clinic.hasEmergency) return false;
      if (filterHomeVisit && !clinic.hasHomeVisit) return false;
      if (filterHighestRated && clinic.rating < 4.6) return false;
      if (filterSpecialist !== 'All' && !clinic.specialists.includes(filterSpecialist as any)) return false;
      if (userLocation) {
        const dist = calculateHaversineDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude);
        if (dist > searchRadius) return false;
      }
      return true;
    })
    .map((clinic) => ({
      clinic,
      distance: userLocation
        ? calculateHaversineDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude)
        : Number.POSITIVE_INFINITY,
    }))
    .sort((a, b) => a.distance - b.distance)
    .map(({ clinic }) => clinic);


  // ===== RENDER =====
  return (
    <div className="relative min-h-screen bg-[#F4FBF3] font-sans text-[#2D3748] flex flex-col">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(type) => setAuthModalType(type)}
      />

      <AnimatePresence mode="wait">
        {/* VIEW 1: HOME PAGE */}
        {activeTab === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
            <Hero
              clinics={publicClinics.slice(0, 5)}
              userLocation={userLocation}
              userLocationLabel={userLocationLabel}
              onSelectClinic={(id) => { setSelectedClinicId(id); setActiveTab('find_vets'); }}
              onNavigateToFind={() => setActiveTab('find_vets')}
              onNavigateToEmergency={() => setActiveTab('emergency')}
            />
          </motion.div>
        )}


        {/* VIEW 2: MAP FIND CLINICS VIEW */}
        {activeTab === 'find_vets' && (
          <motion.div key="find_vets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-grow">
            <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
              {/* LEFT: Filter Sidebar + Clinic Cards */}
              <div className="lg:w-[440px] xl:w-[480px] flex-shrink-0 flex flex-col border-r border-slate-100 bg-white overflow-hidden">
                {/* Search + Stats Bar */}
                <div className="p-4 border-b border-slate-100 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search clinics, vets, or areas..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="w-full bg-slate-50 py-2.5 pl-10 pr-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#58B368] focus:ring-2 focus:ring-green-100 font-medium"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">{filteredClinics.length} clinics found</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <MapPin className="w-3 h-3 text-[#58B368]" />
                      <span className="font-semibold">Within {searchRadius} km</span>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-slate-100 space-y-3">
                  {/* Distance Slider */}
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-1.5">
                      <span>Distance</span>
                      <span className="text-[#58B368]">{searchRadius} km</span>
                    </div>
                    <input type="range" min="2" max="50" step="2" value={searchRadius} onChange={(e) => setSearchRadius(parseInt(e.target.value))} className="w-full accent-[#58B368] h-1.5" />
                  </div>

                  {/* Quick Filters */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Open Now', active: filterOpenNow, toggle: () => setFilterOpenNow(!filterOpenNow), emoji: '🟢' },
                      { label: '24/7 Emergency', active: filterEmergency, toggle: () => setFilterEmergency(!filterEmergency), emoji: '🚑' },
                      { label: 'Home Visit', active: filterHomeVisit, toggle: () => setFilterHomeVisit(!filterHomeVisit), emoji: '🏠' },
                      { label: '★ Top Rated', active: filterHighestRated, toggle: () => setFilterHighestRated(!filterHighestRated), emoji: '⭐' },
                    ].map((btn) => (
                      <button key={btn.label} onClick={btn.toggle}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          btn.active ? 'bg-[#58B368] border-[#58B368] text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'
                        }`}>
                        <span>{btn.emoji}</span> {btn.label}
                      </button>
                    ))}
                  </div>

                  {/* Pet Type Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Exotics'].map((spec) => (
                      <button key={spec} onClick={() => setFilterSpecialist(spec)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          filterSpecialist === spec ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}>
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clinic Cards List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {filteredClinics.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <h4 className="font-display font-black text-lg text-slate-700">No clinics found</h4>
                      <p className="text-sm text-slate-400 max-w-[240px] mt-2">Try expanding your search radius or adjusting filters to see more results.</p>
                    </div>
                  ) : (
                    filteredClinics.map((clinic) => {
                      const distance = userLocation ? calculateHaversineDistance(userLocation.lat, userLocation.lng, clinic.latitude, clinic.longitude) : null;
                      return (
                        <div
                          key={clinic.id}
                          onClick={() => setSelectedClinicId(clinic.id)}
                          className={`group bg-white border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedClinicId === clinic.id ? 'border-[#58B368] ring-2 ring-[#58B368]/10 shadow-md' : 'border-slate-150 hover:border-green-200'
                          }`}
                        >
                          {/* Card Image */}
                          <div className="relative h-28 overflow-hidden">
                            <img
                              src={clinic.imageUrl || 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=400'}
                              alt={clinic.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 left-2 flex gap-1.5">
                              {clinic.hasEmergency && (
                                <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-md shadow-sm">24/7</span>
                              )}
                              {clinic.hasHomeVisit && (
                                <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-md shadow-sm">Home Visit</span>
                              )}
                            </div>
                            {clinic.verificationStatus === 'approved' && (
                              <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur text-green-700 text-[9px] font-black rounded-md flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Verified
                              </div>
                            )}
                            {distance !== null && (
                              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur text-white text-[9px] font-bold rounded-md">
                                {distance} km
                              </div>
                            )}
                          </div>

                          {/* Card Body */}
                          <div className="p-3.5 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-display font-bold text-sm text-slate-900 leading-tight line-clamp-1">{clinic.name}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">{clinic.veterinarianName || clinic.area}, {clinic.city}</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 bg-amber-50 px-2 py-0.5 rounded-lg">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-black text-amber-700">{clinic.rating.toFixed(1)}</span>
                              </div>
                            </div>

                            {/* Specialties */}
                            <div className="flex flex-wrap gap-1">
                              {clinic.specialists.slice(0, 3).map(spec => (
                                <span key={spec} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-[9px] font-bold rounded border border-green-100">{spec}</span>
                              ))}
                              <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[9px] font-bold rounded border border-slate-100">{clinic.workingHours}</span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-1.5">
                              <button onClick={(e) => { e.stopPropagation(); setBookingClinic(clinic); }}
                                className="flex-1 py-2 bg-[#58B368] hover:bg-green-600 text-white text-[10px] font-black rounded-xl transition-colors text-center">
                                Book Appointment
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setNavigatingToClinicId(navigatingToClinicId === clinic.id ? null : clinic.id); }}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-xl transition-colors flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {navigatingToClinicId === clinic.id ? 'Stop' : 'Route'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT: Full Map */}
              <div className="flex-1 relative min-h-[400px] lg:min-h-0">
                <InteractiveMap clinics={filteredClinics} selectedClinicId={selectedClinicId} onSelectClinic={setSelectedClinicId}
                  userLocation={userLocation} searchRadius={searchRadius} navigatingToClinicId={navigatingToClinicId} />

                {/* Floating map stats */}
                <div className="absolute top-4 left-4 z-[999] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-green-100 shadow-lg flex items-center gap-4 pointer-events-none">
                  <div className="text-center">
                    <span className="block text-sm font-black text-slate-900">{filteredClinics.length}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Clinics</span>
                  </div>
                  <div className="w-px h-7 bg-slate-200" />
                  <div className="text-center">
                    <span className="block text-sm font-black text-green-600">{filteredClinics.filter(c => c.isOpenNow).length}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Open Now</span>
                  </div>
                  <div className="w-px h-7 bg-slate-200" />
                  <div className="text-center">
                    <span className="block text-sm font-black text-rose-500">{filteredClinics.filter(c => c.hasEmergency).length}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Emergency</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}


        {/* VIEW 3: EMERGENCY */}
        {activeTab === 'emergency' && (
          <motion.div key="emergency" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <EmergencyWidget currentUser={currentUser} onOpenAuth={(type) => setAuthModalType(type)} />
          </motion.div>
        )}

        {/* VIEW 4: REVIEWS FEED */}
        {activeTab === 'reviews' && (
          <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left space-y-6">
            <div className="border-b pb-3 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#58B368] bg-green-100/40 py-1 px-2.5 rounded-md">Feedback Vault</span>
              <h3 className="font-display font-black text-3xl text-gray-900 tracking-tight">Recent Verified Clinical Reviews</h3>
              <p className="text-gray-500 text-xs sm:text-sm">Real stories from local companion pet parents in India.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicClinics.map(clinic => (
                <div key={clinic.id} className="p-5 bg-white border border-gray-100 rounded-3xl space-y-3 shadow-sm hover:border-[#58B368]/40 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-gray-800 text-sm leading-none">{clinic.name}</h4>
                      <span className="text-[10px] text-gray-400 mt-1 inline-block">📍 {clinic.area}, {clinic.city}</span>
                    </div>
                    <button onClick={() => setReviewsClinic(clinic)} className="text-xs text-[#58B368] font-bold hover:underline">View All Feedback →</button>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-gray-500">
                    <span>★ <b>{clinic.rating} Rating Score</b></span>
                    <span>💬 <b>{clinic.reviewsCount} Patient Audits</b></span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}


        {/* VIEW 5: USER DASHBOARD - ROLE GUARDED (pet_owner only) */}
        {activeTab === 'user_dashboard' && (
          currentUser && currentUser.role === 'pet_owner' ? (
            <motion.div key="user_dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
              <UserDashboard
                currentUser={currentUser}
                bookings={bookings}
                emergencies={emergencies}
                clinics={clinics}
                onAddPet={handleAddPet}
                onSelectTab={setActiveTab}
              />
            </motion.div>
          ) : (
            <motion.div key="user_dashboard_guard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-grow flex items-center justify-center py-20">
              <div className="bg-white p-10 rounded-3xl border border-red-100 shadow-lg text-center max-w-md space-y-4">
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="font-display font-black text-xl text-gray-900">Access Denied</h3>
                <p className="text-sm text-gray-500">This dashboard is restricted to registered pet owners. Please log in with a pet owner account.</p>
                <button onClick={() => { setActiveTab('home'); if (!currentUser) setAuthModalType('login'); }}
                  className="px-6 py-3 bg-[#58B368] text-white font-bold rounded-xl text-sm">
                  {currentUser ? 'Return Home' : 'Login as Pet Owner'}
                </button>
              </div>
            </motion.div>
          )
        )}

        {/* VIEW 6: VET DASHBOARD - ROLE GUARDED (veterinarian only) */}
        {activeTab === 'vet_dashboard' && (
          currentUser && currentUser.role === 'veterinarian' ? (
            <motion.div key="vet_dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
              <VetDashboard
                currentUser={currentUser}
                clinics={clinics}
                bookings={bookings}
                emergencies={emergencies}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onUpdateEmergencyStatus={handleUpdateEmergencyStatus}
              />
            </motion.div>
          ) : (
            <motion.div key="vet_dashboard_guard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-grow flex items-center justify-center py-20">
              <div className="bg-white p-10 rounded-3xl border border-red-100 shadow-lg text-center max-w-md space-y-4">
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="font-display font-black text-xl text-gray-900">Access Denied</h3>
                <p className="text-sm text-gray-500">This portal is restricted to verified veterinarians. Please log in with a veterinarian account.</p>
                <button onClick={() => { setActiveTab('home'); if (!currentUser) setAuthModalType('login'); }}
                  className="px-6 py-3 bg-[#58B368] text-white font-bold rounded-xl text-sm">
                  {currentUser ? 'Return Home' : 'Login as Veterinarian'}
                </button>
              </div>
            </motion.div>
          )
        )}


        {/* VIEW 7: ADMIN DASHBOARD - ROLE GUARDED (admin only) */}
        {activeTab === 'admin_dashboard' && (
          currentUser && currentUser.role === 'admin' ? (
            <motion.div key="admin_dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
              <AdminDashboard
                currentUser={currentUser}
                clinics={clinics}
                bookings={bookings}
                emergencies={emergencies}
                onUpdateClinicVerification={handleUpdateClinicVerification}
              />
            </motion.div>
          ) : (
            <motion.div key="admin_dashboard_guard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-grow flex items-center justify-center py-20">
              <div className="bg-white p-10 rounded-3xl border border-red-100 shadow-lg text-center max-w-md space-y-4">
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
                <h3 className="font-display font-black text-xl text-gray-900">Access Denied</h3>
                <p className="text-sm text-gray-500">This command center is restricted to QuickVet administrators.</p>
                <button onClick={() => { setActiveTab('home'); if (!currentUser) setAuthModalType('login'); }}
                  className="px-6 py-3 bg-[#58B368] text-white font-bold rounded-xl text-sm">
                  {currentUser ? 'Return Home' : 'Login as Admin'}
                </button>
              </div>
            </motion.div>
          )
        )}


        {/* VIEW 8: VET REGISTRATION */}
        {activeTab === 'vet_register' && (
          <motion.div key="vet_register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
            <VetRegistrationModal onClose={() => setActiveTab('home')} onSubmitRegistration={handleSubmitVetRegistration} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER — only shown on home page */}
      {activeTab === 'home' && (
        <Footer
          onNavigate={setActiveTab}
          onOpenAuth={(type) => {
            setAuthModalType(type);
            setActiveTab('home');
          }}
        />
      )}

      {/* GLOBAL MODALS */}
      {authModalType && (
        <AuthModal type={authModalType} onClose={() => setAuthModalType(null)} onSuccess={handleAuthSuccess} onToggleType={setAuthModalType} />
      )}
      {bookingClinic && (
        <BookingModal clinic={bookingClinic} currentUser={currentUser} onClose={() => setBookingClinic(null)}
          onSubmitBooking={handleSubmitBooking} onOpenAuth={(type) => setAuthModalType(type)} />
      )}
      {reviewsClinic && (
        <ReviewsModal clinic={reviewsClinic} currentUser={currentUser} onClose={() => setReviewsClinic(null)}
          onOpenAuth={(type) => setAuthModalType(type)} />
      )}
    </div>
  );
}
