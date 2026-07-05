# Requirements Document

## Introduction

Redesign the Veterinarian Portal Dashboard (VetDashboard.tsx) from a metrics-heavy admin panel into a production-ready clinical workspace. The new dashboard prioritizes actionable clinical workflows—today's appointments, emergency triage, patient management, and quick clinical actions—over passive analytics. The design draws inspiration from modern healthcare platforms (Practo, Cliniko, SimplePractice) while maintaining QuickVet brand identity.

## Glossary

- **Dashboard**: The VetDashboard React component rendered for authenticated veterinarian users
- **Vet_User**: A user with role "veterinarian" authenticated in the system (typed as User with role='veterinarian')
- **Hero_Section**: The personalized welcome area at the top of the Dashboard displaying greeting, clinic info, and summary statistics
- **Appointment_Card**: A visual row or card representing a single booking in today's schedule
- **Emergency_Card**: A priority-sorted card representing a pending emergency request requiring vet action
- **Action_Card**: A compact summary tile showing a count and linking to a primary workflow area
- **Patient_Search**: A universal search input allowing lookup by pet name, owner name, phone number, or record ID
- **Clinical_Action**: A shortcut button triggering a clinical workflow (prescription, notes, certificate, report, follow-up)
- **Notification_Item**: A single notification entry representing a system event (booking, emergency, follow-up, lab report, review)
- **Mini_Calendar**: A compact calendar widget displaying today's date and upcoming appointment indicators
- **Message_Preview**: A conversation snippet showing the latest message from a pet owner or staff member
- **Empty_State**: A placeholder UI displayed when a section has no data, featuring an illustration and call-to-action
- **Verification_Badge**: A compact inline indicator showing the vet's verification status (approved, pending, etc.)

## Requirements

### Requirement 1: Personalized Hero Section

**User Story:** As a veterinarian, I want to see a personalized greeting with my clinic context and today's key metrics at a glance, so that I can quickly orient myself when opening the dashboard.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Hero_Section SHALL display a time-appropriate greeting ("Good Morning", "Good Afternoon", or "Good Evening") followed by "Dr. {Vet_User.name}"
2. WHEN the Dashboard loads, THE Hero_Section SHALL display the clinic name from the first matching clinic in the clinics array where clinicId equals Vet_User.clinicId
3. WHEN the Vet_User has a verification status of "approved", THE Hero_Section SHALL display a compact Verification_Badge inline with the clinic name
4. THE Hero_Section SHALL display today's date formatted as a human-readable string (e.g., "Monday, 16 June 2025")
5. THE Hero_Section SHALL display four summary statistics: appointments today count, emergencies waiting count, follow-ups due count, and unread messages count
6. THE Hero_Section SHALL apply a subtle glassmorphism visual treatment (semi-transparent background with backdrop blur) exclusively to this section

### Requirement 2: Compact Navigation

**User Story:** As a veterinarian, I want quick access to all major areas of my workspace through a compact navigation bar, so that I can switch between workflows without scrolling.

#### Acceptance Criteria

1. THE Dashboard SHALL render a horizontal navigation bar containing tabs for: Dashboard, Appointments, Emergency Queue, Patients, Schedule, Reviews, and Settings
2. WHEN the Vet_User clicks a navigation tab, THE Dashboard SHALL switch the active view to the corresponding section and visually highlight the active tab
3. THE Dashboard navigation SHALL remain visible without scrolling when the user is at the top of the page
4. WHEN the Emergency Queue tab has pending emergencies (count greater than zero), THE Dashboard SHALL display a numeric badge on the Emergency Queue tab showing the exact count of pending emergencies; WHEN the count is zero, THE Dashboard SHALL NOT display a badge on the Emergency Queue tab

### Requirement 3: Action Cards Summary

**User Story:** As a veterinarian, I want to see a concise set of actionable metric cards instead of a dense KPI grid, so that I can immediately identify items requiring attention.

#### Acceptance Criteria

1. THE Dashboard SHALL display exactly four Action_Cards: "Today's Appointments", "Active Emergencies", "Unread Messages", and "Follow-ups Due"
2. WHEN an Action_Card count is greater than zero, THE Dashboard SHALL immediately render the Action_Card with QuickVet green accent styling to indicate active items; WHEN the count transitions from zero to non-zero during the session, THE styling SHALL update immediately without requiring a page refresh
3. WHEN an Action_Card count is zero, THE Dashboard SHALL render the Action_Card in a muted neutral style; IF the styling system fails to apply correct styling, THE Dashboard SHALL force muted styling or hide the affected Action_Card entirely to prevent displaying green styling for zero counts
4. WHEN the Vet_User clicks an Action_Card, THE Dashboard SHALL navigate or scroll to the corresponding detail section

### Requirement 4: Today's Schedule

