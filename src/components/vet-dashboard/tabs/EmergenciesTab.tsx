import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Phone,
  MapPin,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  PawPrint,
  Siren,
} from 'lucide-react';
import { StatusBadge, EmptyState } from '../shared';
import type { EmergencyRequest, VetClinic } from '../../../types';

interface EmergenciesTabFullProps {
  emergencies: EmergencyRequest[];
  clinic: VetClinic;
  loadingId: string | null;
  onUpdateEmergencyStatus: (id: string, status: 'accepted' | 'completed') => void;
}

/**
 * Computes a human-readable elapsed time string from the given ISO date string to now.
 */
function getElapsedTime(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  if (diffMs < 0) return 'just now';

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  }
  return 'just now';
}

/**
 * Returns a pet type icon/emoji for visual distinction.
 */
function getPetIcon(petType: string): string {
  const lower = petType.toLowerCase();
  if (lower.includes('dog')) return '🐕';
  if (lower.includes('cat')) return '🐈';
  if (lower.includes('bird')) return '🐦';
  if (lower.includes('rabbit')) return '🐇';
  return '🐾';
}

/**
 * EmergencyCard - A single emergency request card with actions.
 */
function EmergencyCard({
  emergency,
  loading,
  onAccept,
  expanded,
  onToggleDetails,
}: {
  emergency: EmergencyRequest;
  loading: boolean;
  onAccept: (id: string) => void;
  expanded: boolean;
  onToggleDetails: (id: string) => void;
}) {
  const elapsed = getElapsedTime(emergency.createdAt);

  return (
    <div className="bg-white rounded-xl border border-red-100/60 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Priority indicator bar */}
      <div className="h-1 bg-gradient-to-r from-red-400 to-orange-400" />

      <div className="p-5 space-y-4">
        {/* Header: pet info + status + elapsed time */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-lg shrink-0">
              {getPetIcon(emergency.petType)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-gray-900">{emergency.petName}</h3>
                <span className="text-xs text-gray-500">({emergency.petType})</span>
                <StatusBadge status={emergency.status} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Owner: <span className="font-medium text-gray-700">{emergency.petOwnerName}</span>
              </p>
            </div>
          </div>

          {/* Elapsed time badge */}
          <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full shrink-0">
            <Clock className="w-3 h-3" />
            <span className="font-medium">{elapsed}</span>
          </div>
        </div>

        {/* Symptom description */}
        <div className="flex items-start gap-2 bg-amber-50/60 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 leading-relaxed">{emergency.description}</p>
        </div>

        {/* Contact info row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span>{emergency.phone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate max-w-[200px]">{emergency.address}</span>
          </div>
        </div>

        {/* Expanded details section */}
        {expanded && (
          <div className="border-t border-gray-100 pt-3 space-y-2 text-sm text-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-gray-700">Full Address:</span>
                <p className="mt-0.5">{emergency.address}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <p className="mt-0.5">{emergency.phone}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Reported:</span>
                <p className="mt-0.5">
                  {new Date(emergency.createdAt).toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Owner Email:</span>
                <p className="mt-0.5">{emergency.petOwnerEmail}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => onAccept(emergency.id)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#58B368] text-white text-sm font-medium rounded-lg hover:bg-[#2F855A] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Accept Case
          </button>

          <a
            href={`tel:${emergency.phone}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors duration-200"
          >
            <Phone className="w-4 h-4" />
            Call Owner
          </a>

          <button
            onClick={() => onToggleDetails(emergency.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * EmergenciesTab - Emergency queue with triage actions.
 * Displays pending/notified emergencies sorted by createdAt ascending (oldest first = longest wait).
 */
export default function EmergenciesTab({
  emergencies,
  clinic,
  loadingId,
  onUpdateEmergencyStatus,
}: EmergenciesTabFullProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filter: only pending or notified emergencies
  const pendingEmergencies = emergencies
    .filter((e) => e.status === 'pending' || e.status === 'notified')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleAccept = (id: string) => {
    onUpdateEmergencyStatus(id, 'accepted');
  };

  const handleToggleDetails = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="space-y-5">
      {/* Section header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <Siren className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Emergency Queue</h2>
              <p className="text-xs text-gray-500">
                {pendingEmergencies.length > 0
                  ? `${pendingEmergencies.length} case${pendingEmergencies.length > 1 ? 's' : ''} awaiting response`
                  : 'No active emergencies'}
              </p>
            </div>
          </div>

          {pendingEmergencies.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {pendingEmergencies.length}
            </span>
          )}
        </div>
      </div>

      {/* Emergency cards or empty state */}
      {pendingEmergencies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <EmptyState message="No pending emergencies right now. All cases are handled." />
        </div>
      ) : (
        <div className="space-y-4">
          {pendingEmergencies.map((emergency) => (
            <EmergencyCard
              key={emergency.id}
              emergency={emergency}
              loading={loadingId === emergency.id}
              onAccept={handleAccept}
              expanded={expandedIds.has(emergency.id)}
              onToggleDetails={handleToggleDetails}
            />
          ))}
        </div>
      )}
    </section>
  );
}
