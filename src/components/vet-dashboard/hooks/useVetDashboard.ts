import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart3,
  CalendarCheck,
  ShieldAlert,
  ClipboardList,
  Star,
  CalendarClock,
  UserRound,
  MessageSquare,
  Pill,
  Activity,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import type { ClinicReview, Booking } from '../../../types';
import type {
  VetDashboardLayoutProps,
  VetTab,
  VerificationState,
  VerificationInfo,
  TabDefinition,
  DashboardMetrics,
  PatientRecord,
  VetAnalyticsData,
  SeriesPoint,
} from '../types';
import { statusCopy } from '../types';

// ===== HELPER: today's ISO date string =====
function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ===== Patient Record Derivation Algorithm =====
// INPUT: list of completed bookings (may contain duplicates per patient)
// OUTPUT: deduplicated patient records, one per unique (email, petName) pair
// POSTCONDITION: result.length <= completedBookings.length
// POSTCONDITION: no two records share the same (email, pet) combination
export function derivePatientRecords(completedBookings: Booking[]): PatientRecord[] {
  const seen = new Map<string, Booking>();

  for (const booking of completedBookings) {
    const key = `${booking.petOwnerEmail}-${booking.petName}`;
    // Latest booking for each patient wins (overwrites earlier)
    seen.set(key, booking);
  }

  return Array.from(seen.values()).map((booking, index) => ({
    id: `${booking.id}-record`,
    pet: booking.petName,
    type: booking.petType,
    owner: booking.petOwnerName,
    email: booking.petOwnerEmail,
    diagnosis: booking.notes || booking.service,
    vaccination: index % 2 === 0 ? 'Rabies booster current' : 'Vaccination review due',
    allergies: index % 3 === 0 ? 'No known allergies' : 'Ask owner before medication',
    lastVisit: booking.date,
  }));
}

