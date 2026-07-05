import type { VetClinic, User } from '../../../types';

interface ProfileTabProps {
  clinic: VetClinic;
  currentUser: User;
}

export default function ProfileTab({ clinic, currentUser }: ProfileTabProps) {
  const profileFields: [string, string | undefined][] = [
    ['Clinic', clinic.name],
    ['Veterinarian', clinic.veterinarianName || currentUser.name],
    ['Phone', clinic.phone],
    ['Address', clinic.address],
    ['Consultation focus', clinic.services.join(', ')],
    ['Specializations', clinic.specialists.join(', ')],
    ['Experience', clinic.yearsOfExperience || 'Not listed'],
    ['Biography', clinic.description],
  ];

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Profile management</h3>
        <p className="text-sm text-slate-500">
          Public clinic details can be maintained here. Sensitive credentials require
          re-verification.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {profileFields.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {value || '—'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
