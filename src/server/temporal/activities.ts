/**
 * Temporal Activities for QuickVet Vaccination System
 *
 * Activities are the building blocks that workflows call.
 * They handle all side effects: database writes, notifications, external APIs.
 * Temporal automatically retries failed activities based on the retry policy.
 */
import 'dotenv/config';

// ============================================================
// TYPES
// ============================================================
export interface AppointmentContext {
  appointmentId: string;
  petName: string;
  petType: string;
  ownerEmail: string;
  ownerName: string;
  clinicName: string;
  clinicId: string;
  vaccineName: string;
  scheduledDate: string;
  scheduledTime: string;
  boosterIntervalDays?: number;
}

export interface BoosterContext {
  appointmentId: string;
  petName: string;
  ownerEmail: string;
  ownerName: string;
  vaccineName: string;
  boosterDate: string;
  clinicName: string;
  clinicId: string;
}

// ============================================================
// In-memory notification store (replace with real DB/email in production)
// ============================================================
const notifications: Array<{ type: string; to: string; message: string; sentAt: string }> = [];

export function getNotifications() {
  return notifications;
}

// ============================================================
// ACTIVITY: Send Confirmation Notification
// ============================================================
export async function sendConfirmationNotification(ctx: AppointmentContext): Promise<void> {
  console.log(`[Temporal Activity] 📧 Sending confirmation to ${ctx.ownerEmail} for ${ctx.vaccineName} appointment`);
  notifications.push({
    type: 'confirmation',
    to: ctx.ownerEmail,
    message: `Your ${ctx.vaccineName} vaccination for ${ctx.petName} is confirmed at ${ctx.clinicName} on ${ctx.scheduledDate} at ${ctx.scheduledTime}.`,
    sentAt: new Date().toISOString(),
  });
  // In production: Send email via SendGrid/SES, push notification, etc.
}

// ============================================================
// ACTIVITY: Send 24-hour Reminder
// ============================================================
export async function sendReminderNotification(ctx: AppointmentContext): Promise<void> {
  console.log(`[Temporal Activity] ⏰ 24h reminder to ${ctx.ownerEmail} for ${ctx.vaccineName}`);
  notifications.push({
    type: 'reminder_24h',
    to: ctx.ownerEmail,
    message: `Reminder: ${ctx.petName}'s ${ctx.vaccineName} vaccination is tomorrow at ${ctx.scheduledTime} at ${ctx.clinicName}. Don't forget!`,
    sentAt: new Date().toISOString(),
  });
}

// ============================================================
// ACTIVITY: Send 2-hour Final Reminder
// ============================================================
export async function sendFinalReminderNotification(ctx: AppointmentContext): Promise<void> {
  console.log(`[Temporal Activity] 🚨 2h final reminder to ${ctx.ownerEmail} for ${ctx.vaccineName}`);
  notifications.push({
    type: 'reminder_2h',
    to: ctx.ownerEmail,
    message: `${ctx.petName}'s ${ctx.vaccineName} appointment at ${ctx.clinicName} is in 2 hours! Please head to the clinic.`,
    sentAt: new Date().toISOString(),
  });
}

// ============================================================
// ACTIVITY: Check Appointment Status from DB
// ============================================================
export async function checkAppointmentStatus(appointmentId: string): Promise<string> {
  console.log(`[Temporal Activity] 🔍 Checking status for appointment ${appointmentId}`);
  // In production: Query your database for the current status
  // For demo: return 'completed' to show the full workflow path
  // The server API updates status when vet marks it done
  
  // Simulated: fetch from the in-memory store via HTTP
  try {
    const apiBase = process.env.APP_URL || 'http://localhost:5000';
    const res = await fetch(`${apiBase}/api/vaccinations/appointments`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const appointments = await res.json();
      const appt = appointments.find((a: any) => a.id === appointmentId);
      return appt?.status || 'scheduled';
    }
  } catch (err) {
    console.error('Failed to check appointment status:', err);
  }
  return 'scheduled';
}

// ============================================================
// ACTIVITY: Mark Vaccine as Administered
// ============================================================
export async function markVaccineAdministered(ctx: AppointmentContext): Promise<void> {
  console.log(`[Temporal Activity] ✅ Marking ${ctx.vaccineName} as administered for ${ctx.petName}`);
  // In production: Update appointment status in DB to 'completed'
}

