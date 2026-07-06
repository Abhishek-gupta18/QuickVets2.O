import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MetricTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint: string;
  variant?: 'green' | 'red' | 'blue' | 'amber' | 'default';
}

function AnimatedNumber({ value }: { value: number | string }) {
  const isString = typeof value === 'string';
  const numericString = isString ? value.replace(/[^0-9.]/g, '') : '';
  const numericValue = isString ? parseFloat(numericString) : value;

  const isPercent = isString && value.endsWith('%');
  const isCurrency = isString && value.startsWith('₹');

  const [displayValue, setDisplayValue] = useState<number>(isNaN(numericValue) ? 0 : numericValue);

  useEffect(() => {
    if (isNaN(numericValue)) return;
    let start = displayValue;
    const end = numericValue;
    if (start === end) return;

    const duration = 400; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = (t: number) => t * (2 - t);
      const current = start + (end - start) * easeOutQuad(progress);

      setDisplayValue(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(animate);
  }, [numericValue]);

  if (isNaN(numericValue)) return <span>{value}</span>;
  if (isPercent) return <span>{displayValue}%</span>;
  if (isCurrency) return <span>₹{displayValue.toLocaleString('en-IN')}</span>;
  return <span>{displayValue}</span>;
}

export function MetricTile({ icon: Icon, label, value, hint, variant = 'default' }: MetricTileProps) {
  const isString = typeof value === 'string';
  const numericString = isString ? value.replace(/[^0-9.]/g, '') : '';
  const numericValue = isString ? parseFloat(numericString) : value;
  const isActive = !isNaN(numericValue) && numericValue > 0;

  let cardStyles = 'bg-white border-gray-100 hover:shadow-md';
  let iconStyles = 'bg-gray-50 text-gray-400';

  if (isActive) {
    if (variant === 'green') {
      cardStyles = 'bg-[#F4FBF3] border-[#BFE7C4] shadow-sm hover:border-[#58B368] hover:shadow-md';
      iconStyles = 'bg-[#58B368]/10 text-[#2F855A]';
    } else if (variant === 'red') {
      cardStyles = 'bg-red-50/20 border-red-100 shadow-sm hover:border-red-300 hover:shadow-md';
      iconStyles = 'bg-red-100/50 text-red-600';
    } else if (variant === 'blue') {
      cardStyles = 'bg-blue-50/20 border-blue-100 shadow-sm hover:border-blue-300 hover:shadow-md';
      iconStyles = 'bg-blue-100/50 text-blue-600';
    } else if (variant === 'amber') {
      cardStyles = 'bg-amber-50/20 border-amber-100 shadow-sm hover:border-amber-300 hover:shadow-md';
      iconStyles = 'bg-amber-100/50 text-amber-600';
    }
  } else {
    cardStyles = 'bg-white border-gray-100 hover:shadow-md';
    iconStyles = 'bg-gray-100/60 text-gray-400';
  }

  return (
    <div className={`rounded-[20px] border p-5 flex items-start gap-4 hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200 ${cardStyles}`}>
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${iconStyles}`}>
        <Icon className="w-5.5 h-5.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 leading-none tracking-tight">
          <AnimatedNumber value={value} />
        </p>
        <p className="text-xs text-gray-400 mt-2 truncate font-medium">{hint}</p>
      </div>
    </div>
  );
}

export default MetricTile;
