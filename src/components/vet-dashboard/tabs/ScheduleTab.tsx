import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import type { Booking } from '../../../types';
import { EmptyState } from '../shared';
import { StatusBadge } from '../shared';

interface ScheduleTabProps {
  bookings: Booking[];
}

// ===== Calendar Utilities =====

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateISO(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ===== ScheduleTab Component =====

export default function ScheduleTab({ bookings }: ScheduleTabProps) {
  const today = new Date();
  const todayISO = formatDateISO(today.getFullYear(), today.getMonth(), today.getDate());

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  // Build a map of date -> booking count for dot indicators
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const booking of bookings) {
      const existing = map.get(booking.date) || [];
      existing.push(booking);
      map.set(booking.date, existing);
    }
    return map;
  }, [bookings]);

  // Bookings for the currently selected date
  const selectedBookings = useMemo(() => {
    return bookingsByDate.get(selectedDate) || [];
  }, [bookingsByDate, selectedDate]);

  // Calendar grid data
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOffset = getFirstDayOfMonth(currentYear, currentMonth);

  // Navigation handlers
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDateISO(currentYear, currentMonth, day);
    setSelectedDate(dateStr);
  };

  return (
    <div className="space-y-6">
      {/* Mini Calendar Card */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-5 h-5 text-[#58B368]" />
          <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
        </div>

        {/* Month/Year Header with Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day Labels Row */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-medium text-gray-400 py-1"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty offset cells for days before the 1st */}
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDateISO(currentYear, currentMonth, day);
            const isToday = dateStr === todayISO;
            const isSelected = dateStr === selectedDate;
            const dayBookings = bookingsByDate.get(dateStr) || [];
            const hasBookings = dayBookings.length > 0;
            const appointmentCount = dayBookings.length;

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                title={
                  hasBookings
                    ? `${appointmentCount} appointment${appointmentCount !== 1 ? 's' : ''}`
                    : 'No appointments'
                }
                className={`
                  relative h-10 w-full rounded-lg text-sm font-medium transition-all duration-150
                  flex flex-col items-center justify-center
                  ${isToday && !isSelected ? 'bg-[#58B368] text-white' : ''}
                  ${isSelected ? 'bg-[#2F855A] text-white ring-2 ring-[#58B368]/30' : ''}
                  ${!isToday && !isSelected ? 'text-gray-700 hover:bg-[#F4FBF3]' : ''}
                `}
              >
                <span>{day}</span>
                {/* Dot indicator for dates with bookings */}
                {hasBookings && (
                  <span
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      isSelected || isToday ? 'bg-white' : 'bg-[#58B368]'
                    }`}
                    aria-label={`${appointmentCount} appointment${appointmentCount !== 1 ? 's' : ''}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Date Bookings */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">
            Appointments for{' '}
            <span className="text-[#58B368]">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {selectedBookings.length === 0 ? (
          <EmptyState message="No appointments scheduled for this date." />
        ) : (
          <div className="space-y-3">
            {selectedBookings
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-green-100 hover:bg-[#F4FBF3]/50 transition-colors"
                >
                  {/* Time */}
                  <div className="flex items-center gap-1.5 min-w-[80px]">
                    <Clock className="w-3.5 h-3.5 text-[#58B368]" />
                    <span className="text-sm font-medium text-gray-700">
                      {booking.time}
                    </span>
                  </div>

                  {/* Pet & Owner Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {booking.petName}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 truncate">
                        {booking.petOwnerName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {booking.service}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <StatusBadge status={booking.status} />
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
