import { useState, useMemo } from 'react';
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
  Star,
  CalendarDays,
  Activity,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type { Booking, EmergencyRequest } from '../../../types';
import type { DashboardMetrics, SeriesPoint, VetTab } from '../types';
import { EmptyState, QuickActions } from '../shared';

// ===== PROPS =====

interface OverviewTabFullProps {
  metrics: DashboardMetrics;
  appointmentsPerWeek: SeriesPoint[];
  bookings: Booking[];
  todaysAppointments: Booking[];
  pendingBookings: Booking[];
  completedBookings: Booking[];
  emergencies: EmergencyRequest[];
  ownedEmergencies: EmergencyRequest[];
  loadingId: string | null;
  onUpdateBookingStatus: (id: string, status: 'approved' | 'completed' | 'cancelled') => void;
  onUpdateEmergencyStatus: (id: string, status: 'accepted' | 'completed') => void;
  onTabChange: (tab: VetTab) => void;
}

// ===== HELPERS =====

function PetIcon({ type, className }: { type: string; className?: string }) {
  const cls = className || 'w-5 h-5';
  const normalized = type.toLowerCase();
  if (normalized.includes('dog')) return <Dog className={cls} />;
  if (normalized.includes('cat')) return <Cat className={cls} />;
  if (normalized.includes('bird')) return <Bird className={cls} />;
  if (normalized.includes('rabbit')) return <Rabbit className={cls} />;
  return <Dog className={cls} />;
}

function sortByTimeAsc(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => a.time.localeCompare(b.time));
}

// ===== WIDGETS =====

function DoctorPerformanceCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-[#58B368]" />
        <h3 className="text-sm font-bold text-gray-900">Doctor Performance</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="text-center p-3 bg-gray-50/50 rounded-xl">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Completion</p>
          <p className="text-base font-bold text-gray-950 mt-1">94%</p>
        </div>
        <div className="text-center p-3 bg-gray-50/50 rounded-xl">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Rating</p>
          <p className="text-base font-bold text-gray-950 mt-1 flex items-center justify-center gap-0.5">
            4.9 <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50/50 rounded-xl">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Avg Response</p>
          <p className="text-base font-bold text-gray-950 mt-1">6 min</p>
        </div>
        <div className="text-center p-3 bg-gray-50/50 rounded-xl">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Served</p>
          <p className="text-base font-bold text-gray-950 mt-1">312</p>
        </div>
        <div className="text-center p-3 bg-gray-50/50 rounded-xl col-span-2 sm:col-span-1">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Emergency Acc.</p>
          <p className="text-base font-bold text-gray-950 mt-1">98%</p>
        </div>
      </div>
    </div>
  );
}

function ClinicHealthWidget() {
  return (
    <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#58B368]" />
          <h3 className="text-sm font-bold text-gray-900">Clinic Health</h3>
        </div>
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Online
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-gray-50/50 rounded-xl">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Current Queue</p>
          <p className="text-sm font-bold text-gray-900 mt-1">6 Patients</p>
        </div>
        <div className="p-3 bg-gray-50/50 rounded-xl">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Avg Wait</p>
          <p className="text-sm font-bold text-gray-900 mt-1">18 mins</p>
        </div>
        <div className="p-3 bg-gray-50/50 rounded-xl">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Vets Active</p>
          <p className="text-sm font-bold text-gray-900 mt-1">3</p>
        </div>
      </div>
    </div>
  );
}

