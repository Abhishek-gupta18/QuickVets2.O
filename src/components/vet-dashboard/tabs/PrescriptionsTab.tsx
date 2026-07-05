import { Pill } from 'lucide-react';
import { EmptyState } from '../shared';
import type { Booking } from '../../../types';

interface PrescriptionsTabProps {
  completedBookings: Booking[];
}

export default function PrescriptionsTab({ completedBookings }: PrescriptionsTabProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Prescriptions and medical notes
        </h3>
        <p className="text-sm text-slate-500">
          Completed consultations can be converted into treatment notes and
          follow-up recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {completedBookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-green-700" />
              <h4 className="font-bold text-slate-900">
                {booking.petName} prescription draft
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              <span className="font-semibold">Diagnosis:</span>{' '}
              {booking.notes || booking.service}
            </p>
            <p className="text-xs text-slate-500">
              <span className="font-semibold">Medicine:</span> To be entered after
              consultation review
            </p>
            <p className="text-xs text-slate-500">
              <span className="font-semibold">Follow-up:</span> Schedule review in
              7-14 days if symptoms persist
            </p>
          </div>
        ))}

        {!completedBookings.length && (
          <div className="xl:col-span-2">
            <EmptyState message="Prescription drafts appear after appointments are completed." />
          </div>
        )}
      </div>
    </section>
  );
}
