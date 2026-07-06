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
import ReviewsView from './components/ReviewsView';
import EmergencyWidget from './components/EmergencyWidget';
import UserDashboard from './components/UserDashboard';
import VetDashboardLayout from './components/vet-dashboard';
import AdminDashboard from './components/AdminDashboard';
import VetRegistrationModal from './components/VetRegistrationModal';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import VaccinationGuide from './components/VaccinationGuide';
import { VetClinic, Booking, EmergencyRequest, User, ClinicReview } from './types';
import { calculateHaversineDistance } from './data';
import { motion, AnimatePresence } from 'motion/react';

// ===== Auth Storage Keys =====
const STORAGE_KEY_USER = 'vetfinder_user';

// ===== API Base URL =====
// In development: empty string (same origin, Express serves both)
// In production: set VITE_API_URL to your Render backend URL (e.g. https://quickvet-api.onrender.com)
const API_BASE = (import.meta as any).env?.VITE_API_URL || '';


// ===== Authenticated Fetch Helper =====
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const isJsonBody = options.body && !(options.body instanceof FormData);

  const headers = {
    ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  } as any;

  const res = await fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers,
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
  const [authModalType, setAuthModalType] = useState<'login' | 'signup' | 'reset_password' | null>(null);
  const [resetParams, setResetParams] = useState<{ token: string; email: string } | null>(null);
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


  const handleForceLogout = useCallback(() => {
    setCurrentUser(null);
    setSessionToken(null);
    localStorage.removeItem(STORAGE_KEY_USER);
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

    // Check for password reset tokens in the URL
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('reset_token');
    const resetEmail = params.get('reset_email');

    if (resetToken && resetEmail) {
      setResetParams({ token: resetToken, email: resetEmail });
      setAuthModalType('reset_password');
      // Clean query parameters from URL history for security
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Verify session state using HTTP-only cookie
    const checkSession = async () => {
      try {
        const res = await authFetch('/api/user/me');
        if (res.ok) {
          const user = await safeJson(res);
          if (user) {
            setCurrentUser(user);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
            return;
          }
        }
      } catch (err) {
        console.error('Session verify error:', err);
      }
      handleForceLogout();
    };
    checkSession();
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
      if (currentUser) {
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
  }, [currentUser, handleForceLogout]);

  useEffect(() => {
    pullConfiguration();
    const interval = setInterval(pullConfiguration, 6000);
    return () => clearInterval(interval);
  }, [pullConfiguration]);


  // ===== Authentication Handlers =====
  const handleAuthSuccess = useCallback((user: User, _token?: string) => {
    setCurrentUser(user);
    setSessionToken(null);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));

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
    const oauthProvider = params.get('oauth_provider');
    const oauthError = params.get('oauth_error');

    if (!oauthProvider && !oauthError) {
      return;
    }

    window.history.replaceState({}, document.title, window.location.pathname);

    if (oauthError) {
      setAuthModalType('login');
      return;
    }

    const finishGoogleLogin = async () => {
      try {
        const res = await authFetch('/api/user/me');

        if (!res.ok) {
          throw new Error('Google login could not be completed.');
        }

        const user = await safeJson<User>(res);
        if (!user) {
          throw new Error('Google login returned an invalid user profile.');
        }

        handleAuthSuccess(user);
        setAuthModalType(null);
      } catch (err) {
        console.error('Google OAuth handoff error:', err);
        handleForceLogout();
        setAuthModalType('login');
      }
    };

    void finishGoogleLogin();
  }, [handleAuthSuccess, handleForceLogout]);

  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout endpoint call failed:', err);
    }
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
              onNavigateToVetRegister={() => setAuthModalType('signup')}
            />
          </motion.div>
        )}


        {/* VIEW 2: MAP FIND CLINICS VIEW */}
        {activeTab === 'find_vets' && (
          <motion.div key="find_vets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-grow w-full relative">
            <div className="h-[calc(100vh-80px)] w-full relative">
              <InteractiveMap 
                clinics={publicClinics}
                userLocation={userLocation}
                onBookClinic={setBookingClinic}
                preSelectedClinicId={selectedClinicId}
                onSelectClinic={setSelectedClinicId}
              />
            </div>
          </motion.div>
        )}


        {/* VIEW 3: EMERGENCY */}
        {activeTab === 'emergency' && (
          <motion.div key="emergency" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-grow w-full">
            <EmergencyWidget currentUser={currentUser} onOpenAuth={(type) => setAuthModalType(type)} />
          </motion.div>
        )}

        {/* VIEW 4: REVIEWS FEED */}
        {activeTab === 'reviews' && (
          <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-grow w-full">
            <ReviewsView
              clinics={publicClinics}
              currentUser={currentUser}
              onOpenAuth={(type) => setAuthModalType(type)}
              onSelectClinic={(clinic) => {
                setSelectedClinicId(clinic.id);
                setActiveTab('find_vets');
              }}
            />
          </motion.div>
        )}

        {/* VIEW: VACCINATION GUIDE */}
        {activeTab === 'vaccinations' && (
          <motion.div key="vaccinations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-grow">
            <VaccinationGuide currentUser={currentUser} clinics={publicClinics} />
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
              <VetDashboardLayout
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
        <AuthModal 
          type={authModalType} 
          onClose={() => { setAuthModalType(null); setResetParams(null); }} 
          onSuccess={handleAuthSuccess} 
          onToggleType={setAuthModalType}
          resetToken={resetParams?.token}
          resetEmail={resetParams?.email}
        />
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
