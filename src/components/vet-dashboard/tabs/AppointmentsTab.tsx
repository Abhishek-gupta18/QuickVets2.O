import { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Check,
  X,
  Play,
  Dog,
  Cat,
  Bird,
  Rabbit,
  User,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import type { Booking } from '../../../types';
import { EmptyState } from '../shared';

interface AppointmentsTabFullProps {
  bookings: Booking[];
  loadingId: string | null;
  onUpdateBookingStatus: (id: string, status: 'approved' | 'completed' | 'cancelled') => void;
}

function PetIcon({ type }: { type: string }) {
  const normalized = type.toLowerCase();
  if (normalized.includes('dog')) return <Dog className="w-5 h-5 text-gray-500" />;
  if (normalized.includes('cat')) return <Cat className="w-5 h-5 text-gray-500" />;
  if (normalized.includes('bird')) return <Bird className="w-5 h-5 text-gray-500" />;
  if (normalized.includes('rabbit')) return <Rabbit className="w-5 h-5 text-gray-500" />;
  return <Dog className="w-5 h-5 text-gray-500" />;
}

export default function AppointmentsTab({
  bookings,
  loadingId,
  onUpdateBookingStatus,
}: AppointmentsTabFullProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (filter !== 'all' && b.status !== filter) return false;
        if (search.trim() !== '') {
          const s = search.toLowerCase();
          return (
            b.petOwnerName.toLowerCase().includes(s) ||
            b.petName.toLowerCase().includes(s) ||
            b.service.toLowerCase().includes(s)
          );
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [bookings, filter, search]);

  const counts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      approved: bookings.filter((b) => b.status === 'approved').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <section className="bg-white border border-gray-100 rounded-[20px] shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#58B368]" />
            Appointment Management
          </h2>

          {/* Search bar */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by pet name, owner, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-150 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#58B368]/30 focus:border-[#58B368] transition-all bg-gray-50/50"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
          {(['all', 'pending', 'approved', 'completed', 'cancelled'] as const).map((key) => {
            const count = counts[key];
            const isActive = filter === key;

            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                type="button"
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-[#F4FBF3] text-[#2F855A] border border-[#BFE7C4]/35 shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <span>{key}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    isActive ? 'bg-[#58B368] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Appointment Cards List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          title="No appointments found"
          message={
            search.trim() !== ''
              ? 'Try adjusting your search terms or filters.'
              : 'No appointments registered in this category.'
          }
          actionLabel={search.trim() !== '' ? 'Reset Filters' : undefined}
          onAction={() => {
            setSearch('');
            setFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((booking) => {
            const loading = loadingId === booking.id;
            let statusColor = 'border-l-4 border-l-gray-400 bg-white';
            if (booking.status === 'approved') statusColor = 'border-l-4 border-l-[#58B368] bg-[#F4FBF3]/10';
            if (booking.status === 'pending') statusColor = 'border-l-4 border-l-amber-500 bg-amber-50/10';
            if (booking.status === 'completed') statusColor = 'border-l-4 border-l-blue-500 bg-blue-50/10';
            if (booking.status === 'cancelled') statusColor = 'border-l-4 border-l-rose-500 bg-rose-50/10';

            return (
              <div
                key={booking.id}
                className={`border border-gray-100 rounded-[20px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4 ${statusColor}`}
              >
                <div className="space-y-3">
                  {/* Header: Pet details & Type */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                        <PetIcon type={booking.petType} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{booking.petName}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold capitalize">{booking.petType} • {booking.type === 'home_visit' ? '🏡 Home Visit' : '🏥 Clinic Visit'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      booking.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  {/* Body: Owner, Contact, Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 font-semibold border-t border-gray-50/80 pt-3">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{booking.petOwnerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{booking.date} at {booking.time}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate text-gray-500 font-medium">{booking.petOwnerEmail}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="text-xs text-gray-500 italic bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 mt-2">
                      "{booking.notes}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50/80">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        disabled={loading}
                        onClick={() => onUpdateBookingStatus(booking.id, 'approved')}
                        type="button"
                        className="flex-1 py-2 bg-[#58B368] text-white text-xs font-bold rounded-lg hover:bg-[#2F855A] shadow-sm transition-all"
                      >
                        Approve
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => onUpdateBookingStatus(booking.id, 'cancelled')}
                        type="button"
                        className="flex-1 py-2 border border-red-200 text-red-600 bg-red-50 text-xs font-bold rounded-lg hover:bg-red-100 transition-all"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {booking.status === 'approved' && (
                    <>
                      <button
                        disabled={loading}
                        onClick={() => onUpdateBookingStatus(booking.id, 'completed')}
                        type="button"
                        className="flex-1 py-2 bg-[#58B368] text-white text-xs font-bold rounded-lg hover:bg-[#2F855A] shadow-sm transition-all inline-flex items-center justify-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Start Consultation
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => onUpdateBookingStatus(booking.id, 'cancelled')}
                        type="button"
                        className="px-4 py-2 border border-gray-200 text-gray-600 bg-white text-xs font-bold rounded-lg hover:bg-gray-50 transition-all"
                      >
                        Reschedule
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
