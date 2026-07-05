/**
 * Temporal Workflows for QuickVet Vaccination System
 *
 * Workflows are deterministic, durable functions that orchestrate activities.
 * They survive server restarts, crashes, and deployments.
 * Temporal replays the workflow history to restore state automatically.
 *
 * Key features used:
 * - Durable timers (sleep for hours/days/months — survives restarts)
 * - Activity invocation with retry policies
 * - Child workflows (booster reminders spawned from main workflow)
 * - Signals (for external cancellation)
 */
import {
  proxyActivities,
  sleep,
  defineSignal,
  setHandler,
  startChild,
  CancellationScope,
  isCancellation,
} from '@temporalio/workflow';

import type * as activities from './activities';

// Proxy all activities with retry policy
const {
  sendConfirmationNotification,
  sendReminderNotification,
  sendFinalReminderNotification,
  checkAppointmentStatus,
  markVaccineAdministered,
  updatePetVaccinationHistory,
  calculateNextBoosterDate,
  generateVaccinationCertificate,
  notifyOwnerCompleted,
  markAppointmentMissed,
  notifyOwnerToReschedule,
  sendBoosterDueReminder,
  sendBoosterDueEmail,
  createBoosterDashboardNotification,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumAttempts: 5,
    maximumInterval: '30 seconds',
  },
});

// ============================================================
// SIGNALS: External events that can modify workflow behavior
// ============================================================
export const cancelAppointmentSignal = defineSignal('cancelAppointment');
export const completeAppointmentSignal = defineSignal('completeAppointment');

// ============================================================
// WORKFLOW INPUT TYPES
// ============================================================
export interface VaccinationWorkflowInput {
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

export interface BoosterReminderInput {
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
// MAIN WORKFLOW: VaccinationAppointmentWorkflow
// ============================================================
export async function VaccinationAppointmentWorkflow(input: VaccinationWorkflowInput): Promise<string> {
  let isCancelled = false;
  let isCompleted = false;

  // Listen for cancellation signal (when user cancels appointment)
  setHandler(cancelAppointmentSignal, () => {
    isCancelled = true;
  });

  // Listen for early completion signal (vet marks as done)
  setHandler(completeAppointmentSignal, () => {
    isCompleted = true;
  });

  // Step 1: Send confirmation notification immediately
  await sendConfirmationNotification(input);

  // Step 2: Calculate durations until reminders
  const appointmentDateTime = parseDateTime(input.scheduledDate, input.scheduledTime);
  const now = Date.now();

  const msUntil24hBefore = appointmentDateTime - (24 * 60 * 60 * 1000) - now;
  const msUntil2hBefore = appointmentDateTime - (2 * 60 * 60 * 1000) - now;
  const msUntilAppointment = appointmentDateTime - now;

  // Step 3: Wait until 24 hours before (durable timer)
  if (msUntil24hBefore > 0 && !isCancelled && !isCompleted) {
    await sleep(msUntil24hBefore);
  }

  if (isCancelled) return 'cancelled';
  if (isCompleted) return await handleCompletion(input);

  // Step 4: Send 24-hour reminder
  await sendReminderNotification(input);

  // Step 5: Wait until 2 hours before
  const remainingUntil2h = Math.max(0, msUntil2hBefore - Math.max(0, msUntil24hBefore));
  if (remainingUntil2h > 0 && !isCancelled && !isCompleted) {
    await sleep(remainingUntil2h);
  }

  if (isCancelled) return 'cancelled';
  if (isCompleted) return await handleCompletion(input);

  // Step 6: Send final 2-hour reminder
  await sendFinalReminderNotification(input);

  // Step 7: Wait until appointment time + 1 hour grace period
  const remainingUntilAppt = Math.max(0, msUntilAppointment - Math.max(0, msUntil2hBefore));
  const gracePeriod = 60 * 60 * 1000; // 1 hour after appointment
  if (remainingUntilAppt + gracePeriod > 0 && !isCancelled && !isCompleted) {
    await sleep(remainingUntilAppt + gracePeriod);
  }

  if (isCancelled) return 'cancelled';
  if (isCompleted) return await handleCompletion(input);

  // Step 8: Check appointment status
  const status = await checkAppointmentStatus(input.appointmentId);

  if (status === 'completed') {
    return await handleCompletion(input);
  } else {
    // Missed appointment
    await markAppointmentMissed(input);
    await notifyOwnerToReschedule(input);
    return 'missed';
  }
}

// ============================================================
// HELPER: Handle successful vaccination completion
// ============================================================
async function handleCompletion(input: VaccinationWorkflowInput): Promise<string> {
  await markVaccineAdministered(input);
  await updatePetVaccinationHistory(input);

  const boosterDate = await calculateNextBoosterDate(input);
  await generateVaccinationCertificate(input);
  await notifyOwnerCompleted(input);

  // If there's a booster interval, schedule a child workflow for reminders
  if (boosterDate && input.boosterIntervalDays) {
    try {
      await startChild(BoosterReminderWorkflow, {
        workflowId: `booster-${input.appointmentId}-${Date.now()}`,
        args: [{
          appointmentId: input.appointmentId,
          petName: input.petName,
          ownerEmail: input.ownerEmail,
          ownerName: input.ownerName,
          vaccineName: input.vaccineName,
          boosterDate,
          clinicName: input.clinicName,
          clinicId: input.clinicId,
        }],
      });
    } catch (err) {
      // Non-fatal: booster reminder is a convenience feature
      console.log('Could not start booster reminder workflow:', err);
    }
  }

  return 'completed';
}

// ============================================================
// WORKFLOW: BoosterReminderWorkflow
// Long-running durable timer that waits months/years for booster due date
// ============================================================
export async function BoosterReminderWorkflow(input: BoosterReminderInput): Promise<string> {
  const boosterTime = new Date(input.boosterDate).getTime();
  const now = Date.now();

  // Wait until 2 weeks before booster is due
  const twoWeeksBefore = boosterTime - (14 * 24 * 60 * 60 * 1000);
  const msUntil2Weeks = twoWeeksBefore - now;

  if (msUntil2Weeks > 0) {
    // This is a DURABLE timer — it survives server restarts, deployments, crashes
    // Temporal persists this and wakes the workflow when the timer fires
    await sleep(msUntil2Weeks);
  }

  // Send 2-week reminder
  await sendBoosterDueReminder(input);

  // Wait until 3 days before
  const threeDaysBefore = boosterTime - (3 * 24 * 60 * 60 * 1000);
  const msUntil3Days = threeDaysBefore - Date.now();

  if (msUntil3Days > 0) {
    await sleep(msUntil3Days);
  }

  // Send final email + dashboard notification
  await sendBoosterDueEmail(input);
  await createBoosterDashboardNotification(input);

  return 'booster_reminders_sent';
}

// ============================================================
// HELPER: Parse date + time string into epoch ms
// ============================================================
function parseDateTime(dateStr: string, timeStr: string): number {
  // timeStr format: "09:00 AM" or "02:30 PM"
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  const dt = new Date(`${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
  return dt.getTime();
}
