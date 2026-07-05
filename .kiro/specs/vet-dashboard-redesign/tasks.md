# Implementation Plan: Vet Dashboard Redesign

## Overview

Refactor the monolithic `VetDashboard.tsx` (~900 lines) into a modular, component-per-tab architecture with a centralized data hook, shared UI components, and a new clinical-workflow-focused layout. The implementation preserves all existing functionality while restructuring into a maintainable codebase with lazy-loaded tabs, proper TypeScript interfaces, and a redesigned UI matching the requirements for a modern veterinary workspace.

## Tasks

- [x] 1. Set up directory structure and TypeScript interfaces
  - [x] 1.1 Create the vet-dashboard directory structure and types file
    - Create `src/components/vet-dashboard/` directory with subdirectories: `tabs/`, `shared/`, `hooks/`
    - Create `src/components/vet-dashboard/types.ts` with all interfaces: `VetDashboardLayoutProps`, `DashboardSidebarProps`, `TabDefinition`, `VerificationInfo`, `VetTab`, `VerificationState`, `DashboardMetrics`, `PriorityItem`, `SeriesPoint`, `VetAnalyticsData`, `PatientRecord`, `AppointmentsTabProps`, `EmergenciesTabProps`, `AnalyticsTabProps`, `OverviewTabProps`, `MetricTileProps`, `StatusBadgeProps`, `EmptyStateProps`, `ChartBarProps`, `ChartProgressProps`
    - Export the `statusCopy` verification state mapping object from types
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 14.1_

  - [x] 1.2 Create shared UI components (MetricTile, StatusBadge, EmptyState, ChartBar, ChartProgress)
    - Create `src/components/vet-dashboard/shared/MetricTile.tsx` — reusable KPI card with icon, label, value, and hint text
    - Create `src/components/vet-dashboard/shared/StatusBadge.tsx` — status indicator with color mapping for all booking/emergency statuses
    - Create `src/components/vet-dashboard/shared/EmptyState.tsx` — empty content placeholder with illustration, message, and optional CTA button using QuickVet brand colors
    - Create `src/components/vet-dashboard/shared/ChartBar.tsx` — simple vertical bar chart for weekly trends
    - Create `src/components/vet-dashboard/shared/ChartProgress.tsx` — horizontal progress bar list for category breakdowns
    - Create `src/components/vet-dashboard/shared/index.ts` barrel export file
    - _Requirements: 3.1, 3.2, 3.3, 13.1, 13.2, 13.3, 14.1, 14.2, 14.4_

- [x] 2. Implement the useVetDashboard hook
  - [x] 2.1 Create the centralized data hook
    - Create `src/components/vet-dashboard/hooks/useVetDashboard.ts`
    - Implement clinic derivation from `currentUser.clinicId`
    - Implement verification state computation and `isApproved` boolean
    - Implement booking filtering (`clinicBookings`, `todaysAppointments`, `pendingBookings`, `completedBookings`)
    - Implement emergency filtering (`activeEmergencies`, `ownedEmergencies`)
    - Implement `derivePatientRecords` with deduplication by (email, petName)
    - Implement `useFetchReviews` effect with cleanup and error handling
    - Implement `useFetchAnalytics` effect with cleanup, loading state, and graceful fallback
    - Implement `updateBooking` and `updateEmergency` async action handlers with `loadingId` mutex
    - Implement tab definitions array with dynamic badge counts
    - Compute `DashboardMetrics` object with fallback to local values when analytics unavailable
    - Return all computed state, setters, and action handlers
    - _Requirements: 1.2, 1.5, 3.1, 3.2, 3.3, 4.1, 5.1, 6.1, 12.1, 12.2, 12.3_

  - [ ]* 2.2 Write property test: Booking Scope (P3)
    - **Property 3: Booking Scope** — For any set of bookings with mixed clinicIds, the filtered `clinicBookings` always contains only bookings where `booking.clinicId === clinic.id`
    - **Validates: Requirements 4.1, 5.1**

  - [ ]* 2.3 Write property test: Patient Deduplication (P4)
    - **Property 4: Patient Deduplication** — For any list of completed bookings, `derivePatientRecords` output has no duplicate (email, petName) pairs and `result.length <= input.length`
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 2.4 Write property test: Verification Gate (P2)
    - **Property 2: Verification Gate** — For any VetTab and verification status combination, all tabs except 'credentials' are accessible only when `verificationStatus === 'approved'`
    - **Validates: Requirements 12.1, 12.2, 12.3**

