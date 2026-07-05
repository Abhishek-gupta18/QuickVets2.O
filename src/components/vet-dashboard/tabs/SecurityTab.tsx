import { Shield } from 'lucide-react';

export default function SecurityTab() {
  const securitySettings: [string, string][] = [
    ['Password', 'Last changed recently'],
    ['Two-factor authentication', 'Optional setup available'],
    ['Active sessions', '1 trusted browser session'],
    ['Privacy settings', 'Public verified clinic profile visible'],
    ['Device login history', 'Current Windows browser session'],
    ['Account deactivation', 'Requires support confirmation'],
  ];

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Account and security
        </h3>
        <p className="text-sm text-slate-500">
          Password management, two-factor authentication, active sessions, and
          privacy controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {securitySettings.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="text-sm font-bold text-slate-900">{label}</p>
            <p className="mt-1 text-xs text-slate-500">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
