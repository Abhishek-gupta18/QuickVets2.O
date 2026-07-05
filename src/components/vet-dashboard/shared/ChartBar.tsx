import type { ChartBarProps } from '../types';

export function ChartBar({ data, color = '#58B368', height = 120 }: ChartBarProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((point) => {
          const barHeight = (point.value / maxValue) * 100;
          return (
            <div key={point.label} className="flex flex-col items-center flex-1 h-full justify-end">
              <div
                className="w-full max-w-[28px] rounded-t-md transition-all duration-200"
                style={{
                  height: `${barHeight}%`,
                  backgroundColor: color,
                  opacity: 0.85,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        {data.map((point) => (
          <span key={point.label} className="text-[10px] text-gray-400 flex-1 text-center truncate">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
