import { CalendarCheck, AlertTriangle, CalendarClock, FileText, Star, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ===== INTERFACES =====

export interface NotificationItem {
  id: string;
  type: 'booking' | 'emergency' | 'followup' | 'lab_report' | 'review';
  description: string;
  timestamp: string; // ISO date string
}

export interface NotificationsPanelProps {
  notifications: NotificationItem[];
}

// ===== ICON MAPPING =====

const iconMap: Record<NotificationItem['type'], LucideIcon> = {
  booking: CalendarCheck,
  emergency: AlertTriangle,
  followup: CalendarClock,
  lab_report: FileText,
  review: Star,
};

const iconColorMap: Record<NotificationItem['type'], string> = {
  booking: 'text-[#58B368] bg-[#F4FBF3]',
  emergency: 'text-red-500 bg-red-50',
  followup: 'text-amber-500 bg-amber-50',
  lab_report: 'text-blue-500 bg-blue-50',
  review: 'text-yellow-500 bg-yellow-50',
};

// ===== RELATIVE TIMESTAMP UTILITY =====

function getRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
}

// ===== COMPONENT =====

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  // Sort by most recent first, cap at 8 items
  const sorted = [...notifications]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Notifications</h3>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-12 h-12 rounded-full bg-[#F4FBF3] flex items-center justify-center mb-3">
            <CheckCircle className="w-6 h-6 text-[#58B368]" />
          </div>
          <p className="text-sm text-gray-500">All caught up</p>
        </div>
      ) : (
        <ul className="space-y-1">
          {sorted.map((item) => {
            const Icon = iconMap[item.type];
            const colorClass = iconColorMap[item.type];

            return (
              <li
                key={item.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug truncate">
                    {item.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {getRelativeTime(item.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