- [x] 3. Implement the Hero Section and navigation layout
  - [x] 3.1 Create the VetDashboardLayout shell component
    - Create `src/components/vet-dashboard/VetDashboardLayout.tsx`
    - Implement the top-level layout with Hero Section containing: time-based greeting, "Dr. {name}", clinic name, verification badge, today's date, and four summary stats
    - Implement glassmorphism styling for Hero Section only (semi-transparent bg + backdrop-blur)
    - Implement the "no clinic" fallback state rendering
    - Use `React.lazy()` + `Suspense` for tab content loading
    - Wire `useVetDashboard` hook and pass computed state to child components
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 14.1, 14.3, 14.5_

  - [x] 3.2 Create the compact navigation bar component
    - Create `src/components/vet-dashboard/DashboardNav.tsx`
    - Implement horizontal tab bar with: Dashboard, Appointments, Emergency Queue, Patients, Schedule, Reviews, Settings
    - Implement active tab highlighting and click-to-switch behavior
    - Implement numeric badge on Emergency Queue tab when pending count > 0
    - Ensure navigation remains visible at top of page (sticky positioning)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 4. Implement core tab components
  - [x] 4.1 Create the OverviewTab (Dashboard home view)
    - Create `src/components/vet-dashboard/tabs/OverviewTab.tsx`
    - Implement four Action Cards: "Today's Appointments", "Active Emergencies", "Unread Messages", "Follow-ups Due"
    - Implement green accent styling for non-zero counts, muted neutral for zero counts
    - Implement click navigation to corresponding detail sections
    - Implement Today's Schedule section: list bookings for today sorted by time ascending
    - Render Appointment Cards with: time, pet species icon, pet name, owner name, species/breed, service, status
    - Implement action buttons per status: "Start Consultation"/"Reschedule" for approved, "Approve"/"Cancel" for pending, read-only badge for completed
    - Wire button clicks to `onUpdateBookingStatus` calls
    - Render Empty State when no today bookings exist
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [x] 4.2 Create the EmergenciesTab (Emergency Queue)
    - Create `src/components/vet-dashboard/tabs/EmergenciesTab.tsx`
    - List emergencies with status "pending" or "notified", sorted by createdAt ascending
    - Render Emergency Cards with: pet name, pet type, owner name, symptom description, elapsed time, phone, address
    - Implement "Accept Case" button wired to `onUpdateEmergencyStatus`
    - Implement "Call Owner" as `tel:` link
    - Implement "View Details" button (expand/modal)
    - Render Empty State when no pending emergencies
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 4.3 Create the PatientsTab (Recent Patients + Search)
    - Create `src/components/vet-dashboard/tabs/PatientsTab.tsx`
    - Implement "Recent Patients" section: 5 most recent completed bookings sorted by date descending
    - Display: pet name, pet type icon, owner name, last visit date, service provided
    - Implement Patient_Search input: filter by pet name, owner name, or email (case-insensitive partial match, minimum 2 chars)
    - Show "No patients found" message when no results match
    - Clear search restores default view
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 4.4 Create the ScheduleTab with Mini Calendar
    - Create `src/components/vet-dashboard/tabs/ScheduleTab.tsx`
    - Implement Mini_Calendar widget showing current month with today highlighted
    - Show dot indicators on dates with bookings
    - Clicking a date filters the schedule to that date's bookings
    - Include fallback tooltip/title attribute on dates when dot fails to render
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 5. Checkpoint - Ensure all core tabs render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement secondary features and remaining tabs
  - [x] 6.1 Create Quick Clinical Actions section
    - Create `src/components/vet-dashboard/shared/QuickActions.tsx`
    - Implement 5 action buttons: "Create Prescription", "Upload Report", "Add Notes", "Schedule Follow-up", "Issue Vaccination Certificate"
    - Each button has a Lucide icon and text label
    - Clicking opens a modal dialog or navigates to the workflow form
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 6.2 Create Notifications Panel
    - Create `src/components/vet-dashboard/shared/NotificationsPanel.tsx`
    - Display recent system events: new bookings, emergency alerts, follow-up reminders, lab reports, new reviews
    - Each notification shows: event type icon, brief description, relative timestamp
    - Max 8 items, most recent first
    - Show "All caught up" with checkmark when empty
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 6.3 Create Messages Preview section
    - Create `src/components/vet-dashboard/shared/MessagesPreview.tsx`
    - Display 3 most recent conversation snippets with: sender name, truncated preview (max 80 chars), relative timestamp
    - Clicking navigates to full messages view
    - Render Empty State with envelope illustration when no messages
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 6.4 Create ReviewsTab, ProfileTab, CredentialsTab, SecurityTab, PrescriptionsTab stubs
    - Create `src/components/vet-dashboard/tabs/ReviewsTab.tsx` — port existing reviews rendering with clinic reviews data
    - Create `src/components/vet-dashboard/tabs/ProfileTab.tsx` — port existing profile view
    - Create `src/components/vet-dashboard/tabs/CredentialsTab.tsx` — port existing credentials/document list (always accessible)
    - Create `src/components/vet-dashboard/tabs/SecurityTab.tsx` — port existing security settings
    - Create `src/components/vet-dashboard/tabs/PrescriptionsTab.tsx` — port existing prescriptions view
    - _Requirements: 12.3, 14.1_

