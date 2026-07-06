/**
 * Temporal Worker for QuickVet
 *
 * This is a separate process that polls the Temporal server for work
 * and executes workflows and activities.
 *
 * Run with: npm run temporal:worker
 * Or: npx tsx src/server/temporal/worker.ts
 *
 * Prerequisites:
 * 1. Temporal server must be running:
 *    - Local dev: `temporal server start-dev` (downloads & runs automatically)
 *    - Docker: `docker-compose up` (see temporal docker-compose)
 *    - Cloud: Configure TEMPORAL_ADDRESS with your Temporal Cloud endpoint
 *
 * 2. Environment variables set in .env:
 *    - TEMPORAL_ADDRESS (default: localhost:7233)
 *    - TEMPORAL_NAMESPACE (default: default)
 *    - TEMPORAL_TASK_QUEUE (default: quickvet-vaccinations)
 */
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default';
const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'quickvet-vaccinations';

async function run() {
  console.log('🔄 Starting QuickVet Temporal Worker...');
  console.log(`   Address: ${TEMPORAL_ADDRESS}`);
  console.log(`   Namespace: ${TEMPORAL_NAMESPACE}`);
  console.log(`   Task Queue: ${TASK_QUEUE}`);

  // Connect to Temporal server
  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS,
  });

  // Create worker that handles both workflows and activities
  const worker = await Worker.create({
    connection,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: TASK_QUEUE,
    // Workflows are loaded from the compiled workflow file
    workflowsPath: fileURLToPath(new URL('./workflows.ts', import.meta.url)),
    // Activities are passed directly (they have side effects, so not sandboxed)
    activities,
  });

  console.log('✅ Temporal Worker started successfully!');
  console.log('   Listening for vaccination workflow tasks...\n');

  // Start polling — this blocks until the worker is shut down
  await worker.run();
}

run().catch((err) => {
  console.error('❌ Temporal Worker failed to start:', err);
  console.error('\n💡 Make sure Temporal server is running:');
  console.error('   npx @temporalio/create --sample empty  (first time setup)');
  console.error('   temporal server start-dev              (start local server)');
  console.error('   Then run: npm run temporal:worker\n');
  process.exit(1);
});