**User Story:** As a veterinarian, I want to view today's appointments in a professional agenda format with patient details and inline actions, so that I can manage my daily workflow efficiently.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Today's Schedule" section listing all bookings where the booking date matches today's date, sorted by appointment time in ascending order
2. FOR EACH Appointment_Card, THE Dashboard SHALL display: appointment time, pet photo placeholder (species-based icon), pet name, owner name, species/breed, visit type (service field), and booking status
3. WHEN a booking has status "approved", THE Appointment_Card SHALL display action buttons: "Start Consultation" and "Reschedule"
4. WHEN a booking has status "pending", THE Appointment_Card SHALL display action buttons: "Approve" and "Cancel"
5. WHEN a booking has status "completed", THE Appointment_Card SHALL display the status as a read-only badge with no action buttons
6. WHEN the Vet_User clicks "Start Consultation", THE Dashboard SHALL invoke onUpdateBookingStatus with the booking ID and status "completed"
7. WHEN the Vet_User clicks "Approve", THE Dashboard SHALL invoke onUpdateBookingStatus with the booking ID and status "approved"
8. WHEN the Vet_User clicks "Cancel", THE Dashboard SHALL invoke onUpdateBookingStatus with the booking ID and status "cancelled"
9. WHEN no bookings exist for today, THE Dashboard SHALL render an Empty_State with an illustration and a call-to-action to view the full schedule

### Requirement 5: Emergency Queue

**User Story:** As a veterinarian, I want to see pending emergency cases sorted by priority with patient details and triage actions, so that I can quickly respond to urgent cases.

#### Acceptance Criteria

1. THE Dashboard SHALL display an "Emergency Queue" section listing all emergency requests with status "pending" or "notified", sorted by createdAt in ascending order (oldest first, indicating longest wait)
2. FOR EACH Emergency_Card, THE Dashboard SHALL display: pet name, pet type, owner name, symptom description, time elapsed since the emergency was created, owner phone number, and owner address
3. WHEN an Emergency_Card is displayed, THE Dashboard SHALL show action buttons: "Accept Case", "View Details", and "Call Owner"
4. WHEN the Vet_User clicks "Accept Case", THE Dashboard SHALL invoke onUpdateEmergencyStatus with the emergency ID, status "accepted", the vet's clinic ID, and the vet's clinic name
5. WHEN the Vet_User clicks "Call Owner", THE Dashboard SHALL open the device's phone dialer with the emergency request phone number pre-filled (tel: link)
6. WHEN no pending emergencies exist, THE Dashboard SHALL render an Empty_State indicating no active emergencies with a calming illustration

### Requirement 6: Recent Patients

**User Story:** As a veterinarian, I want quick access to recently seen patients with their visit summaries, so that I can follow up on cases without navigating away from the dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Recent Patients" section listing the five most recently completed bookings, sorted by date descending
2. FOR EACH recent patient entry, THE Dashboard SHALL display: pet name, pet type icon, owner name, last visit date, and the service provided during that visit
3. WHEN the Vet_User clicks a recent patient entry, THE Dashboard SHALL open the patient detail view or highlight the patient in the Patients section

### Requirement 7: Universal Patient Search

**User Story:** As a veterinarian, I want to search for any patient by pet name, owner name, phone number, or record ID, so that I can quickly access patient information during consultations.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Patient_Search input field in a prominent, accessible location within the dashboard layout
2. WHEN the Vet_User types a query of two or more characters into Patient_Search, THE Dashboard SHALL filter and display matching results from the bookings data by pet name, owner name, or owner email (case-insensitive partial match)
3. WHEN no results match the search query, THE Patient_Search SHALL display a "No patients found" message with a suggestion to check the spelling
4. WHEN the Vet_User clears the Patient_Search input, THE Dashboard SHALL hide the search results and restore the default view

### Requirement 8: Quick Clinical Actions

**User Story:** As a veterinarian, I want shortcut buttons for common clinical workflows, so that I can initiate prescriptions, notes, and certificates without navigating through multiple menus.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Quick Actions" section containing five Clinical_Action buttons: "Create Prescription", "Upload Report", "Add Notes", "Schedule Follow-up", and "Issue Vaccination Certificate"
2. WHEN the Vet_User clicks a Clinical_Action button, THE Dashboard SHALL open a modal dialog or navigate to the corresponding workflow form
3. FOR EACH Clinical_Action button, THE Dashboard SHALL display an icon (from Lucide icon set) and a text label

### Requirement 9: Notifications Panel

**User Story:** As a veterinarian, I want a compact notifications panel showing recent system events, so that I can stay informed about new bookings, emergencies, and follow-ups without leaving the dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Notifications" section listing recent system events categorized as: new bookings, emergency alerts, follow-up reminders, lab report arrivals, and new reviews
2. FOR EACH Notification_Item, THE Dashboard SHALL display: an event type icon, a brief description, and a relative timestamp (e.g., "5 min ago", "1 hour ago")
3. WHEN no notifications exist, THE Dashboard SHALL display a Notification_Item placeholder stating "All caught up" with a checkmark icon
4. THE Notifications section SHALL display a maximum of eight Notification_Items, with the most recent items shown first

