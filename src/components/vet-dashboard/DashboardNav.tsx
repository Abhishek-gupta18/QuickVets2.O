import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  ShieldAlert,
  PawPrint,
  CalendarClock,
  Star,
  Settings,
} from 'lucide-react';
import type { VetTab } from './types';

export interface DashboardNavProps {
  activeTab: VetTab;
  onTabChange: (tab: VetTab) => void;
  emergencyCount: number;
}

interface NavTab {
  label: string;
  value: VetTab;
  icon: ComponentType<{ className?: string }>;
}

const navTabs: NavTab[] = [
  { label: 'Dashboard', value: 'overview', icon: LayoutDashboard },
  { label: 'Appointments', value: 'appointments', icon: CalendarCheck },
  { label: 'Emergency Queue', value: 'emergencies', icon: ShieldAlert },
  { label: 'Patients', value: 'records', icon: PawPrint },
  { label: 'Schedule', value: 'schedule', icon: CalendarClock },
  { label: 'Reviews', value: 'reviews', icon: Star },
  { label: 'Settings', value: 'security', icon: Settings },
];

/**
 * Compact horizontal navigation bar for the vet dashboard.
 * Implements Requirements 2.1, 2.2, 2.3, 2.4:
 * - Horizontal tab bar with 7 navigation items
 * - Active tab highlighting with green underline
 * - Sticky positioning (visible without scrolling at top)
 * - Numeric badge on Emergency Queue when pending count > 0
 */
export function DashboardNav({ activeTab, onTabChange, emergencyCount }: DashboardNavProps) {
  return (
    <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.value;
            const Icon = tab.icon;

            return (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium
                  whitespace-nowrap rounded-t-lg transition-colors duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58B368]/50
                  ${
                    isActive
                      ? 'text-[#2F855A] border-b-2 border-[#58B368] bg-[#F4FBF3]'
                      : 'text-gray-600 hover:text-[#2F855A] hover:bg-[#F4FBF3]/50 border-b-2 border-transparent'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#58B368]' : 'text-gray-400'}`} />
                <span>{tab.label}</span>

                {/* Numeric badge for Emergency Queue (Req 2.4) */}
                {tab.value === 'emergencies' && emergencyCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                    {emergencyCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default DashboardNav;
