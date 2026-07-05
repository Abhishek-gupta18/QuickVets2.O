import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileSearch,
  Lock,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  ShieldOff,
  Star,
  Stethoscope,
  Users,
  XCircle,
} from 'lucide-react';
import { Booking, EmergencyRequest, User, VetClinic, VetDocument } from '../types';

interface AdminDashboardProps {
  currentUser: User;
  clinics: VetClinic[];
  bookings: Booking[];
  emergencies: EmergencyRequest[];
  onUpdateClinicVerification: (clinicId: string, status: NonNullable<VetClinic['verificationStatus']>) => Promise<void>;
}

interface SeriesPoint {
  label: string;
  value: number;
}

interface AdminAnalyticsData {
  summary: {
    totalUsers: number;
    totalVeterinarians: number;
    verifiedVets: number;
    pendingVerifications: number;
    clinics: number;
    appointments: number;
    emergencyRequests: number;
    completedTreatments: number;
    reviews: number;
    averageRating: number;
    notifications: number;
  };
  charts: {
    monthlyUserRegistrations: SeriesPoint[];
    monthlyAppointments: SeriesPoint[];
    appointmentStatusDistribution: SeriesPoint[];
    emergencyRequestsTrend: SeriesPoint[];
    topCities: SeriesPoint[];
    vaccinationStatistics: SeriesPoint[];
  };
  activityLogs: Array<{ action: string; actor: string; time: string; source: string }>;
}

type AdminTab =
  | 'overview'
  | 'verification'
  | 'verified_vets'
  | 'complaints'
  | 'emergencies'
  | 'security';

const complaints = [
  { id: 'cmp-772', category: 'Fake Credentials', vet: 'Whitefield Exotic Care', severity: 'High', age: '18 min', owner: 'Mira S.', status: 'Investigating' },
  { id: 'cmp-768', category: 'Late Arrival', vet: 'Happy Tails Veterinary Clinic & Spa', severity: 'Medium', age: '2 hr', owner: 'Rohan K.', status: 'Awaiting response' },
  { id: 'cmp-761', category: 'Payment Dispute', vet: 'Crown Vet Premium Clinic', severity: 'Low', age: '1 day', owner: 'Ananya R.', status: 'Mediation' },
];

const auditLogs = [
  { action: 'Approved veterinarian profile', admin: 'Asha Menon', time: '10:42 PM', ip: '103.21.244.18' },
  { action: 'Requested additional license document', admin: 'Kabir Shah', time: '09:58 PM', ip: '103.21.244.18' },
  { action: 'Flagged review for abusive language', admin: 'Asha Menon', time: '08:11 PM', ip: '49.36.121.77' },
  { action: 'Emergency reassigned manually', admin: 'System Admin', time: '07:46 PM', ip: '10.0.0.14' },
];

const monthlyBars = [38, 52, 46, 64, 72, 88, 76, 92];
const emergencyBars = [18, 22, 15, 27, 31, 24, 35, 29];

function formatVerificationStatus(status: VetClinic['verificationStatus']): string {
  const labels: Record<NonNullable<VetClinic['verificationStatus']>, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    needs_documents: 'Needs Documents',
    hold: 'Hold',
    suspended: 'Suspended',
  };

  return labels[status || 'pending'];
}