### Requirement 10: Mini Calendar

**User Story:** As a veterinarian, I want a compact calendar showing today's date and upcoming appointment indicators, so that I can glance at my weekly schedule context.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Mini_Calendar widget showing the current month with today's date visually highlighted
2. WHEN a calendar date has one or more bookings, THE Mini_Calendar SHALL display a dot indicator on that date; IF the dot indicator fails to render, THE Mini_Calendar SHALL provide a fallback mechanism such as a title/tooltip attribute on the date cell indicating the number of appointments
3. WHEN the Vet_User clicks a date on the Mini_Calendar, THE Dashboard SHALL filter the Today's Schedule section to show bookings for the selected date

### Requirement 11: Messages Preview

**User Story:** As a veterinarian, I want to see recent message snippets from pet owners, so that I can quickly identify and respond to important communications.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Messages" section showing the three most recent conversation snippets
2. FOR EACH Message_Preview, THE Dashboard SHALL display: sender name, a truncated message preview (maximum 80 characters), and a relative timestamp
3. WHEN the Vet_User clicks a Message_Preview, THE Dashboard SHALL navigate to the full messages view
4. WHEN no messages exist, THE Dashboard SHALL render an Empty_State indicating no messages with an envelope illustration

### Requirement 12: Verification Badge Display

**User Story:** As a veterinarian, I want my verification status shown as a compact inline badge rather than a large banner, so that it does not consume valuable dashboard real estate.

#### Acceptance Criteria

1. WHEN the Vet_User has verification status "approved", THE Dashboard SHALL display a small green Verification_Badge with a checkmark icon and "Verified" text inline with the Hero_Section
2. WHEN the Vet_User has verification status "pending", THE Dashboard SHALL display a small amber Verification_Badge with "Pending" text inline with the Hero_Section
3. WHEN the Vet_User has verification status "rejected" or "suspended", THE Dashboard SHALL display a small red Verification_Badge with the status text and a link to the credentials section
4. THE Verification_Badge SHALL occupy no more than one line of text height and SHALL NOT render as a full-width banner

### Requirement 13: Premium Empty States

**User Story:** As a veterinarian, I want visually polished empty states with helpful illustrations and calls to action, so that the dashboard feels complete and guides me even when sections have no data.

#### Acceptance Criteria

1. WHEN any dashboard section (Today's Schedule, Emergency Queue, Recent Patients, Messages, Notifications) has no data to display, THE Dashboard SHALL render an Empty_State component
2. FOR EACH Empty_State, THE Dashboard SHALL display: a relevant illustration or icon composition, a friendly descriptive message, and a primary call-to-action button where applicable
3. THE Empty_State illustration SHALL use QuickVet brand colors (#58B368, #2F855A, #BFE7C4, #F4FBF3) and maintain visual consistency across all sections

### Requirement 14: Visual Design System

**User Story:** As a veterinarian, I want the dashboard to have a premium, modern appearance with consistent visual hierarchy, so that the workspace feels professional and pleasant to use daily.

#### Acceptance Criteria

1. THE Dashboard SHALL use layered card containers with rounded corners (minimum border-radius of 12px), soft box shadows, and white backgrounds for each section
2. THE Dashboard SHALL apply QuickVet brand color palette (#58B368 primary, #2F855A dark, #BFE7C4 light, #F4FBF3 surface) for accents, active states, and interactive elements
3. THE Dashboard SHALL limit glassmorphism effects (backdrop-blur with semi-transparent backgrounds) exclusively to the Hero_Section
4. THE Dashboard SHALL use the Lucide icon library for all iconography, maintaining consistent icon sizing and stroke width across sections
5. THE Dashboard SHALL render on a light neutral background (#F9FAFB or equivalent) to provide contrast with white card surfaces

### Requirement 15: Micro-Animations

**User Story:** As a veterinarian, I want subtle animations on interactions and transitions, so that the dashboard feels responsive and polished without being distracting.

#### Acceptance Criteria

1. WHEN a card or interactive element receives hover or focus, THE Dashboard SHALL apply a subtle scale or shadow transition with a duration not exceeding 250 milliseconds
2. WHEN a section loads data, THE Dashboard SHALL apply a fade-in entrance animation with a duration not exceeding 250 milliseconds using the motion library (framer-motion)
3. WHEN the Vet_User switches navigation tabs, THE Dashboard SHALL animate the content transition using a fade or slide effect with a duration not exceeding 250 milliseconds
4. THE Dashboard SHALL NOT apply animation to elements that are already visible and static, to avoid unnecessary motion for users with vestibular sensitivities
