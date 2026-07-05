import { Pill, FileUp, FileText, CalendarPlus, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
}

const actions: QuickAction[] = [
  { id: 'create-prescription', label: 'Create Prescription', icon: Pill },
  { id: 'upload-report', label: 'Upload Report', icon: FileUp },
  { id: 'add-notes', label: 'Add Notes', icon: FileText },
  { id: 'schedule-followup', label: 'Schedule Follow-up', icon: CalendarPlus },
  { id: 'issue-vaccination-cert', label: 'Issue Vaccination Certificate', icon: ShieldCheck },
];

export function QuickActions() {
  const handleAction = (action: QuickAction) => {
    // Placeholder: will open modal dialog or navigate to workflow form in future implementation
    console.log(`[QuickActions] "${action.label}" clicked`);
    alert(`${action.label} — workflow coming soon`);
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleAction(action)}
              className="flex flex-col items-center gap-2 px-3 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-medium hover:border-[#58B368] hover:bg-[#F4FBF3] hover:text-[#2F855A] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#58B368]/40"
            >
              <Icon className="w-5 h-5" />
              <span className="text-center leading-tight">{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
