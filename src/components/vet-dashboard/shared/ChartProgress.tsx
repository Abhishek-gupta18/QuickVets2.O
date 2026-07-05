import type { ChartProgressProps } from '../types';

export function ChartProgress({ data, color = '#58B368' }: ChartProgressProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      {data.map((point) => {
        const percentage = (point.value / maxValue) * 100;
        return (
          <div key={point.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 truncate">{point.label}</span>
              <span className="text-xs font-medium text-gray-900 ml-2">{point.value}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
