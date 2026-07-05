import { Mail, MessageSquare } from 'lucide-react';

// ===== INTERFACES =====

export interface MessageSnippet {
  id: string;
  senderName: string;
  preview: string;
  timestamp: string; // ISO date string
}

export interface MessagesPreviewProps {
  messages: MessageSnippet[];
  onViewAll?: () => void;
}

// ===== HELPERS =====

/**
 * Truncate text to a maximum of 80 characters, appending ellipsis if truncated.
 */
function truncatePreview(text: string, maxLength = 80): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Compute a human-readable relative timestamp from an ISO date string.
 */
function relativeTimestamp(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
}

// ===== COMPONENT =====

export function MessagesPreview({ messages, onViewAll }: MessagesPreviewProps) {
  const recentMessages = messages.slice(0, 3);

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#58B368]" />
          <h3 className="text-sm font-semibold text-gray-800">Messages</h3>
        </div>
        {onViewAll && recentMessages.length > 0 && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-[#58B368] hover:text-[#2F855A] transition-colors"
          >
            View All
          </button>
        )}
      </div>

      {/* Content */}
      {recentMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4">
          <div className="w-14 h-14 rounded-full bg-[#F4FBF3] flex items-center justify-center mb-3">
            <Mail className="w-7 h-7 text-[#BFE7C4]" />
          </div>
          <p className="text-sm text-gray-500 text-center">No messages yet</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recentMessages.map((msg) => (
            <li
              key={msg.id}
              onClick={onViewAll}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewAll?.();
                }
              }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F4FBF3] cursor-pointer transition-colors"
            >
              {/* Avatar placeholder */}
              <div className="w-9 h-9 rounded-full bg-[#BFE7C4] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-[#2F855A]">
                  {msg.senderName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Message content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {msg.senderName}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {relativeTimestamp(msg.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {truncatePreview(msg.preview)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
