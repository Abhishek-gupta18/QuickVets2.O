import { FileText } from 'lucide-react';
import type { VetClinic, VetDocument } from '../../../types';
import type { VerificationInfo } from '../types';

interface CredentialsTabProps {
  clinic: VetClinic;
  verification: VerificationInfo;
  verificationStatus: string;
}

function DocumentList({ documents }: { documents: VetDocument[] }) {
  if (!documents.length) {
    return (
      <p className="text-xs text-slate-400">
        No credential documents are attached yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {documents.map((doc) => (
        <a
          key={doc.id}
          href={doc.dataUrl || undefined}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-green-300 transition-colors"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <FileText className="h-4 w-4 text-green-700" />
            {doc.label}
          </span>
          <span className="mt-1 block truncate text-[10px] text-slate-400">
            {doc.fileName}
          </span>
        </a>
      ))}
    </div>
  );
}

export default function CredentialsTab({
  clinic,
  verification,
  verificationStatus,
}: CredentialsTabProps) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Verification and credential management
        </h3>
        <p className="text-sm text-slate-500">
          Review current approval status, uploaded documents, and credential details.
        </p>
      </div>

      {/* Verification status banner */}
      <div className={`rounded-xl border p-5 ${verification.tone}`}>
        <p className="text-xs font-bold uppercase tracking-wide">
          {verification.label}
        </p>
        <p className="mt-2 text-sm">{verification.message}</p>
      </div>

      {/* Credential quick-facts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            License number
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {clinic.licenseNumber || 'Pending entry'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Expiry reminder
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            90 days before expiry
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Documents
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {clinic.verificationDocuments?.length || 0} uploaded
          </p>
        </div>
      </div>

      {/* Document list */}
      <DocumentList documents={clinic.verificationDocuments || []} />
    </section>
  );
}
