/**
 * Temporal Client for QuickVet Server
 *
 * This module creates a Temporal client that the Express server uses to:
 * - Start new vaccination workflows when appointments are created
 * - Signal workflows (cancel, complete)
 * - Query workflow status
 *
 * The client connects to the Temporal server and is reused across requests.
 */
import 'dotenv/config';
import { Client, Connection } from '@temporalio/client';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default';
export const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'quickvet-vaccinations';

let temporalClient: Client | null = null;
let connectionPromise: Promise<Client | null> | null = null;

/**
 * Get or create the Temporal client (singleton).
 * Returns null if Temporal is unavailable (graceful degradation).
 */
export async function getTemporalClient(): Promise<Client | null> {
  if (temporalClient) return temporalClient;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      const connection = await Connection.connect({
        address: TEMPORAL_ADDRESS,
      });

      temporalClient = new Client({
        connection,
        namespace: TEMPORAL_NAMESPACE,
      });

      console.log(`✅ Temporal client connected (${TEMPORAL_ADDRESS})`);
      return temporalClient;
    } catch (err) {
      console.warn(`⚠️  Temporal unavailable at ${TEMPORAL_ADDRESS} — workflows disabled (app still works without it)`);
      return null;
    }
  })();

  return connectionPromise;
}

/**
 * Start a vaccination appointment workflow.
 * Returns the workflow ID or null if Temporal is unavailable.
 */
export async function startVaccinationWorkflow(input: {
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
}): Promise<string | null> {
  const client = await getTemporalClient();
  if (!client) return null;

  const workflowId = `vacc-wf-${input.appointmentId}`;

  try {
    await client.workflow.start('VaccinationAppointmentWorkflow', {
      workflowId,
      taskQueue: TASK_QUEUE,
      args: [input],
    });
    console.log(`[Temporal] Started workflow: ${workflowId}`);
    return workflowId;
  } catch (err: any) {
    console.error(`[Temporal] Failed to start workflow:`, err.message);
    return null;
  }
}

/**
 * Cancel a vaccination workflow (when user cancels appointment).
 */
export async function cancelVaccinationWorkflow(workflowId: string): Promise<boolean> {
  const client = await getTemporalClient();
  if (!client) return false;

  try {
    const handle = client.workflow.getHandle(workflowId);
    await handle.signal('cancelAppointment');
    console.log(`[Temporal] Cancelled workflow: ${workflowId}`);
    return true;
  } catch (err: any) {
    console.error(`[Temporal] Failed to cancel workflow:`, err.message);
    return false;
  }
}

/**
 * Signal a workflow that the appointment was completed early (by vet).
 */
export async function completeVaccinationWorkflow(workflowId: string): Promise<boolean> {
  const client = await getTemporalClient();
  if (!client) return false;

  try {
    const handle = client.workflow.getHandle(workflowId);
    await handle.signal('completeAppointment');
    console.log(`[Temporal] Signaled completion for workflow: ${workflowId}`);
    return true;
  } catch (err: any) {
    console.error(`[Temporal] Failed to signal workflow:`, err.message);
    return false;
  }
}

/**
 * Get workflow status/result.
 */
export async function getWorkflowStatus(workflowId: string): Promise<string | null> {
  const client = await getTemporalClient();
  if (!client) return null;

  try {
    const handle = client.workflow.getHandle(workflowId);
    const desc = await handle.describe();
    return desc.status.name;
  } catch (err: any) {
    return null;
  }
}
