import React, { Suspense, lazy, useMemo } from 'react';
import {
  CalendarCheck,
  ShieldAlert,
  CalendarClock,
  MessageSquare,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useVetDashboard } from './hooks/useVetDashboard';
import { DashboardNav } from './DashboardNav';
import { MetricTile } from './shared';
import type { VetDashboardLayoutProps, VetTab } from './types';

// === Lazy-loaded tab components ===
const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const AppointmentsTab = lazy(() => import('./tabs/AppointmentsTab'));
const EmergenciesTab = lazy(() => import('./tabs/EmergenciesTab'));
const PatientsTab = lazy(() => import('./tabs/PatientsTab'));
const ScheduleTab = lazy(() => import('./tabs/ScheduleTab'));
const ReviewsTab = lazy(() => import('./tabs/ReviewsTab'));
const ProfileTab = lazy(() => import('./tabs/ProfileTab'));
const MessagesTab = lazy(() => import('./tabs/MessagesTab'));
const PrescriptionsTab = lazy(() => import('./tabs/PrescriptionsTab'));
const AnalyticsTab = lazy(() => import('./tabs/AnalyticsTab'));
const CredentialsTab = lazy(() => import('./tabs/CredentialsTab'));
const SecurityTab = lazy(() => import('./tabs/SecurityTab'));

// === Time-based greeting helper ===
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// === Format today's date as "Monday, 16 June 2025" ===
function formatTodayDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// === Tab Skeleton for Suspense fallback ===
function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-40 bg-gray-100 rounded-xl" />
      <div className="h-40 bg-gray-100 rounded-xl" />
    </div>
  );
}

// === Verification Badge inline component ===
function VerificationBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle2 className="w-3 h-3" />
        Verified
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }

  // rejected or suspended
  const label = status === 'rejected' ? 'Rejected' : status === 'suspended' ? 'Suspended' : status;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <XCircle className="w-3 h-3" />
      {label}
    </span>
  );
}

// === No Clinic Fallback ===
function NoClinicFallback() {
  return (
    <div className="min-h-[78vh] bg-[#F9FAFB] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 rounded-full bg-[#F4FBF3] flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-[#58B368]" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Verification Profile Required
        </h2>
        <p className="text-gray-500 mb-6">
          Your veterinarian profile is not linked to a clinic yet. Please complete the registration process to access your dashboard.
        </p>
        <button className="px-5 py-2.5 bg-[#58B368] text-white rounded-lg font-medium hover:bg-[#2F855A] transition-colors duration-200">
          Complete Registration
        </button>
      </div>
    </div>
  );
}

