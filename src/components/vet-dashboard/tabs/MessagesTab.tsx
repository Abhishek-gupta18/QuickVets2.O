import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Bell,
  Star,
  ShieldAlert,
  CalendarCheck,
  Check,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { Booking, EmergencyRequest, ClinicReview } from '../../../types';
import { EmptyState } from '../shared';

interface MessagesTabFullProps {
  pendingBookings: Booking[];
  clinicReviews: ClinicReview[];
  ownedEmergencies: EmergencyRequest[];
  loadingId: string | null;
  onUpdateBookingStatus: (id: string, status: 'approved' | 'completed' | 'cancelled') => void;
  onTabChange: (tab: any) => void;
}

export default function MessagesTab({
  pendingBookings,
  clinicReviews,
  ownedEmergencies,
  loadingId,
  onUpdateBookingStatus,
  onTabChange,
}: MessagesTabFullProps) {
  const [filter, setFilter] = useState<'all' | 'alerts' | 'bookings' | 'reviews'>('all');
  const [search, setSearch] = useState('');

  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'alerts' | 'bookings' | 'reviews';
      title: string;
      description: string;
      date: string;
      item: any;
    }> = [];

    // 1. Add active emergencies
    ownedEmergencies.forEach((em) => {
      list.push({
        id: `em-${em.id}`,
        type: 'alerts',
        title: `🚨 Emergency Triage for ${em.petName}`,
        description: `Pet owner ${em.petOwnerName} is waiting for response. Symptoms: ${em.description}`,
        date: new Date(em.createdAt).toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' }),
        item: em,
      });
    });

    // 2. Add pending appointments
    pendingBookings.forEach((bk) => {
      list.push({
        id: `bk-${bk.id}`,
        type: 'bookings',
        title: `📅 Appointment Request: ${bk.petName} (${bk.petType})`,
        description: `Owner ${bk.petOwnerName} requested ${bk.service} on ${bk.date} at ${bk.time}.`,
        date: 'Recent',
        item: bk,
      });
    });

    // 3. Add reviews
    clinicReviews.forEach((rv) => {
      list.push({
        id: `rv-${rv.id}`,
        type: 'reviews',
        title: `⭐ New Review from ${rv.userName || 'Pet Parent'}`,
        description: `Rated the clinic ${rv.rating} stars: "${rv.reviewText || 'Excellent service!'}"`,
        date: 'Recent',
        item: rv,
      });
    });

    // Sort by type: alerts first, then bookings, then reviews
    return list.filter((n) => {
      if (filter !== 'all' && n.type !== filter) return false;
      if (search.trim() !== '') {
        const s = search.toLowerCase();
        return n.title.toLowerCase().includes(s) || n.description.toLowerCase().includes(s);
      }
      return true;
    });
  }, [pendingBookings, clinicReviews, ownedEmergencies, filter, search]);

  const counts = useMemo(() => {
    return {
      all: ownedEmergencies.length + pendingBookings.length + clinicReviews.length,
      alerts: ownedEmergencies.length,
      bookings: pendingBookings.length,
      reviews: clinicReviews.length,
    };
  }, [pendingBookings, clinicReviews, ownedEmergencies]);

  return (
    <div className="space-y-6">
      {/* Inbox Header */}
      <section className="bg-white border border-gray-100 rounded-[20px] shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#58B368]" />
            Communications & System Logs
          </h2>

          {/* Search bar */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-150 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#58B368]/30 focus:border-[#58B368] transition-all bg-gray-50/50"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
          {(['all', 'alerts', 'bookings', 'reviews'] as const).map((key) => {
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

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyState
          title="Inbox all clear"
          message="No unread notifications or review logs in this filter."
          icon={Bell}
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            let Icon = Bell;
            let themeClass = 'border-gray-100 bg-white';
            if (n.type === 'alerts') {
              Icon = ShieldAlert;
              themeClass = 'border-rose-100 bg-rose-50/10';
            } else if (n.type === 'bookings') {
              Icon = CalendarCheck;
              themeClass = 'border-emerald-100 bg-[#F4FBF3]/10';
            } else if (n.type === 'reviews') {
              Icon = Star;
              themeClass = 'border-amber-100 bg-amber-50/10';
            }

            return (
              <div
                key={n.id}
                className={`border rounded-[20px] p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-4 ${themeClass}`}
              >
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-transparent ${
                    n.type === 'alerts' ? 'bg-rose-100 text-rose-600' :
                    n.type === 'bookings' ? 'bg-[#58B368]/15 text-[#2F855A]' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    <Icon className="w-5.5 h-5.5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-905 flex items-center gap-2">
                      {n.title}
                      <span className="text-[10px] text-gray-400 font-semibold">{n.date}</span>
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-2xl">{n.description}</p>
                  </div>
                </div>

                {/* Inline Action helper */}
                <div className="shrink-0 self-end md:self-center">
                  {n.type === 'bookings' && (
                    <button
                      onClick={() => onTabChange('appointments')}
                      type="button"
                      className="px-3.5 py-2 text-xs font-bold text-[#2F855A] bg-[#F4FBF3] hover:bg-[#BFE7C4]/20 border border-[#BFE7C4]/30 rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5"
                    >
                      Manage Bookings
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {n.type === 'alerts' && (
                    <button
                      onClick={() => onTabChange('emergencies')}
                      type="button"
                      className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5"
                    >
                      Open Queue
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {n.type === 'reviews' && (
                    <button
                      onClick={() => onTabChange('reviews')}
                      type="button"
                      className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5"
                    >
                      View Review
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
