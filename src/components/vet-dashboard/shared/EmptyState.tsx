import type { ComponentType } from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ComponentType<{ className?: string }>;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 border border-dashed border-gray-200 rounded-[20px] bg-gray-50/40 text-center">
      <div className="w-12 h-12 rounded-full bg-[#F4FBF3] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-[#58B368]" />
      </div>
      {title && <h3 className="text-sm font-semibold text-gray-950 mb-1">{title}</h3>}
      <p className="text-xs text-gray-500 max-w-sm leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#58B368] hover:bg-[#2F855A] rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
