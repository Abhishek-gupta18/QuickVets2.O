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

 export function DashboardNav({ activeTab, onTabChange, emergencyCount }: DashboardNavProps) {
   return (
     <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 py-2.5">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
           {navTabs.map((tab) => {
             const isActive = activeTab === tab.value;
             const Icon = tab.icon;

             return (
               <button
                 key={tab.value}
                 onClick={() => onTabChange(tab.value)}
                 className={`
                   relative flex items-center gap-2 px-4 py-2 text-xs font-semibold
                   whitespace-nowrap rounded-full transition-all duration-150
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#58B368]/50
                   ${
                     isActive
                       ? 'text-[#2F855A] bg-[#F4FBF3] border border-[#BFE7C4]/30 shadow-sm'
                       : 'text-gray-600 hover:text-[#2F855A] hover:bg-[#F4FBF3]/40 border border-transparent'
                   }
                 `}
                 aria-current={isActive ? 'page' : undefined}
               >
                 <Icon className={`w-4 h-4 ${isActive ? 'text-[#58B368]' : 'text-gray-400'}`} />
                 <span>{tab.label}</span>

                 {/* Numeric badge for Emergency Queue */}
                 {tab.value === 'emergencies' && emergencyCount > 0 && (
                   <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse">
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