export default function AdminDashboard({ currentUser, clinics, bookings, emergencies, onUpdateClinicVerification }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<{ vetName: string; document: VetDocument } | null>(null);
  const [signedUrlState, setSignedUrlState] = useState<{ loading: boolean; url: string | null; error: string | null }>({
    loading: false, url: null, error: null,
  });
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [vetDocsModal, setVetDocsModal] = useState<VetClinic | null>(null);
  const [vetSearchTerm, setVetSearchTerm] = useState('');
  const [vetProfileModal, setVetProfileModal] = useState<VetClinic | null>(null);

  /** Fetch a Cloudinary signed URL for a document with a cloudinaryPublicId */
  const openDocumentWithSignedUrl = async (vetName: string, document: VetDocument) => {
    setSelectedDocument({ vetName, document });

    if (!document.cloudinaryPublicId) {
      // Mock/legacy doc — no signed URL needed
      setSignedUrlState({ loading: false, url: document.dataUrl || null, error: null });
      return;
    }

    setSignedUrlState({ loading: true, url: null, error: null });
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const encodedId = btoa(document.cloudinaryPublicId).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const res = await fetch(
        `${apiBase}/api/documents/${encodedId}/signed-url?resourceType=${document.resourceType || 'image'}`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to generate document link.');
      }
      const { signedUrl } = await res.json();
      setSignedUrlState({ loading: false, url: signedUrl, error: null });
    } catch (err: any) {
      setSignedUrlState({ loading: false, url: null, error: err.message || 'Could not load document.' });
    }
  };

  /**
   * Triggers a real file download for a Cloudinary authenticated document.
   *
   * Why not use <a download>?
   * The HTML download attribute is ignored for cross-origin URLs. The server's
   * /download route generates a signed attachment URL and redirects the browser
   * to it — Cloudinary responds with Content-Disposition: attachment, which
   * causes the browser to save the file instead of opening it.
   */
  const triggerDownload = async (document: VetDocument) => {
    if (!document.cloudinaryPublicId) {
      // Legacy dataUrl — use the old link approach
      if (document.dataUrl) {
        const a = window.document.createElement('a');
        a.href = document.dataUrl;
        a.download = document.fileName;
        a.click();
      }
      return;
    }

    setDownloadingDoc(true);
    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || '';
      const encodedId = btoa(document.cloudinaryPublicId).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

      // Fetch through our proxy — server redirects to Cloudinary attachment URL
      // We follow the redirect and get the file bytes
      const res = await fetch(
        `${apiBase}/api/documents/${encodedId}/download?resourceType=${document.resourceType || 'image'}`,
        { credentials: 'include' }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Download failed.');
      }

      // Create a blob URL and click it — works for any origin
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = objectUrl;
      a.download = document.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch (err: any) {
      alert(`Download failed: ${err.message || 'Unknown error'}`);
    } finally {
      setDownloadingDoc(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      try {
        const apiBase = (import.meta as any).env?.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/analytics/admin`, {
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
        console.error('Failed to load admin analytics:', err);
        if (mounted) setAnalytics(null);
      } finally {
        if (mounted) setAnalyticsLoading(false);
      }
    };

    loadAnalytics();
    return () => {
      mounted = false;
    };
  }, []);

  const applications = useMemo(() => {
    const uploadedApplications = clinics
      .filter((clinic) => clinic.verificationDocuments && clinic.verificationDocuments.length > 0)
      .map((clinic, index) => ({
        id: `clinic-ver-${clinic.id}`,
        clinicId: clinic.id,
        doctor: clinic.veterinarianName || `Veterinarian for ${clinic.name}`,
        license: clinic.licenseNumber || 'License pending entry',
        clinic: clinic.name,
        city: clinic.city,
        submitted: clinic.verificationDocuments?.[0]?.uploadedAt?.split('T')[0] || '2026-06-28',
        status: formatVerificationStatus(clinic.verificationStatus || 'pending'),
        progress: Math.min(96, 44 + (clinic.verificationDocuments?.length || 0) * 14),
        assignedTo: 'Asha Menon',
        specialty: clinic.specialists.join(', '),
        risk: index % 3 === 0 ? 'Low' : 'Medium',
        documents: clinic.verificationDocuments || [],
      }));

    return uploadedApplications;
  }, [clinics]);

  const fallbackStats = useMemo(() => {
    const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length;
    const activeEmergencies = emergencies.filter((emergency) => emergency.status !== 'completed').length;
    const averageRating = clinics.length
      ? clinics.reduce((sum, clinic) => sum + clinic.rating, 0) / clinics.length
      : 0;

    return {
      totalUsers: Math.max(1284, bookings.length * 14 + clinics.length * 11),
      totalVeterinarians: clinics.length,
      verifiedVets: clinics.filter((clinic) => clinic.verificationStatus === 'approved').length,
      pendingVerifications: applications.filter((app) => app.status === 'Pending' || app.status === 'Needs Documents' || app.status === 'Hold').length,
      clinics: clinics.length,
      emergencyRequests: Math.max(activeEmergencies, emergencies.length),
      appointments: bookings.length,
      completedTreatments: bookings.filter((booking) => booking.status === 'completed').length,
      reviews: clinics.reduce((sum, clinic) => sum + (clinic.reviewsCount || 0), 0),
      averageRating,
      notifications: pendingBookings + activeEmergencies,
      suspendedAccounts: 0,
      activeVets: clinics.filter((clinic) => clinic.isOpenNow).length,
      pendingBookings,
    };
  }, [applications, bookings, clinics, emergencies]);

  const stats = analytics?.summary ?? fallbackStats;
  const monthlyRegistrations = analytics?.charts.monthlyUserRegistrations ?? [];
  const monthlyAppointments = analytics?.charts.monthlyAppointments ?? [];
  const appointmentStatuses = analytics?.charts.appointmentStatusDistribution ?? [];
  const emergencyTrend = analytics?.charts.emergencyRequestsTrend ?? [];
  const topCities = analytics?.charts.topCities ?? [];
  const vaccinationStats = analytics?.charts.vaccinationStatistics ?? [];
  const activityFeed = analytics?.activityLogs ?? auditLogs.map((log) => ({
    action: log.action,
    actor: log.admin,
    time: log.time,
    source: log.ip,
  }));

  const filteredApplications = applications.filter((app) => {
    const haystack = `${app.doctor} ${app.license} ${app.clinic} ${app.status} ${app.specialty}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });


  const tabs = [
    { id: 'overview', label: 'Command Home', icon: BarChart3 },
    { id: 'verification', label: 'Vet Verification', icon: ClipboardCheck, count: stats.pendingVerifications },
    { id: 'verified_vets', label: 'Verified Vets', icon: BadgeCheck, count: clinics.filter(c => c.verificationStatus === 'approved').length },
    { id: 'complaints', label: 'Reviews & Complaints', icon: MessageSquareWarning, count: complaints.length },
    { id: 'emergencies', label: 'Emergency Monitor', icon: AlertTriangle },
    { id: 'security', label: 'Security Logs', icon: Lock },
  ] as const;

  const renderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Pending: 'bg-amber-50 text-amber-700 border-amber-200',
      Hold: 'bg-slate-100 text-slate-700 border-slate-200',
      'Needs Documents': 'bg-rose-50 text-rose-700 border-rose-200',
      Approved: 'bg-green-50 text-green-700 border-green-200',
      Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
      Suspended: 'bg-slate-100 text-slate-700 border-slate-200',
      approved: 'bg-green-50 text-green-700 border-green-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
      upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
      rescheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      emergency: 'bg-rose-50 text-rose-700 border-rose-200',
      accepted: 'bg-blue-50 text-blue-700 border-blue-200',
      notified: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wide ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  const handleVerificationAction = async (clinicId: string | undefined, status: NonNullable<VetClinic['verificationStatus']>) => {
    if (!clinicId) return;
    await onUpdateClinicVerification(clinicId, status);
  };

  return (
    <div className="min-h-[78vh] bg-[#F4FBF3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-3 bg-white rounded-3xl border border-green-100/70 shadow-sm p-5 space-y-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-black text-gray-900 leading-tight">Admin Control</h2>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.name}</p>
              </div>
            </div>

            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                      active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-green-300' : 'text-slate-400'}`} />
                    <span className="flex-1 text-left">{tab.label}</span>
                    {'count' in tab && tab.count ? (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] ${active ? 'bg-white/15 text-white' : 'bg-green-50 text-green-700'}`}>{tab.count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <Activity className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Trust Engine</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">Veterinarian services remain inactive until verification is approved.</p>
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-6">
            <section className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 overflow-hidden relative">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(88,179,104,0.35),transparent_45%)] pointer-events-none" />
              <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-5">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-green-300">
                    <ShieldCheck className="w-3.5 h-3.5" /> QuickVets Trust & Quality Hub
                  </span>
                  <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight">Admin Dashboard</h1>
                  <p className="text-sm text-slate-300 max-w-2xl">Verify genuine veterinarians, monitor platform quality, resolve disputes, and keep emergency operations accountable.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 min-w-[220px]">
                  <div className="bg-white/10 border border-white/10 rounded-2xl p-3">
                    <span className="block text-2xl font-black">{stats.pendingVerifications}</span>
                    <span className="text-[10px] text-slate-300 font-bold uppercase">Pending checks</span>
                  </div>
                  <div className="bg-white/10 border border-white/10 rounded-2xl p-3">
                    <span className="block text-2xl font-black">{stats.averageRating.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-300 font-bold uppercase">Avg rating</span>
                  </div>
                </div>
              </div>
            </section>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Users', value: stats.totalUsers, icon: Users, tone: 'text-blue-700 bg-blue-50' },
                    { label: 'Total Veterinarians', value: stats.totalVeterinarians, icon: Stethoscope, tone: 'text-green-700 bg-green-50' },
                    { label: 'Verified Vets', value: stats.verifiedVets, icon: ClipboardCheck, tone: 'text-emerald-700 bg-emerald-50' },
                    { label: 'Pending Verifications', value: stats.pendingVerifications, icon: ShieldOff, tone: 'text-amber-700 bg-amber-50' },
                    { label: 'Clinics', value: stats.clinics, icon: ShieldCheck, tone: 'text-slate-700 bg-slate-100' },
                    { label: 'Appointments', value: stats.appointments, icon: CalendarDays, tone: 'text-indigo-700 bg-indigo-50' },
                    { label: 'Emergency Requests', value: stats.emergencyRequests, icon: AlertTriangle, tone: 'text-rose-700 bg-rose-50' },
                    { label: 'Completed Treatments', value: stats.completedTreatments, icon: CheckCircle2, tone: 'text-lime-700 bg-lime-50' },
                    { label: 'Reviews', value: stats.reviews, icon: MessageSquareWarning, tone: 'text-cyan-700 bg-cyan-50' },
                    { label: 'Average Rating', value: analyticsLoading ? 'Loading…' : stats.averageRating.toFixed(2), icon: Star, tone: 'text-amber-700 bg-amber-50' },
                    { label: 'Notifications', value: stats.notifications, icon: Bell, tone: 'text-fuchsia-700 bg-fuchsia-50' },
                    { label: 'Live Queue', value: analyticsLoading ? 'Loading…' : Math.max(0, stats.pendingVerifications + stats.emergencyRequests), icon: Activity, tone: 'text-slate-700 bg-slate-100' },
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.tone}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="block font-display font-black text-2xl text-slate-900">{card.value}</span>
                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wide">{card.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display font-black text-slate-900">Monthly Registrations</h3>
                      <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-1 rounded-lg">Live from PostgreSQL</span>
                    </div>
                    <div className="h-44 flex items-end gap-3">
                      {(monthlyRegistrations.length ? monthlyRegistrations : monthlyBars.map((height, index) => ({ label: `M${index + 1}`, value: height }))).map((point, index) => (
                        <div key={`${point.label}-${index}`} className="flex-1 rounded-t-xl bg-green-100 relative overflow-hidden" style={{ height: `${Math.max(18, Math.min(100, point.value))}%` }}>
                          <div className="absolute inset-x-0 bottom-0 bg-green-500 rounded-t-xl" style={{ height: `${Math.max(28, Math.min(100, point.value) - 18)}%` }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display font-black text-slate-900">Emergency Request Trend</h3>
                      <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-1 rounded-lg">SQL aggregate</span>
                    </div>
                    <div className="h-44 flex items-end gap-3">
                      {(emergencyTrend.length ? emergencyTrend : emergencyBars.map((height, index) => ({ label: `M${index + 1}`, value: height }))).map((point, index) => (
                        <div key={`${point.label}-${index}`} className="flex-1 rounded-t-xl bg-rose-100 relative overflow-hidden" style={{ height: `${Math.max(18, Math.min(100, point.value * 2))}%` }}>
                          <div className="absolute inset-x-0 bottom-0 bg-rose-500 rounded-t-xl" style={{ height: '72%' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                  <h3 className="font-display font-black text-slate-900 mb-4">Verification Queue Snapshot</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {[
                      ['Pending Applications', stats.pendingVerifications],
                      ['Approved Veterinarians', stats.verifiedVets],
                      ['Total Clinics', stats.clinics],
                      ['Review Volume', stats.reviews],
                      ['Live Notifications', stats.notifications],
                    ].map(([item, value]) => (
                      <div key={item as string} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <span className="block text-xl font-black text-slate-900">{value as number}</span>
                        <span className="text-[10px] font-black uppercase text-slate-500">{item as string}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display font-black text-slate-900">Top Cities</h3>
                      <span className="text-[10px] font-black text-slate-500 uppercase">Clinics by city</span>
                    </div>
                    <div className="space-y-3">
                      {(topCities.length ? topCities : [{ label: 'Bengaluru', value: clinics.length }]).map((point) => (
                        <div key={point.label} className="flex items-center gap-3">
                          <span className="w-24 text-xs font-black text-slate-500 truncate">{point.label}</span>
                          <div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.min(100, point.value * 12)}%` }} />
                          </div>
                          <span className="w-10 text-xs font-black text-slate-700 text-right">{point.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display font-black text-slate-900">Vaccination Signal</h3>
                      <span className="text-[10px] font-black text-slate-500 uppercase">Pet medical histories</span>
                    </div>
                    <div className="space-y-3">
                      {(vaccinationStats.length ? vaccinationStats : [{ label: 'Tracked', value: 0 }]).map((point) => (
                        <div key={point.label} className="flex items-center gap-3">
                          <span className="w-24 text-xs font-black text-slate-500 truncate">{point.label}</span>
                          <div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, point.value * 12)}%` }} />
                          </div>
                          <span className="w-10 text-xs font-black text-slate-700 text-right">{point.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-black text-2xl text-slate-900">Veterinarian Verification & Approval</h3>
                    <p className="text-xs text-slate-500">Review identity, license, clinic records, experience, specializations, and uploaded documents.</p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search name, license, status..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-400"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredApplications.map((app) => (
                    <div key={app.id} className="border border-slate-100 rounded-3xl p-5 bg-white shadow-sm">
                      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-display font-black text-lg text-slate-900">{app.doctor}</h4>
                            {renderStatusBadge(app.status)}
                            <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase ${app.risk === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' : app.risk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                              {app.risk} risk
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <Info label="License" value={app.license} />
                            <Info label="Clinic" value={app.clinic} />
                            <Info label="Specialization" value={app.specialty} />
                            <Info label="Assigned Admin" value={app.assignedTo} />
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-1">
                              <span>Verification Progress</span>
                              <span>{app.progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${app.progress}%` }} />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {app.documents.map((doc) => (
                              <button
                                key={doc.id}
                                onClick={() => openDocumentWithSignedUrl(app.doctor, doc)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-green-300 hover:text-green-700"
                              >
                                <FileSearch className="w-3 h-3" /> {doc.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-1 gap-2 xl:w-44">
                          <button
                            disabled={!('clinicId' in app)}
                            onClick={() => handleVerificationAction('clinicId' in app ? app.clinicId : undefined, 'approved')}
                            className="px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed"
                          >
                            <CheckCircle2 className="w-4 h-4" />Approve
                          </button>
                          <button
                            disabled={!('clinicId' in app)}
                            onClick={() => handleVerificationAction('clinicId' in app ? app.clinicId : undefined, 'hold')}
                            className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed"
                          >
                            <Clock className="w-4 h-4" />Hold
                          </button>
                          <button
                            disabled={!('clinicId' in app)}
                            onClick={() => handleVerificationAction('clinicId' in app ? app.clinicId : undefined, 'needs_documents')}
                            className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed"
                          >
                            <Bell className="w-4 h-4" />Request Docs
                          </button>
                          <button
                            disabled={!('clinicId' in app)}
                            onClick={() => handleVerificationAction('clinicId' in app ? app.clinicId : undefined, 'rejected')}
                            className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-4 h-4" />Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'verified_vets' && (() => {
              const approvedVets = clinics.filter(c => c.verificationStatus === 'approved');
              const suspendedVets = clinics.filter(c => c.verificationStatus === 'suspended');
              const docsReviewedToday = approvedVets.reduce((sum, v) => sum + (v.verificationDocuments?.length || 0), 0);

              const filteredVets = approvedVets.filter(vet => {
                const hay = `${vet.veterinarianName || ''} ${vet.name} ${vet.area} ${vet.licenseNumber || ''} ${vet.specialists.join(' ')}`.toLowerCase();
                return hay.includes(vetSearchTerm.toLowerCase());
              });

              return (
                <div className="space-y-6">
                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                          <BadgeCheck className="w-5.5 h-5.5 text-green-600" />
                        </div>
                      </div>
                      <span className="block font-display font-black text-3xl text-slate-900">{approvedVets.length}</span>
                      <span className="text-[11px] uppercase font-black text-slate-400 tracking-wide">Verified Vets</span>
                    </div>
                    <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center">
                          <ShieldOff className="w-5.5 h-5.5 text-rose-500" />
                        </div>
                      </div>
                      <span className="block font-display font-black text-3xl text-slate-900">{suspendedVets.length}</span>
                      <span className="text-[11px] uppercase font-black text-slate-400 tracking-wide">Suspended Vets</span>
                    </div>
                    <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                          <FileSearch className="w-5.5 h-5.5 text-blue-600" />
                        </div>
                      </div>
                      <span className="block font-display font-black text-3xl text-slate-900">{docsReviewedToday}</span>
                      <span className="text-[11px] uppercase font-black text-slate-400 tracking-wide">Documents Reviewed</span>
                    </div>
                  </div>

                  {/* Main Section */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <BadgeCheck className="w-6 h-6 text-green-600" />
                          <h3 className="font-display font-black text-2xl text-slate-900">Verified Veterinarians</h3>
                        </div>
                        <p className="text-xs text-slate-500">All veterinarians who have passed identity, license, and credential verification.</p>
                      </div>
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          value={vetSearchTerm}
                          onChange={(e) => setVetSearchTerm(e.target.value)}
                          placeholder="Search by name, clinic, area..."
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-400"
                        />
                      </div>
                    </div>

                    {filteredVets.length === 0 ? (
                      <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                          <BadgeCheck className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-lg">No verified vets found</h4>
                          <p className="text-sm text-slate-500 max-w-sm mt-1">
                            {vetSearchTerm ? 'Try adjusting your search term.' : 'Approve veterinarians from the Verification tab to see them here.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {filteredVets.map((vet) => {
                          const totalDocs = vet.verificationDocuments?.length || 0;
                          const verifiedDocs = totalDocs; // All docs are verified since vet is approved
                          return (
                            <div key={vet.id} className="group relative border border-slate-100 rounded-3xl p-5 bg-white shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-200">
                              {/* Top: Avatar + Info */}
                              <div className="flex gap-4">
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-green-200 shadow-sm">
                                    <img
                                      src={vet.imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(vet.veterinarianName || vet.name)}`}
                                      alt={vet.veterinarianName || vet.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  {/* Verified badge on avatar */}
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  </div>
                                </div>

                                {/* Name + Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h4 className="font-display font-black text-base text-slate-900 leading-tight truncate">
                                        {vet.veterinarianName || `Dr. ${vet.name.split(' ')[0]}`}
                                      </h4>
                                      <p className="text-xs text-slate-500 truncate mt-0.5">{vet.name}</p>
                                    </div>
                                    {/* Three-dot menu */}
                                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/>
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Specialties */}
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {vet.specialists.slice(0, 3).map(spec => (
                                      <span key={spec} className="px-2 py-0.5 bg-green-50 border border-green-100 text-green-700 text-[10px] font-bold rounded-md">
                                        {spec}
                                      </span>
                                    ))}
                                    {vet.specialists.length > 3 && (
                                      <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold rounded-md">
                                        +{vet.specialists.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Info Grid */}
                              <div className="grid grid-cols-2 gap-2.5 mt-4">
                                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wide">Location</span>
                                  <span className="block text-xs font-bold text-slate-700 truncate">{vet.area}, {vet.city}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wide">License No.</span>
                                  <span className="block text-xs font-bold text-slate-700 truncate">{vet.licenseNumber || 'VCI-XXXXX'}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wide">Rating</span>
                                  <span className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {vet.rating.toFixed(1)} ({vet.reviewsCount})
                                  </span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wide">Experience</span>
                                  <span className="block text-xs font-bold text-slate-700">{vet.yearsOfExperience || '5+'} years</span>
                                </div>
                              </div>

                              {/* Badges Row */}
                              <div className="flex flex-wrap items-center gap-2 mt-4">
                                {/* Verified Status Badge */}
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-[10px] font-black">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                </span>
                                {/* Documents Verified Badge */}
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-[10px] font-black">
                                  <FileSearch className="w-3.5 h-3.5" /> Documents Verified ({verifiedDocs}/{totalDocs || 3})
                                </span>
                              </div>

                              {/* Verification Metadata */}
                              <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400 font-semibold">
                                <span>Verified On: {vet.verificationDocuments?.[0]?.uploadedAt?.split('T')[0] || '2026-06-28'}</span>
                                <span>·</span>
                                <span>Verified By: Asha Menon</span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                                <button
                                  onClick={() => setVetProfileModal(vet)}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-black hover:bg-slate-800 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Profile
                                </button>
                                <button
                                  onClick={() => setVetDocsModal(vet)}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-black hover:bg-blue-100 transition-colors"
                                >
                                  <FileSearch className="w-3.5 h-3.5" /> View Documents
                                </button>
                                <button
                                  onClick={() => handleVerificationAction(vet.id, 'suspended')}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-black hover:bg-rose-100 transition-colors"
                                >
                                  <ShieldOff className="w-3.5 h-3.5" /> Suspend Vet
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Documents Modal */}
                  {vetDocsModal && (
                    <div className="fixed inset-0 z-[2500] bg-slate-950/75 backdrop-blur-sm p-4 flex items-center justify-center">
                      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-green-200">
                                <img
                                  src={vetDocsModal.imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(vetDocsModal.veterinarianName || vetDocsModal.name)}`}
                                  alt={vetDocsModal.veterinarianName || vetDocsModal.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h3 className="font-display font-black text-xl text-slate-900">Verification Documents</h3>
                                <p className="text-xs text-slate-500">{vetDocsModal.veterinarianName || vetDocsModal.name} · {vetDocsModal.name}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setVetDocsModal(null)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Documents List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {(vetDocsModal.verificationDocuments && vetDocsModal.verificationDocuments.length > 0) ? (
                            vetDocsModal.verificationDocuments.map((doc, idx) => (
                              <div key={doc.id} className="border border-slate-100 rounded-2xl p-4 hover:border-green-200 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                      {doc.fileType.startsWith('image/') ? (
                                        <Eye className="w-5 h-5 text-slate-500" />
                                      ) : (
                                        <FileSearch className="w-5 h-5 text-slate-500" />
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-sm text-slate-900">{doc.label}</h4>
                                      <p className="text-[11px] text-slate-400">{doc.fileName} · {formatBytes(doc.fileSize)}</p>
                                    </div>
                                  </div>
                                  {/* Status Badge */}
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[10px] font-black flex-shrink-0">
                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                  </span>
                                </div>

                                {/* Upload Date */}
                                <div className="mt-3 text-[10px] text-slate-400 font-semibold">
                                  Uploaded: {doc.uploadedAt?.split('T')[0] || 'N/A'}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => { setVetDocsModal(null); openDocumentWithSignedUrl(vetDocsModal.veterinarianName || vetDocsModal.name, doc); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800 transition-colors"
                                  >
                                    <Eye className="w-3 h-3" /> View
                                  </button>
                                  <button
                                    onClick={() => triggerDownload(doc)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-100 transition-colors"
                                  >
                                    <Download className="w-3 h-3" /> Download
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-12 text-center">
                              <FileSearch className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                              <p className="text-sm text-slate-500 font-semibold">No documents uploaded yet.</p>
                            </div>
                          )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
                          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                            <div className="space-y-0.5">
                              <span className="block font-semibold">Verified By: <span className="text-slate-700 font-black">Asha Menon</span></span>
                              <span className="block font-semibold">Verified On: <span className="text-slate-700 font-black">{vetDocsModal.verificationDocuments?.[0]?.uploadedAt?.split('T')[0] || '2026-06-28'}</span></span>
                            </div>
                            <div className="text-[10px] text-slate-400 max-w-xs text-right">
                              All documents have been reviewed and confirmed authentic by the QuickVet admin team.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View Profile Modal */}
                  {vetProfileModal && (() => {
                    const patientsTreated = bookings.filter(b => b.clinicId === vetProfileModal.id && b.status === 'completed').length;
                    const totalAppointments = bookings.filter(b => b.clinicId === vetProfileModal.id).length;
                    const pendingAppointments = bookings.filter(b => b.clinicId === vetProfileModal.id && b.status === 'pending').length;
                    const emergenciesHandled = emergencies.filter(e => e.acceptedByClinicId === vetProfileModal.id).length;
                    const joinDate = vetProfileModal.verificationDocuments?.[0]?.uploadedAt?.split('T')[0] || '2026-06-01';

                    return (
                      <div
                        className="fixed inset-0 z-[2600] bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center"
                        onClick={() => setVetProfileModal(null)}
                      >
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden"
                          style={{ animation: 'scaleIn 0.2s ease-out' }}
                        >
                          {/* Header Bar */}
                          <div className="bg-gradient-to-r from-[#58B368] to-[#3d9b50] px-6 py-5 text-white relative overflow-hidden">
                            <div className="absolute top-[-40px] right-[-40px] w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg flex-shrink-0">
                                  <img
                                    src={vetProfileModal.imageUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(vetProfileModal.veterinarianName || vetProfileModal.name)}`}
                                    alt={vetProfileModal.veterinarianName || vetProfileModal.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-display font-black text-xl leading-tight truncate">
                                    {vetProfileModal.veterinarianName || `Dr. ${vetProfileModal.name.split(' ')[0]}`}
                                  </h3>
                                  <p className="text-white/70 text-xs truncate">{vetProfileModal.name} · {vetProfileModal.area}, {vetProfileModal.city}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> Verified
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-bold">
                                  <Star className="w-3 h-3" /> {vetProfileModal.rating.toFixed(1)}
                                </span>
                                <button
                                  onClick={() => setVetProfileModal(null)}
                                  className="ml-2 p-1.5 bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
                                >
                                  <XCircle className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Body — horizontal layout */}
                          <div className="p-6 flex flex-col md:flex-row gap-6">
                            {/* Left: Metrics */}
                            <div className="grid grid-cols-2 gap-3 md:w-[280px] flex-shrink-0">
                              <div className="bg-green-50 border border-green-100 rounded-2xl p-3.5 text-center">
                                <span className="block font-display font-black text-2xl text-green-700">{patientsTreated}</span>
                                <span className="text-[9px] font-bold text-green-600 uppercase">Patients Treated</span>
                              </div>
                              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 text-center">
                                <span className="block font-display font-black text-2xl text-blue-700">{totalAppointments}</span>
                                <span className="text-[9px] font-bold text-blue-600 uppercase">Appointments</span>
                              </div>
                              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 text-center">
                                <span className="block font-display font-black text-2xl text-amber-700">{pendingAppointments}</span>
                                <span className="text-[9px] font-bold text-amber-600 uppercase">Pending Now</span>
                              </div>
                              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3.5 text-center">
                                <span className="block font-display font-black text-2xl text-rose-700">{emergenciesHandled}</span>
                                <span className="text-[9px] font-bold text-rose-600 uppercase">Emergencies</span>
                              </div>

                              {/* Services below metrics */}
                              <div className="col-span-2 mt-1">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide">Services</span>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {vetProfileModal.services.slice(0, 5).map(service => (
                                    <span key={service} className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 text-[9px] font-bold rounded-md">
                                      {service}
                                    </span>
                                  ))}
                                  {vetProfileModal.services.length > 5 && (
                                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-400 text-[9px] font-bold rounded-md">
                                      +{vetProfileModal.services.length - 5}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Details grid */}
                            <div className="flex-1 min-w-0">
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                {[
                                  ['Specialties', vetProfileModal.specialists.join(', ')],
                                  ['License', vetProfileModal.licenseNumber || 'VCI-XXXXX'],
                                  ['Experience', `${vetProfileModal.yearsOfExperience || '5+'} years`],
                                  ['Working Hours', vetProfileModal.workingHours],
                                  ['Phone', vetProfileModal.phone],
                                  ['Reviews', `${vetProfileModal.reviewsCount} reviews`],
                                  ['Joined Platform', joinDate],
                                  ['Documents', `${vetProfileModal.verificationDocuments?.length || 0} verified`],
                                ].map(([label, value]) => (
                                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-[11px] text-slate-400 font-semibold">{label}</span>
                                    <span className="text-[11px] font-bold text-slate-800 text-right truncate max-w-[140px]">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}


            {activeTab === 'complaints' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-display font-black text-2xl text-slate-900">Review & Complaint Monitoring</h3>
                  {complaints.map((complaint) => (
                    <div key={complaint.id} className="rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-black text-slate-900">{complaint.category}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${complaint.severity === 'High' ? 'bg-rose-50 text-rose-700' : complaint.severity === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{complaint.severity}</span>
                        </div>
                        <p className="text-xs text-slate-500">{complaint.vet} reported by {complaint.owner} · {complaint.age}</p>
                      </div>
                      <button className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center gap-1.5"><Eye className="w-4 h-4" />Investigate</button>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-display font-black text-slate-900">Authenticity Watch</h3>
                  {['Fake rating pattern', 'Abusive review language', 'Sudden negative spike', 'Repeat payment dispute'].map((item, index) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 p-3">
                      <span className="text-xs font-bold text-slate-700">{item}</span>
                      <span className="text-xs font-black text-slate-900">{[4, 9, 2, 6][index]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {activeTab === 'emergencies' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-5">
                <div className="space-y-1">
                  <h3 className="font-display font-black text-2xl text-slate-900">Emergency Request Monitoring</h3>
                  <p className="text-xs text-slate-500">Emergency monitor data has been removed from this view.</p>
                </div>
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                  No emergency monitor data is currently displayed.
                </div>
              </div>
            )}



            {activeTab === 'security' && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-display font-black text-2xl text-slate-900">Activity Logs</h3>
                  {activityFeed.map((log) => (
                    <div key={`${log.action}-${log.time}`} className="rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="block font-black text-slate-900">{log.action}</span>
                        <span className="text-xs text-slate-500">{log.actor} · {log.source}</span>
                      </div>
                      <span className="text-xs font-black text-slate-500">{log.time}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="font-display font-black text-slate-900">Security Controls</h3>
                  {['Admin authentication', 'Role-based access control', 'Secure session management', 'Document encryption', 'Auto logout on inactivity'].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedDocument && (
        <div className="fixed inset-0 z-[2500] bg-slate-950/75 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-black text-xl text-slate-900">{selectedDocument.document.label}</h3>
                <p className="text-xs text-slate-500">
                  {selectedDocument.vetName} · {selectedDocument.document.fileName} · {formatBytes(selectedDocument.document.fileSize)}
                  {selectedDocument.document.cloudinaryPublicId && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-black border border-green-100">Cloudinary</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(signedUrlState.url || selectedDocument.document.cloudinaryPublicId) && (
                  <button
                    onClick={() => triggerDownload(selectedDocument.document)}
                    disabled={downloadingDoc}
                    className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {downloadingDoc ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Downloading…
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> Download
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => { setSelectedDocument(null); setSignedUrlState({ loading: false, url: null, error: null }); }}
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-black"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-100 overflow-auto min-h-[420px]">
              {signedUrlState.loading ? (
                <div className="h-[420px] flex flex-col items-center justify-center gap-3 text-slate-500">
                  <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                  <p className="text-sm font-bold">Generating secure link…</p>
                </div>
              ) : signedUrlState.error ? (
                <div className="h-[420px] flex flex-col items-center justify-center gap-3 text-center p-6">
                  <FileSearch className="w-10 h-10 text-rose-400" />
                  <p className="text-sm font-black text-rose-600">{signedUrlState.error}</p>
                </div>
              ) : signedUrlState.url ? (
                selectedDocument.document.fileType.startsWith('image/') ? (
                  <img
                    src={signedUrlState.url}
                    alt={selectedDocument.document.label}
                    className="max-w-full mx-auto rounded-2xl border border-slate-200 bg-white"
                  />
                ) : (
                  <iframe
                    src={signedUrlState.url}
                    title={selectedDocument.document.label}
                    className="w-full h-[65vh] rounded-2xl border border-slate-200 bg-white"
                  />
                )
              ) : (
                <div className="h-[420px] rounded-2xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-center p-6">
                  <FileSearch className="w-10 h-10 text-slate-400 mb-3" />
                  <h4 className="font-black text-slate-800">Demo document placeholder</h4>
                  <p className="text-sm text-slate-500 max-w-md">
                    This sample application has document metadata only. Newly registered vets upload files that open here in full preview.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
      <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wide">{label}</span>
      <span className="block text-xs font-bold text-slate-800 truncate">{value}</span>
    </div>
  );
}