export default function VetDashboardLayout(props: VetDashboardLayoutProps) {
  const dashboard = useVetDashboard(props);

  // If no clinic is linked, show fallback
  if (!dashboard.clinic) {
    return <NoClinicFallback />;
  }

  const greeting = getGreeting();
  const todayDate = formatTodayDate();

  // Resolve active tab content
  const ActiveTabContent = useMemo((): React.LazyExoticComponent<React.ComponentType<any>> => {
    const tab = dashboard.activeTab;

    // Credentials tab is always accessible
    if (tab === 'credentials') return CredentialsTab;

    // All other tabs require approval
    if (!dashboard.isApproved) return CredentialsTab;

    const tabMap: Record<VetTab, React.LazyExoticComponent<React.ComponentType<any>>> = {
      overview: OverviewTab,
      appointments: AppointmentsTab,
      emergencies: EmergenciesTab,
      records: PatientsTab,
      reviews: ReviewsTab,
      schedule: ScheduleTab,
      profile: ProfileTab,
      messages: MessagesTab,
      prescriptions: PrescriptionsTab,
      analytics: AnalyticsTab,
      credentials: CredentialsTab,
      security: SecurityTab,
    };

    return tabMap[tab] ?? OverviewTab;
  }, [dashboard.activeTab, dashboard.isApproved]);

  const shouldReduceMotion = useReducedMotion();

  // Animation variants that respect prefers-reduced-motion
  const fadeInVariants = shouldReduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } };

  const tabTransitionVariants = shouldReduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } };

  const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-[78vh] bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Welcome Header & Status Board */}
        <motion.section
          className="bg-white border border-gray-100 rounded-[20px] shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-200"
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Greeting + Clinic Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Accepting Patients
                </span>
                <span className="text-xs text-gray-400 font-medium">| {weekday}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {greeting}, Dr. {props.currentUser.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap text-sm text-gray-500 font-medium">
                <span className="text-gray-700">{dashboard.clinic.name}</span>
                <span>•</span>
                <VerificationBadge status={dashboard.verificationStatus} />
              </div>
            </div>

            {/* Right: Today's Status Panel */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4.5 flex flex-row flex-wrap items-center gap-6 sm:gap-8 text-xs text-gray-600 shadow-sm shrink-0">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today's Appointments</p>
                <p className="text-xl font-extrabold text-gray-900 mt-1">{dashboard.metrics.todaysAppointments}</p>
              </div>
              <div className="border-l border-gray-200 h-8"></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Emergencies</p>
                <p className="text-xl font-extrabold text-red-600 mt-1">{dashboard.metrics.emergencies}</p>
              </div>
              <div className="border-l border-gray-200 h-8"></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Consultation Hours</p>
                <p className="text-sm font-semibold text-gray-800 mt-1.5">{dashboard.clinic.workingHours || '9AM–6PM'}</p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <MetricTile
              icon={CalendarCheck}
              label="Appointments Today"
              value={dashboard.metrics.todaysAppointments}
              hint="Scheduled for today"
              variant="green"
            />
            <MetricTile
              icon={ShieldAlert}
              label="Emergencies Waiting"
              value={dashboard.metrics.emergencies}
              hint="Require attention"
              variant="red"
            />
            <MetricTile
              icon={CalendarClock}
              label="Follow-ups Due"
              value={dashboard.metrics.upcomingAppointments}
              hint="Upcoming follow-ups"
              variant="amber"
            />
            <MetricTile
              icon={MessageSquare}
              label="Unread Messages"
              value={dashboard.metrics.messages}
              hint="New communications"
              variant="blue"
            />
          </div>
        </motion.section>

        {/* Navigation Bar */}
        <DashboardNav
          activeTab={dashboard.activeTab}
          onTabChange={dashboard.setActiveTab}
          emergencyCount={dashboard.activeEmergencies.filter((e) => e.status === 'pending' || e.status === 'notified').length}
        />

        {/* Active Tab Content with fade/slide transition on tab switch */}
        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={dashboard.activeTab}
              initial={tabTransitionVariants.initial}
              animate={tabTransitionVariants.animate}
              exit={tabTransitionVariants.exit}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Suspense fallback={<TabSkeleton />}>
                <ActiveTabContent
                  // Common props that tabs may need
                  metrics={dashboard.metrics}
                  appointmentsPerWeek={dashboard.appointmentsPerWeek}
                  bookings={dashboard.clinicBookings}
                  todaysAppointments={dashboard.todaysAppointments}
                  pendingBookings={dashboard.pendingBookings}
                  completedBookings={dashboard.completedBookings}
                  emergencies={dashboard.activeEmergencies}
                  ownedEmergencies={dashboard.ownedEmergencies}
                  patientRecords={dashboard.patientRecords}
                  clinicReviews={dashboard.clinicReviews}
                  analytics={dashboard.analytics}
                  analyticsLoading={dashboard.analyticsLoading}
                  clinic={dashboard.clinic}
                  currentUser={props.currentUser}
                  loadingId={dashboard.loadingId}
                  onUpdateBookingStatus={dashboard.updateBooking}
                  onUpdateEmergencyStatus={dashboard.updateEmergency}
                  onTabChange={dashboard.setActiveTab}
                  verification={dashboard.verification}
                  verificationStatus={dashboard.verificationStatus}
                  isApproved={dashboard.isApproved}
                />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
