import type { MetricTileProps } from '../types';

export function MetricTile({ icon: Icon, label, value, hint }: MetricTileProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start gap-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#F4FBF3] flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#58B368]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="text-xl font-semibold text-gray-900 mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 mt-1 truncate">{hint}</p>
      </div>
    </div>
  );
}