// ============================================================
// ACTIVITY: Update Pet Vaccination History
// ============================================================
export async function updatePetVaccinationHistory(ctx: AppointmentContext): Promise<void> {
  console.log(`[Temporal Activity] 📋 Updating vaccination history for ${ctx.petName} - ${ctx.vaccineName}`);
  // In production: Insert into vaccination_records table
}

// ============================================================
// ACTIVITY: Calculate Next Booster Date
// ============================================================
export async function calculateNextBoosterDate(ctx: AppointmentContext): Promise<string | null> {
  if (!ctx.boosterIntervalDays) return null;
  const appointmentDate = new Date(ctx.scheduledDate);
  appointmentDate.setDate(appointmentDate.getDate() + ctx.boosterIntervalDays);
  const boosterDate = appointmentDate.toISOString().split('T')[0];
  console.log(`[Temporal Activity] 📅 Next booster for ${ctx.vaccineName}: ${boosterDate} (in ${ctx.boosterIntervalDays} days)`);
  return boosterDate;
}

// ============================================================
// ACTIVITY: Generate Vaccination Certificate
// ============================================================
export async function generateVaccinationCertificate(ctx: AppointmentContext): Promise<string> {
  console.log(`[Temporal Activity] 📜 Generating certificate for ${ctx.petName} - ${ctx.vaccineName}`);
  // In production: Generate PDF certificate, upload to Cloudinary, return URL
  const certId = `cert-${ctx.appointmentId}-${Date.now()}`;
  return `https://quickvet.app/certificates/${certId}`;
}

// ============================================================
// ACTIVITY: Notify Owner - Vaccination Completed
// ============================================================
export async function notifyOwnerCompleted(ctx: AppointmentContext): Promise<void> {
  console.log(`[Temporal Activity] 🎉 Notifying ${ctx.ownerEmail} - vaccination completed`);
  notifications.push({
    type: 'completed',
    to: ctx.ownerEmail,
    message: `Great news! ${ctx.petName}'s ${ctx.vaccineName} vaccination is complete. Certificate is ready for download.`,
    sentAt: new Date().toISOString(),
  });
}

// ============================================================
// ACTIVITY: Mark Appointment as Missed
// ============================================================
export async function markAppointmentMissed(ctx: AppointmentContext): Promise<void> {
  console.log(`[Temporal Activity] ❌ Marking appointment ${ctx.appointmentId} as missed`);
  // In production: Update DB status to 'missed'
}

// ============================================================
// ACTIVITY: Notify Owner to Reschedule
// ============================================================
export async function notifyOwnerToReschedule(ctx: AppointmentContext): Promise<void> {
  console.log(`[Temporal Activity] 📧 Asking ${ctx.ownerEmail} to reschedule missed appointment`);
  notifications.push({
    type: 'missed_reschedule',
    to: ctx.ownerEmail,
    message: `It looks like ${ctx.petName} missed the ${ctx.vaccineName} appointment. Please reschedule to keep your pet protected.`,
    sentAt: new Date().toISOString(),
  });
}

// ============================================================
// BOOSTER ACTIVITIES
// ============================================================
export async function sendBoosterDueReminder(ctx: BoosterContext): Promise<void> {
  console.log(`[Temporal Activity] 💉 Booster due reminder: ${ctx.vaccineName} for ${ctx.petName}`);
  notifications.push({
    type: 'booster_due',
    to: ctx.ownerEmail,
    message: `${ctx.petName}'s ${ctx.vaccineName} booster is due on ${ctx.boosterDate}. Book an appointment at ${ctx.clinicName} to stay protected.`,
    sentAt: new Date().toISOString(),
  });
}

export async function sendBoosterDueEmail(ctx: BoosterContext): Promise<void> {
  console.log(`[Temporal Activity] 📬 Booster email sent to ${ctx.ownerEmail}`);
  // In production: Send email
}

export async function createBoosterDashboardNotification(ctx: BoosterContext): Promise<void> {
  console.log(`[Temporal Activity] 🔔 Dashboard notification created for booster: ${ctx.vaccineName}`);
  notifications.push({
    type: 'booster_dashboard',
    to: ctx.ownerEmail,
    message: `Booster due: ${ctx.vaccineName} for ${ctx.petName} on ${ctx.boosterDate}`,
    sentAt: new Date().toISOString(),
  });
}