// ===== useFetchReviews: side effect for fetching clinic reviews =====
function useFetchReviews(clinicId: string | undefined): ClinicReview[] {
  const [clinicReviews, setClinicReviews] = useState<ClinicReview[]>([]);

  useEffect(() => {
    if (!clinicId) {
      setClinicReviews([]);
      return;
    }

    let cancelled = false;

    const fetchClinicReviews = async () => {
      try {
        const apiBase = (import.meta as any).env?.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/clinics/${clinicId}/reviews`);
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          if (!cancelled) setClinicReviews([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) setClinicReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load clinic reviews:', err);
        if (!cancelled) setClinicReviews([]);
      }
    };

    fetchClinicReviews();

    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  return clinicReviews;
}

// ===== useFetchAnalytics: side effect for fetching vet analytics =====
function useFetchAnalytics(clinicId: string | undefined): {
  analytics: VetAnalyticsData | null;
  analyticsLoading: boolean;
} {
  const [analytics, setAnalytics] = useState<VetAnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) {
      setAnalytics(null);
      setAnalyticsLoading(false);
      return;
    }

    let mounted = true;

    const loadAnalytics = async () => {
      try {
        const apiBase = (import.meta as any).env?.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/analytics/vet?clinicId=${clinicId}`, {
          credentials: 'include',
        });

        if (!res.ok) {
          if (mounted) setAnalytics(null);
          return;
        }

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          if (mounted) setAnalytics(null);
          return;
        }

        const data = await res.json();
        if (mounted) setAnalytics(data);
      } catch (err) {
        console.error('Failed to load veterinarian analytics:', err);
        if (mounted) setAnalytics(null);
      } finally {
        if (mounted) setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, [clinicId]);

  return { analytics, analyticsLoading };
}

// ===== Fallback chart data when analytics unavailable =====
const fallbackTrendBars = [34, 48, 42, 57, 64, 76, 69];

// ===== Main Hook =====
export function useVetDashboard(props: VetDashboardLayoutProps) {
  const { currentUser, clinics, bookings, emergencies, onUpdateBookingStatus, onUpdateEmergencyStatus } = props;

  // === Local state ===
  const [activeTab, setActiveTab] = useState<VetTab>('overview');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // === Step 1: Derive clinic from user's clinicId ===
  // INVARIANT: if clinic is null, dashboard shows "no profile" fallback
  const clinic = useMemo(
    () => clinics.find((c) => c.id === currentUser.clinicId),
    [clinics, currentUser.clinicId],
  );

  // === Step 2: Compute verification state ===
  const verificationStatus = (clinic?.verificationStatus || 'pending') as VerificationState;
  const verification: VerificationInfo = statusCopy[verificationStatus] || statusCopy.pending;
  const isApproved = verificationStatus === 'approved';
  // POSTCONDITION: isApproved === true iff clinic.verificationStatus === 'approved'

  // === Step 3: Filter bookings for this clinic ===
  // INVARIANT: clinicBookings ⊆ props.bookings
  const clinicBookings = useMemo(
    () => bookings.filter((b) => b.clinicId === clinic?.id),
    [bookings, clinic?.id],
  );

  // === Step 4: Derive computed collections ===
  const todaysAppointments = useMemo(
    () => clinicBookings.filter((b) => b.date === todayISO()),
    [clinicBookings],
  );

  const pendingBookings = useMemo(
    () => clinicBookings.filter((b) => b.status === 'pending'),
    [clinicBookings],
  );

  const completedBookings = useMemo(
    () => clinicBookings.filter((b) => b.status === 'completed'),
    [clinicBookings],
  );

  const activeEmergencies = useMemo(
    () => emergencies.filter((e) => e.status !== 'completed'),
    [emergencies],
  );

  const ownedEmergencies = useMemo(
    () => emergencies.filter((e) => e.acceptedByClinicId === clinic?.id),
    [emergencies, clinic?.id],
  );

  // === Step 5: Build patient records from completed bookings (deduplicated) ===
  // POSTCONDITION: patientRecords has unique entries per (email, petName) pair
  const patientRecords = useMemo(
    () => derivePatientRecords(completedBookings),
    [completedBookings],
  );

  // === Step 6: Fetch clinic reviews (side effect) ===
  const clinicReviews = useFetchReviews(clinic?.id);

  // === Step 7: Fetch analytics data (side effect) ===
  const { analytics, analyticsLoading } = useFetchAnalytics(clinic?.id);
  const analyticsSummary = analytics?.summary;

  // === Derived chart data with fallbacks ===
  const appointmentsPerWeek: SeriesPoint[] = analytics?.charts.appointmentsPerWeek
    ?? fallbackTrendBars.map((value, index) => ({ label: `W${index + 1}`, value }));

  // === Step 8: Async action handlers ===
  // PRECONDITION: no concurrent update is in progress for the same booking (loadingId !== id)
  // POSTCONDITION: loadingId is reset to null after completion
  const updateBooking = useCallback(
    async (id: string, status: 'approved' | 'completed' | 'cancelled') => {
      setLoadingId(id);
      try {
        await onUpdateBookingStatus(id, status);
      } finally {
        setLoadingId(null);
      }
    },
    [onUpdateBookingStatus],
  );

  // PRECONDITION: clinic is defined (user has a linked clinic)
  // POSTCONDITION: emergency status updated server-side, loadingId reset
  const updateEmergency = useCallback(
    async (id: string, status: 'accepted' | 'completed') => {
      if (!clinic) return;
      setLoadingId(id);
      try {
        await onUpdateEmergencyStatus(id, status, clinic.id, clinic.name);
      } finally {
        setLoadingId(null);
      }
    },
    [clinic, onUpdateEmergencyStatus],
  );

  // === Step 9: Tab definitions array with dynamic badge counts ===
  const tabDefinitions: TabDefinition[] = useMemo(
    () => [
      { id: 'overview' as VetTab, label: 'Home', icon: BarChart3 },
      { id: 'appointments' as VetTab, label: 'Appointments', icon: CalendarCheck, count: analyticsSummary?.upcomingAppointments ?? pendingBookings.length },
      { id: 'emergencies' as VetTab, label: 'Emergencies', icon: ShieldAlert, count: analyticsSummary?.emergencyCases ?? activeEmergencies.filter((e) => e.status === 'pending' || e.status === 'notified').length },
      { id: 'records' as VetTab, label: 'Patient Records', icon: ClipboardList },
      { id: 'reviews' as VetTab, label: 'Reviews', icon: Star, count: analyticsSummary?.reviews ?? clinicReviews.length },
      { id: 'schedule' as VetTab, label: 'Schedule', icon: CalendarClock },
      { id: 'profile' as VetTab, label: 'Profile', icon: UserRound },
      { id: 'messages' as VetTab, label: 'Messages', icon: MessageSquare, count: analyticsSummary?.notifications ?? Math.min(4, pendingBookings.length + ownedEmergencies.length) },
      { id: 'prescriptions' as VetTab, label: 'Prescriptions', icon: Pill },
      { id: 'analytics' as VetTab, label: 'Analytics', icon: Activity },
      { id: 'credentials' as VetTab, label: 'Credentials', icon: ShieldCheck },
      { id: 'security' as VetTab, label: 'Security', icon: Lock },
    ],
    [analyticsSummary, pendingBookings.length, activeEmergencies, clinicReviews.length, ownedEmergencies.length],
  );

  // === Step 10: Compute DashboardMetrics with fallback to local values ===
  // P7: When the analytics API is unavailable, gracefully fall back to locally computed metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const cancelledCount = clinicBookings.filter((b) => b.status === 'cancelled').length;
    const localSuccessRate = clinicBookings.length
      ? Math.round(((clinicBookings.length - cancelledCount) / clinicBookings.length) * 100)
      : 100;

    return {
      todaysAppointments: analyticsSummary?.todaysAppointments ?? todaysAppointments.length,
      upcomingAppointments: analyticsSummary?.upcomingAppointments ?? clinicBookings.filter((b) => b.status === 'approved').length,
      emergencies: analyticsSummary?.emergencyCases ?? activeEmergencies.length,
      rating: `${(analyticsSummary?.averageRating ?? clinic?.rating ?? 0).toFixed(1)}`,
      patients: analyticsSummary?.patientCount ?? patientRecords.length,
      messages: analyticsSummary?.notifications ?? Math.min(4, pendingBookings.length + ownedEmergencies.length),
      earnings: `₹${Math.round(analyticsSummary?.monthlyEarnings ?? completedBookings.length * 850).toLocaleString('en-IN')}`,
      successRate: `${Math.round(analyticsSummary?.successRate ?? localSuccessRate)}%`,
    };
  }, [
    analyticsSummary,
    todaysAppointments.length,
    clinicBookings,
    activeEmergencies.length,
    clinic?.rating,
    patientRecords.length,
    pendingBookings.length,
    ownedEmergencies.length,
    completedBookings.length,
  ]);

  // === Return all computed state, setters, and action handlers ===
  return {
    // Core derived state
    clinic,
    verificationStatus,
    verification,
    isApproved,

    // Navigation
    activeTab,
    setActiveTab,

    // Booking collections
    clinicBookings,
    todaysAppointments,
    pendingBookings,
    completedBookings,

    // Emergency collections
    activeEmergencies,
    ownedEmergencies,

    // Patient data
    patientRecords,

    // Reviews
    clinicReviews,

    // Analytics
    analytics,
    analyticsLoading,
    appointmentsPerWeek,

    // Metrics (with analytics fallback)
    metrics,

    // Tab definitions
    tabDefinitions,

    // Action handlers
    updateBooking,
    updateEmergency,
    loadingId,
  };
}