function RecentEmergencyQueue({
  emergencies,
  onAccept,
  loadingId,
}: {
  emergencies: EmergencyRequest[];
  onAccept: (id: string) => void;
  loadingId: string | null;
}) {
  const topEmergencies = useMemo(() => {
    return emergencies
      .filter((e) => e.status === 'pending' || e.status === 'notified')
      .slice(0, 3);
  }, [emergencies]);

  return (
    <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h3 className="text-sm font-bold text-gray-900">Critical Emergencies</h3>
        </div>
        {topEmergencies.length > 0 && (
          <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-semibold animate-pulse">
            {topEmergencies.length} active
          </span>
        )}
      </div>

      {topEmergencies.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400 flex flex-col items-center justify-center bg-gray-50/30 rounded-xl border border-dashed border-gray-100">
          <Check className="w-7 h-7 text-emerald-500 mb-2" />
          <p className="font-semibold text-gray-700">Queue Clear</p>
          <p className="text-[10px] text-gray-400 mt-0.5">No pending emergency alerts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topEmergencies.map((em) => (
            <div key={em.id} className="p-3 bg-rose-50/20 border border-rose-100/50 rounded-xl flex items-center justify-between gap-3 hover:scale-[1.01] transition-all">
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <span className="text-sm shrink-0">🚨</span>
                  <span className="truncate">{em.petName}</span>
                  <span className="text-[10px] text-gray-400 font-semibold shrink-0">({em.petType})</span>
                </p>
                <p className="text-[10px] text-rose-600 font-semibold mt-1 truncate max-w-[140px]">{em.description}</p>
              </div>
              <button
                disabled={loadingId === em.id}
                onClick={() => onAccept(em.id)}
                type="button"
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-[9px] rounded-lg shadow-sm hover:shadow transition-all shrink-0"
              >
                {loadingId === em.id ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UpcomingFollowUpTimeline({ bookings }: { bookings: Booking[] }) {
  const todayISO = new Date().toISOString().split('T')[0];
  const tomorrowISO = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const todayItems = bookings.filter((b) => b.date === todayISO).slice(0, 2);
  const tomorrowItems = bookings.filter((b) => b.date === tomorrowISO).slice(0, 1);
  const futureItems = bookings.filter((b) => b.date > tomorrowISO).slice(0, 1);

  return (
    <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-[#58B368]" />
        <h3 className="text-sm font-bold text-gray-900">Upcoming Follow-ups</h3>
      </div>
      <div className="relative border-l border-gray-150 ml-2.5 pl-5 space-y-5 py-1 text-xs">
        {/* Today */}
        <div className="relative">
          <span className="absolute -left-[26px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
          </span>
          <div>
            <p className="font-bold text-gray-900 uppercase text-[9px] tracking-wider">Today</p>
            {todayItems.length > 0 ? (
              <div className="mt-1 space-y-1">
                {todayItems.map((item) => (
                  <p key={item.id} className="text-gray-600 font-medium">
                    <span className="text-gray-900 font-bold">{item.time}</span> — {item.petName} ({item.service})
                  </p>
                ))}
              </div>
            ) : (
              <div className="mt-1 space-y-1 text-gray-500">
                <p className="font-medium"><span className="text-gray-905 font-bold">09:00</span> — Rocky (General Checkup)</p>
                <p className="font-medium"><span className="text-gray-905 font-bold">11:30</span> — Bella (Vaccination)</p>
              </div>
            )}
          </div>
        </div>

        {/* Tomorrow */}
        <div className="relative">
          <span className="absolute -left-[26px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 ring-4 ring-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
          </span>
          <div>
            <p className="font-bold text-gray-905 uppercase text-[9px] tracking-wider">Tomorrow</p>
            {tomorrowItems.length > 0 ? (
              <div className="mt-1">
                <p className="text-gray-600 font-medium">
                  {tomorrowItems[0].time} — {tomorrowItems[0].petName} ({tomorrowItems[0].service})
                </p>
              </div>
            ) : (
              <div className="mt-1 text-gray-500 font-medium">
                <p>Luna (Vaccination Booster)</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div className="relative">
          <span className="absolute -left-[26px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
          </span>
          <div>
            <p className="font-bold text-gray-905 uppercase text-[9px] tracking-wider">Upcoming Friday</p>
            {futureItems.length > 0 ? (
              <div className="mt-1">
                <p className="text-gray-600 font-medium">
                  {futureItems[0].petName} (Surgery Review)
                </p>
              </div>
            ) : (
              <div className="mt-1 text-gray-500 font-medium">
                <p>Max (Surgery Review)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCalendarWidget({ bookings, emergencies }: { bookings: Booking[]; emergencies: EmergencyRequest[] }) {
  const today = new Date();
  const monthName = today.toLocaleDateString('en-US', { month: 'long' });
  const year = today.getFullYear();

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const hasBooking = (dayNum: number) => {
    const dayStr = `${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return bookings.some((b) => b.date === dayStr);
  };

  const hasEmergency = (dayNum: number) => {
    return dayNum === today.getDate() && emergencies.some((e) => e.status === 'pending' || e.status === 'notified');
  };

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#58B368]" />
          <h3 className="text-sm font-bold text-gray-900">{monthName}</h3>
        </div>
        <span className="text-[10px] text-gray-400 font-semibold">{year}</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-2">
        {weekdays.map((w, idx) => <span key={idx}>{w}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-700">
        {days.map((day, idx) => {
          if (day === null) return <span key={idx}></span>;
          const isToday = day === today.getDate();
          const book = hasBooking(day);
          const emer = hasEmergency(day);

          return (
            <div
              key={idx}
              className={`relative p-1 rounded-lg flex items-center justify-center aspect-square ${
                isToday ? 'bg-[#58B368] text-white shadow-sm' : 'hover:bg-gray-100'
              }`}
            >
              <span>{day}</span>
              <div className="absolute bottom-0.5 flex gap-0.5 justify-center">
                {book && <span className={`h-1 w-1 rounded-full ${isToday ? 'bg-white' : 'bg-emerald-500'}`}></span>}
                {emer && <span className={`h-1 w-1 rounded-full ${isToday ? 'bg-white' : 'bg-red-500'}`}></span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-around text-[9px] font-bold text-gray-500">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Booking</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span> Emergency</span>
      </div>
    </div>
  );
}

// ===== APPOINTMENT CARD =====

interface AppointmentTimelineItemProps {
  booking: Booking;
  loading: boolean;
  onUpdateStatus: (id: string, status: 'approved' | 'completed' | 'cancelled') => void;
}

function AppointmentTimelineItem({ booking, loading, onUpdateStatus }: AppointmentTimelineItemProps) {
  let statusColor = 'border-l-4 border-l-gray-400';
  if (booking.status === 'approved') statusColor = 'border-l-4 border-l-[#58B368] bg-[#F4FBF3]/20';
  if (booking.status === 'pending') statusColor = 'border-l-4 border-l-amber-500 bg-amber-50/20';
  if (booking.status === 'completed') statusColor = 'border-l-4 border-l-blue-500 bg-blue-50/20';
  if (booking.status === 'cancelled') statusColor = 'border-l-4 border-l-rose-500 bg-rose-50/20';

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-all duration-150 ${statusColor}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
          <PetIcon type={booking.petType} className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-905 flex items-center gap-1.5">
            {booking.petName} <span className="text-[10px] text-gray-400 font-semibold">({booking.petType})</span>
          </p>
          <p className="text-xs text-gray-500 font-medium">Owner: {booking.petOwnerName} • {booking.service}</p>
          {booking.notes && <p className="mt-1.5 text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg">"{booking.notes}"</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {booking.status === 'pending' && (
          <>
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(booking.id, 'approved')}
              type="button"
              className="px-3 py-1.5 bg-[#58B368] text-white text-xs font-bold rounded-lg hover:bg-[#2F855A] shadow-sm transition-all"
            >
              Approve
            </button>
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(booking.id, 'cancelled')}
              type="button"
              className="px-3 py-1.5 border border-red-205 text-rose-700 bg-rose-50 text-xs font-bold rounded-lg hover:bg-rose-100 transition-all"
            >
              Decline
            </button>
          </>
        )}
        {booking.status === 'approved' && (
          <>
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(booking.id, 'completed')}
              type="button"
              className="px-3 py-1.5 bg-[#58B368] text-white text-xs font-bold rounded-lg hover:bg-[#2F855A] shadow-sm transition-all inline-flex items-center gap-1"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Start Consultation
            </button>
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(booking.id, 'cancelled')}
              type="button"
              className="px-3 py-1.5 border border-gray-200 text-gray-600 bg-white text-xs font-bold rounded-lg hover:bg-gray-50 transition-all"
            >
              Reschedule
            </button>
          </>
        )}
        {booking.status === 'completed' && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Completed</span>}
        {booking.status === 'cancelled' && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">Cancelled</span>}
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====

export default function OverviewTab({
  metrics,
  bookings,
  todaysAppointments,
  emergencies,
  loadingId,
  onUpdateBookingStatus,
  onUpdateEmergencyStatus,
  onTabChange,
}: OverviewTabFullProps) {
  const sortedAppointments = useMemo(() => sortByTimeAsc(todaysAppointments), [todaysAppointments]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left side widgets */}
      <div className="lg:col-span-2 space-y-6">
        {/* Quick Actions Panel */}
        <QuickActions onTabChange={onTabChange} />

        {/* Doctor Performance Card */}
        <DoctorPerformanceCard />

        {/* Clinic Health Widget */}
        <ClinicHealthWidget />

        {/* Today's Schedule Timeline */}
        <section
          id="todays-schedule"
          className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-gray-900">Today's Schedule</h2>
            {sortedAppointments.length > 0 && (
              <span className="text-xs text-gray-400 font-semibold">
                {sortedAppointments.length} appointment{sortedAppointments.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {sortedAppointments.length === 0 ? (
            <EmptyState
              title="No appointments scheduled today"
              message="Enjoy a lighter workload today."
              actionLabel="View Weekly Calendar"
              onAction={() => onTabChange('schedule')}
              icon={CalendarCheck}
            />
          ) : (
            <div className="relative border-l border-gray-200 ml-4 sm:ml-16 pl-4 sm:pl-6 space-y-6">
              {sortedAppointments.map((booking) => (
                <div key={booking.id} className="relative">
                  {/* Timeline Dot */}
                  <span className="absolute -left-[23px] sm:-left-[31px] top-4 flex h-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded-full bg-white border-2 border-[#58B368]">
                    <span className="h-1 sm:h-1.5 sm:w-1.5 rounded-full bg-[#58B368]"></span>
                  </span>
                  {/* Time Indicator */}
                  <div className="block sm:absolute sm:-left-[80px] sm:top-3 text-left sm:text-right sm:w-12 text-xs font-bold text-[#2F855A] sm:text-gray-500 mb-1.5 sm:mb-0">
                    {booking.time}
                  </div>
                  <AppointmentTimelineItem
                    booking={booking}
                    loading={loadingId === booking.id}
                    onUpdateStatus={onUpdateBookingStatus}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right side widgets */}
      <div className="space-y-6">
        {/* Mini Calendar Widget */}
        <MiniCalendarWidget bookings={bookings} emergencies={emergencies} />

        {/* Recent Emergencies Triage */}
        <RecentEmergencyQueue
          emergencies={emergencies}
          onAccept={(id) => onUpdateEmergencyStatus(id, 'accepted')}
          loadingId={loadingId}
        />

        {/* Upcoming Timeline */}
        <UpcomingFollowUpTimeline bookings={bookings} />
      </div>
    </div>
  );
}
