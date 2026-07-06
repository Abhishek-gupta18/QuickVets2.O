import { Pill, Sparkles } from 'lucide-react';
import { EmptyState } from '../shared';
import type { Booking } from '../../../types';

interface PrescriptionsTabProps {
  completedBookings: Booking[];
  onTabChange?: (tab: any) => void;
}

export default function PrescriptionsTab({ completedBookings, onTabChange }: PrescriptionsTabProps) {
  return (
    <section className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 space-y-6 hover:shadow-md transition-shadow duration-200">
      <div>
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Pill className="w-5 h-5 text-[#58B368]" />
          Digital Prescription Manager
        </h3>
        <p className="text-xs text-gray-500 font-semibold mt-1">
          Completed consultations can be converted into medical records, treatment notes, and digital prescriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {completedBookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-xl border border-gray-100 bg-gray-50/30 p-5 space-y-3 hover:scale-[1.01] hover:border-[#58B368]/30 transition-all duration-150"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#58B368]" />
              <h4 className="text-xs font-bold text-gray-900">
                {booking.petName} — Prescription Draft
              </h4>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600 font-semibold pt-2 border-t border-gray-100">
              <p>
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">Diagnosis</span>{' '}
                {booking.notes || booking.service}
              </p>
              <p>
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">Medicine</span>{' '}
                To be entered after consultation review
              </p>
              <p>
                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">Follow-up Recommendation</span>{' '}
                Schedule review in 7-14 days if symptoms persist
              </p>
            </div>
          </div>
        ))}

        {!completedBookings.length && (
          <div className="md:col-span-2">
            <EmptyState
              title="No drafts available"
              message="Prescription drafts appear automatically after appointments are completed."
              actionLabel="Go to Today's Schedule"
              onAction={() => onTabChange && onTabChange('overview')}
              icon={Pill}
            />
          </div>
        )}
      </div>
    </section>
  );
}
