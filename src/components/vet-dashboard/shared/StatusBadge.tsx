import type { StatusBadgeProps } from '../types';

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  // Booking statuses
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  approved: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Approved' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelled' },
  // Emergency statuses
  notified: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Notified' },
  accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Accepted' },
  // Verification statuses
  rejected: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Rejected' },
  needs_documents: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Docs Required' },
  hold: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'On Hold' },
  suspended: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Suspended' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
