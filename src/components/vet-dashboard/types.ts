import type { LucideIcon } from 'lucide-react';
import type { User, VetClinic, Booking, EmergencyRequest } from '../../types';

// ===== LAYOUT & NAVIGATION =====

export interface VetDashboardLayoutProps {
  currentUser: User;
  clinics: VetClinic[];
  bookings: Booking[];
  emergencies: EmergencyRequest[];
  onUpdateBookingStatus: (id: string, status: string) => Promise<void>;
  onUpdateEmergencyStatus: (id: string, status: string, clinicId: string, clinicName: string) => Promise<void>;
}

export interface DashboardSidebarProps {
  currentUser: User;
  clinic: VetClinic;
  verification: VerificationInfo;
  isApproved: boolean;
  activeTab: VetTab;
  onTabChange: (tab: VetTab) => void;
  tabs: TabDefinition[];
}

export interface TabDefinition {
  id: VetTab;
  label: string;
  icon: LucideIcon;
  count?: number;
}

// ===== VERIFICATION =====

export interface VerificationInfo {
  label: string;
  tone: string;
  message: string;
}

export type VetTab =
  | 'overview'
  | 'appointments'
  | 'emergencies'
  | 'records'
  | 'reviews'
  | 'schedule'
  | 'profile'
  | 'messages'
  | 'prescriptions'
  | 'analytics'
  | 'credentials'
  | 'security';

export type VerificationState =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_documents'
  | 'hold'
  | 'suspended';

export const statusCopy: Record<VerificationState, VerificationInfo> = {
  pending: {
    label: 'Pending Verification',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    message: 'Your professional profile is under admin review.',
  },
  approved: {
    label: 'Approved',
    tone: 'bg-green-50 text-green-700 border-green-200',
    message: 'Your verified veterinarian workspace is active.',
  },
  rejected: {
    label: 'Rejected',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    message: 'Your verification was rejected. Review the admin note and resubmit.',
  },
  needs_documents: {
    label: 'Additional Documents Required',
    tone: 'bg-orange-50 text-orange-700 border-orange-200',
    message: 'Additional documents are needed before approval.',
  },
  hold: {
    label: 'On Hold',
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
    message: 'Your verification is paused for admin review.',
  },
  suspended: {
    label: 'Suspended',
    tone: 'bg-rose-50 text-rose-700 border-rose-200',
    message: 'Dashboard access is suspended. Contact support.',
  },
};

// ===== METRICS & ANALYTICS =====

export interface DashboardMetrics {
  todaysAppointments: number;
  upcomingAppointments: number;
  emergencies: number;
  rating: string;
  patients: number;
  messages: number;
  earnings: string;
  successRate: string;
}

export interface PriorityItem {
  id: string;
  type: 'booking' | 'emergency';
  title: string;
  description: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface VetAnalyticsData {
  summary: {
    todaysAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    emergencyCases: number;
    patientCount: number;
    averageRating: number;
    reviews: number;
    monthlyEarnings: number;
    responseTime: number;
    successRate: number;
    notifications: number;
  };
  charts: {
    appointmentsPerWeek: SeriesPoint[];
    monthlyPatients: SeriesPoint[];
    ratingsTrend: SeriesPoint[];
    appointmentStatus: SeriesPoint[];
    patientCategories: SeriesPoint[];
  };
  recentReviews: Array<{
    userName: string;
    rating: number;
    reviewText: string;
    date: string;
    petType: string;
  }>;
}

// ===== PATIENT RECORDS =====

export interface PatientRecord {
  id: string;
  pet: string;
  type: string;
  owner: string;
  email: string;
  diagnosis: string;
  vaccination: string;
  allergies: string;
  lastVisit: string;
}

// ===== TAB PROPS =====

export interface AppointmentsTabProps {
  bookings: Booking[];
  loadingId: string | null;
  onUpdateStatus: (id: string, status: 'approved' | 'completed' | 'cancelled') => void;
}

export interface EmergenciesTabProps {
  emergencies: EmergencyRequest[];
  clinicId: string;
  loadingId: string | null;
  onAccept: (id: string) => void;
  onComplete: (id: string) => void;
}

export interface AnalyticsTabProps {
  clinicBookings: Booking[];
  ownedEmergencies: EmergencyRequest[];
  analytics: VetAnalyticsData | null;
  analyticsLoading: boolean;
}

export interface OverviewTabProps {
  metrics: DashboardMetrics;
  appointmentsPerWeek: SeriesPoint[];
  priorityItems: PriorityItem[];
}

// ===== SHARED COMPONENT PROPS =====

export interface MetricTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint: string;
}

export interface StatusBadgeProps {
  status: string;
}

export interface EmptyStateProps {
  message: string;
}

export interface ChartBarProps {
  data: SeriesPoint[];
  color?: string;
  height?: number;
}

export interface ChartProgressProps {
  data: SeriesPoint[];
  color?: string;
}
