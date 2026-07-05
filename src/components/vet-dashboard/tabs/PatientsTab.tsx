import { useState, useMemo } from 'react';
import { Search, Cat, Dog, PawPrint, Calendar, User } from 'lucide-react';
import { EmptyState } from '../shared';
import type { PatientRecord } from '../types';
import type { Booking } from '../../../types';

interface PatientsTabProps {
  patientRecords: PatientRecord[];
  completedBookings: Booking[];
}

/** Returns the appropriate pet type icon component based on the pet type string. */
function PetTypeIcon({ type }: { type: string }) {
  const normalized = type.toLowerCase();
  if (normalized === 'cat') {
    return <Cat className="w-5 h-5 text-[#58B368]" />;
  }
  if (normalized === 'dog') {
    return <Dog className="w-5 h-5 text-[#58B368]" />;
  }
  return <PawPrint className="w-5 h-5 text-[#58B368]" />;
}

/** Format a date string (YYYY-MM-DD) to a human-readable format. */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PatientsTab({ patientRecords, completedBookings }: PatientsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Recent Patients: 5 most recent completed bookings sorted by date descending
  const recentPatients = useMemo(() => {
    return [...completedBookings]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [completedBookings]);

  // Search results: filter patientRecords by pet name, owner name, or email
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return null;

    return patientRecords.filter(
      (record) =>
        record.pet.toLowerCase().includes(query) ||
        record.owner.toLowerCase().includes(query) ||
        record.email.toLowerCase().includes(query)
    );
  }, [searchQuery, patientRecords]);

  const isSearchActive = searchQuery.trim().length >= 2;

  return (
    <section className="space-y-6">
      {/* Patient Search Input */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients by pet name, owner name, or email..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-[#F9FAFB] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#58B368]/40 focus:border-[#58B368] transition-all duration-200 text-sm"
            aria-label="Search patients"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {isSearchActive && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Search Results
            {searchResults && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({searchResults.length} found)
              </span>
            )}
          </h2>

          {searchResults && searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#BFE7C4] hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F4FBF3] flex items-center justify-center flex-shrink-0">
                    <PetTypeIcon type={record.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {record.pet}
                      </p>
                      <span className="text-xs text-gray-400 capitalize">
                        {record.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {record.owner}
                      </span>
                      <span className="text-xs text-gray-400">{record.email}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {formatDate(record.lastVisit)}
                    </p>
                    <p className="text-xs text-[#2F855A] mt-0.5">{record.diagnosis}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-14 h-14 rounded-full bg-[#F4FBF3] flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-[#BFE7C4]" />
              </div>
              <p className="text-sm text-gray-500 text-center">No patients found</p>
              <p className="text-xs text-gray-400 text-center mt-1">
                Check the spelling or try a different search term
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent Patients Section (default view when not searching) */}
      {!isSearchActive && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Patients</h2>

          {recentPatients.length > 0 ? (
            <div className="space-y-3">
              {recentPatients.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#BFE7C4] hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F4FBF3] flex items-center justify-center flex-shrink-0">
                    <PetTypeIcon type={booking.petType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {booking.petName}
                      </p>
                      <span className="text-xs text-gray-400 capitalize">
                        {booking.petType}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" />
                      {booking.petOwnerName}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {formatDate(booking.date)}
                    </p>
                    <p className="text-xs text-[#2F855A] mt-0.5">{booking.service}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No recent patients yet. Completed appointments will appear here." />
          )}
        </div>
      )}
    </section>
  );
}
