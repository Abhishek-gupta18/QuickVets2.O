/**
 * Temporal Workflow Definitions for QuickVet Vaccination System
 * 
 * These workflows are designed to be registered with a Temporal Worker.
 * They orchestrate the entire vaccination appointment lifecycle using
 * durable timers instead of cron jobs.
 * 
 * Prerequisites:
 * - Temporal Server running (self-hosted or Temporal Cloud)
 * - Temporal Worker process running with these workflows registered
 * - @temporalio/workflow and @temporalio/activity packages installed
 * 
 * To set up:
 * 1. npm install @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
 * 2. Start Temporal server: temporal server start-dev
 * 3. Start worker: npx ts-node src/server/temporal-worker.ts
 */

// ============================================================
// WORKFLOW: VaccinationAppointmentWorkflow
// Orchestrates the complete lifecycle of a vaccination appointment
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
  scheduledDate: string; // ISO date
  scheduledTime: string;
  boosterIntervalDays?: number; // e.g., 365 for annual, 1095 for 3-year
}

export interface BoosterReminderInput {
  appointmentId: string;
  petName: string;
  ownerEmail: string;
  ownerName: string;
  vaccineName: string;
  boosterDate: string; // ISO date
  clinicName: string;
  clinicId: string;
}

/**
 * VaccinationAppointmentWorkflow
 * 
 * Timeline:
 * 1. Appointment created → Send confirmation
 * 2. Wait until 24h before → Send reminder
 * 3. Wait until 2h before → Send final reminder
 * 4. Wait until appointment time → Check status
 * 5. If completed → Record vaccine, schedule booster, generate certificate
 * 6. If missed → Notify owner to reschedule
 * 7. If cancelled → End workflow gracefully
 */
export const VACCINATION_APPOINTMENT_WORKFLOW = 'VaccinationAppointmentWorkflow';
export const BOOSTER_REMINDER_WORKFLOW = 'BoosterReminderWorkflow';
export const AI_REPORT_ANALYSIS_WORKFLOW = 'AIReportAnalysisWorkflow';

// Activity function signatures (implemented in temporal-activities.ts)
export const ACTIVITIES = {
  sendConfirmationNotification: 'sendConfirmationNotification',
  sendReminderNotification: 'sendReminderNotification',
  sendFinalReminderNotification: 'sendFinalReminderNotification',
  checkAppointmentStatus: 'checkAppointmentStatus',
  markVaccineAdministered: 'markVaccineAdministered',
  updatePetVaccinationHistory: 'updatePetVaccinationHistory',
  calculateNextBoosterDate: 'calculateNextBoosterDate',
  generateVaccinationCertificate: 'generateVaccinationCertificate',
  notifyOwnerCompleted: 'notifyOwnerCompleted',
  markAppointmentMissed: 'markAppointmentMissed',
  notifyOwnerToReschedule: 'notifyOwnerToReschedule',
  sendBoosterDueReminder: 'sendBoosterDueReminder',
  sendBoosterDueEmail: 'sendBoosterDueEmail',
  createBoosterDashboardNotification: 'createBoosterDashboardNotification',
  // AI Report activities
  uploadReportFile: 'uploadReportFile',
  extractTextOCR: 'extractTextOCR',
  callAIModel: 'callAIModel',
  generateHealthSummary: 'generateHealthSummary',
  generateMedicationSuggestions: 'generateMedicationSuggestions',
  generateDietRecommendations: 'generateDietRecommendations',
  storeAnalysis: 'storeAnalysis',
  notifyOwnerReportReady: 'notifyOwnerReportReady',
};

/**
 * Workflow pseudocode (for implementation with @temporalio/workflow):
 * 
 * async function VaccinationAppointmentWorkflow(input: VaccinationWorkflowInput) {
 *   // Step 1: Send confirmation
 *   await activities.sendConfirmationNotification(input);
 *   
 *   // Step 2: Calculate wait times
 *   const appointmentTime = new Date(`${input.scheduledDate}T${input.scheduledTime}`);
 *   const now = new Date();
 *   const msUntil24hBefore = appointmentTime.getTime() - 24*60*60*1000 - now.getTime();
 *   const msUntil2hBefore = appointmentTime.getTime() - 2*60*60*1000 - now.getTime();
 *   const msUntilAppointment = appointmentTime.getTime() - now.getTime();
 *   
 *   // Step 3: Wait and send 24h reminder (durable timer - survives restarts)
 *   if (msUntil24hBefore > 0) {
 *     await sleep(msUntil24hBefore); // Temporal durable timer
 *     await activities.sendReminderNotification(input);
 *   }
 *   
 *   // Step 4: Wait and send 2h reminder
 *   if (msUntil2hBefore > 0) {
 *     await sleep(msUntil2hBefore - msUntil24hBefore);
 *     await activities.sendFinalReminderNotification(input);
 *   }
 *   
 *   // Step 5: Wait until appointment time + 1 hour buffer
 *   await sleep(msUntilAppointment + 60*60*1000);
 *   
 *   // Step 6: Check status
 *   const status = await activities.checkAppointmentStatus(input.appointmentId);
 *   
 *   if (status === 'completed') {
 *     await activities.markVaccineAdministered(input);
 *     await activities.updatePetVaccinationHistory(input);
 *     const boosterDate = await activities.calculateNextBoosterDate(input);
 *     await activities.generateVaccinationCertificate(input);
 *     await activities.notifyOwnerCompleted(input);
 *     
 *     // Schedule booster reminder as a child workflow
 *     if (boosterDate && input.boosterIntervalDays) {
 *       await startChild(BoosterReminderWorkflow, {
 *         args: [{ ...input, boosterDate }],
 *         workflowId: `booster-${input.appointmentId}`,
 *       });
 *     }
 *   } else if (status === 'missed' || status === 'scheduled') {
 *     await activities.markAppointmentMissed(input);
 *     await activities.notifyOwnerToReschedule(input);
 *   }
 *   // If cancelled, workflow ends naturally (cancelled via signal)
 * }
 * 
 * async function BoosterReminderWorkflow(input: BoosterReminderInput) {
 *   const boosterTime = new Date(input.boosterDate);
 *   const now = new Date();
 *   const msUntil2WeeksBefore = boosterTime.getTime() - 14*24*60*60*1000 - now.getTime();
 *   const msUntil3DaysBefore = boosterTime.getTime() - 3*24*60*60*1000 - now.getTime();
 *   
 *   // Durable timer: wait months/years until booster is due
 *   if (msUntil2WeeksBefore > 0) {
 *     await sleep(msUntil2WeeksBefore);
 *     await activities.sendBoosterDueReminder(input);
 *   }
 *   
 *   if (msUntil3DaysBefore > 0) {
 *     await sleep(msUntil3DaysBefore - msUntil2WeeksBefore);
 *     await activities.sendBoosterDueEmail(input);
 *     await activities.createBoosterDashboardNotification(input);
 *   }
 * }
 */

export default {
  VACCINATION_APPOINTMENT_WORKFLOW,
  BOOSTER_REMINDER_WORKFLOW,
  AI_REPORT_ANALYSIS_WORKFLOW,
  ACTIVITIES,
};
