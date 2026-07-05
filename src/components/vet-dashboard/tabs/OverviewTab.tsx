import type { ReactNode } from 'react';
import {
  CalendarCheck,
  ShieldAlert,
  MessageSquare,
  ClipboardList,
  Clock,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Play,
  CalendarClock,
  Check,
  X,
} from 'lucide-react';
import type { Booking } from '../../../types';
import type { DashboardMetrics, SeriesPoint, VetTab } from '../types';
import { StatusBadge } from '../shared';
import { EmptyState } from '../shared';

// ===== PROPS =====

interface OverviewTabFullProps {
  metrics: DashboardMetrics;
  appointmentsPerWeek: SeriesPoint[];
  todaysAppointments: Booking[];
  loadingId: string | null;
  onUpdateBookingStatus: (id: string, status: 'approved' | 'completed' | 'cancelled') => void;
  onTabChange?: (tab: VetTab) => void;
}

// ===== HELPERS =====

/** Get a species-based icon component */
function PetIcon({ type, className }: { type: string; className?: string }) {
  const cls = className || 'w-5 h-5';
  const normalized = type.toLowerCase();
  if (normalized === 'dog') return <Dog className={cls} />;
  if (normalized === 'cat') return <Cat className={cls} />;
  if (normalized === 'bird') return <Bird className={cls} />;
  if (normalized === 'rabbit') return <Rabbit className={cls} />;
  // Default fallback for other types
  return <Dog className={cls} />;
}

/** Sort bookings by time ascending */
function sortByTimeAsc(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => a.time.localeCompare(b.time));
}

// ===== ACTION CARD =====

interface ActionCardProps {
  icon: ReactNode;
  label: string;
  count: number;
  onClick?: () => void;
}

function ActionCard({ icon, label, count, onClick }: ActionCardProps) {
  const isActive = count > 0;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 w-full text-left
        ${
          isActive
            ? 'bg-[#F4FBF3] border-[#BFE7C4] hover:shadow-md hover:border-[#58B368]'
            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
        }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isActive ? 'bg-[#58B368]/10 text-[#58B368]' : 'bg-gray-200/60 text-gray-400'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p
          className={`text-xl font-bold ${
            isActive ? 'text-[#2F855A]' : 'text-gray-400'
          }`}
        >
          {count}
        </p>
      </div>
    </button>
  );
}

// ===== APPOINTMENT CARD =====

interface AppointmentCardProps {
  booking: Booking;
  loading: boolean;
  onUpdateStatus: (id: string, status: 'approved' | 'completed' | 'cancelled') => void;
}

function AppointmentCard({ booking, loading, onUpdateStatus }: AppointmentCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow duration-200">
      {/* Time */}
      <div className="shrink-0 text-center w-16">
        <div className="flex items-center justify-center gap-1 text-sm font-semibold text-gray-700">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {booking.time}
        </div>
      </div>

      {/* Pet icon */}
      <div className="w-10 h-10 rounded-full bg-[#F4FBF3] flex items-center justify-center shrink-0">
        <PetIcon type={booking.petType} className="w-5 h-5 text-[#58B368]" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{booking.petName}</p>
          <span className="text-xs text-gray-400">•</span>
          <p className="text-xs text-gray-500 truncate">{booking.petOwnerName}</p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{booking.petType}</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-500">{booking.service}</span>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {booking.status === 'completed' && (
          <StatusBadge status="completed" />
        )}

        {booking.status === 'approved' && (
          <>
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(booking.id, 'completed')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#58B368] text-white hover:bg-[#2F855A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3 h-3" />
              Start Consultation
            </button>
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(booking.id, 'cancelled')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarClock className="w-3 h-3" />
              Reschedule
            </button>
          </>
        )}

        {booking.status === 'pending' && (
          <>
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(booking.id, 'approved')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#58B368] text-white hover:bg-[#2F855A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-3 h-3" />
              Approve
            </button>
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(booking.id, 'cancelled')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </>
        )}

        {booking.status === 'cancelled' && (
          <StatusBadge status="cancelled" />
        )}
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====

export default function OverviewTab({
  metrics,
  appointmentsPerWeek,
  todaysAppointments,
  loadingId,
  onUpdateBookingStatus,
  onTabChange,
}: OverviewTabFullProps) {
  const sortedAppointments = sortByTimeAsc(todaysAppointments);

  const handleActionCardClick = (tab: VetTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      // Fallback: scroll to schedule section
      const el = document.getElementById('todays-schedule');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard
          icon={<CalendarCheck className="w-5 h-5" />}
          label="Today's Appointments"
          count={metrics.todaysAppointments}
          onClick={() => handleActionCardClick('appointments')}
        />
        <ActionCard
          icon={<ShieldAlert className="w-5 h-5" />}
          label="Active Emergencies"
          count={metrics.emergencies}
          onClick={() => handleActionCardClick('emergencies')}
        />
        <ActionCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Unread Messages"
          count={metrics.messages}
          onClick={() => handleActionCardClick('messages')}
        />
        <ActionCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="Follow-ups Due"
          count={metrics.upcomingAppointments}
          onClick={() => handleActionCardClick('appointments')}
        />
      </section>

      {/* Today's Schedule */}
      <section
        id="todays-schedule"
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
          {sortedAppointments.length > 0 && (
            <span className="text-xs text-gray-400">
              {sortedAppointments.length} appointment{sortedAppointments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {sortedAppointments.length === 0 ? (
          <EmptyState message="No appointments scheduled for today. View full schedule to plan ahead." />
        ) : (
          <div className="space-y-3">
            {sortedAppointments.map((booking) => (
              <AppointmentCard
                key={booking.id}
                booking={booking}
                loading={loadingId === booking.id}
                onUpdateStatus={onUpdateBookingStatus}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