- [x] 7. Implement micro-animations and visual polish
  - [x] 7.1 Add hover/focus transitions and entrance animations
    - Add subtle scale/shadow transitions on hover/focus for cards and interactive elements (max 250ms duration)
    - Add fade-in entrance animations for sections loading data using the `motion` library (framer-motion)
    - Add fade/slide transitions on navigation tab switches (max 250ms)
    - Respect `prefers-reduced-motion` media query to avoid animations for vestibular-sensitive users
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 7.2 Apply visual design system consistency pass
    - Ensure all cards use rounded corners (min 12px border-radius), soft box shadows, white backgrounds
    - Ensure QuickVet brand palette (#58B368, #2F855A, #BFE7C4, #F4FBF3) is applied to accents, active states, interactive elements
    - Ensure light neutral background (#F9FAFB) for page surface
    - Ensure consistent Lucide icon sizing and stroke width across all sections
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 8. Wire everything together and replace the old component
  - [x] 8.1 Create barrel exports and integrate with App.tsx
    - Create `src/components/vet-dashboard/index.ts` exporting the `VetDashboardLayout` as default
    - Update import in `src/App.tsx` (or wherever VetDashboard is consumed) to use the new `VetDashboardLayout` component
    - Ensure all props passed from App.tsx match the `VetDashboardLayoutProps` interface
    - Verify the old `VetDashboard.tsx` is no longer imported (keep the file for rollback reference but remove the import)
    - _Requirements: 1.1, 1.2, 2.1, 3.1_

  - [ ]* 8.2 Write integration tests for dashboard initialization
    - Test VetDashboardLayout renders Hero Section with correct greeting and clinic info
    - Test navigation tabs render and switch active view on click
    - Test verification gating (non-approved vet only sees credentials)
    - Test action card counts reflect current data
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 12.1, 12.2_

  - [ ]* 8.3 Write unit tests for useVetDashboard hook
    - Test clinic derivation returns correct clinic for clinicId
    - Test booking filtering only returns bookings for the vet's clinic
    - Test patient deduplication with duplicate (email, petName) entries
    - Test analytics fallback returns local metrics when API unavailable
    - Test `updateBooking` sets and resets loadingId correctly
    - _Requirements: 4.1, 5.1, 6.1, 7.2_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The old `VetDashboard.tsx` is kept in place for rollback but is no longer imported after task 8.1
- All new components use TypeScript with strict typing from the shared types file
- Lazy loading via `React.lazy()` ensures the initial bundle stays small
- The `motion` library (already a dependency) handles all animations

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1", "3.2"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 5, "tasks": ["7.1", "7.2"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3"] }
  ]
}
```
