import { Pill, FileUp, CalendarPlus, ShieldAlert, UserPlus } from 'lucide-react';
import type { ComponentType } from 'react';

interface QuickAction {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  targetTab: string;
}

const actions: QuickAction[] = [
  { id: 'add-patient', label: 'Add Patient', icon: UserPlus, targetTab: 'records' },
  { id: 'schedule-appointment', label: 'Schedule Appointment', icon: CalendarPlus, targetTab: 'schedule' },
  { id: 'emergency-intake', label: 'Emergency Intake', icon: ShieldAlert, targetTab: 'emergencies' },
  { id: 'create-prescription', label: 'Create Prescription', icon: Pill, targetTab: 'prescriptions' },
  { id: 'upload-record', label: 'Upload Medical Record', icon: FileUp, targetTab: 'records' },
];

interface QuickActionsProps {
  onTabChange: (tab: any) => void;
}

export function QuickActions({ onTabChange }: QuickActionsProps) {
  return (
    <section className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onTabChange(action.targetTab)}
              className="flex flex-col items-center gap-2.5 px-3 py-4 rounded-xl border border-gray-100 bg-white text-gray-700 hover:border-[#58B368]/30 hover:bg-[#F4FBF3]/35 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#58B368]/30"
            >
              <Icon className="w-5.5 h-5.5 text-[#58B368]" />
              <span className="text-center font-medium text-xs text-gray-800 leading-tight">{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default QuickActions;
