import { Inbox } from 'lucide-react';
import type { EmptyStateProps } from '../types';

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-[#F4FBF3] flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-[#BFE7C4]" />
      </div>
      <p className="text-sm text-gray-500 text-center max-w-xs">{message}</p>
    </div>
  );
}
