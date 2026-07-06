// Cross-platform delayed worker starter (CommonJS - works with ESM projects via .cjs extension)
// Waits 5 seconds for the Temporal server to be ready, then launches the worker
const { spawn } = require('child_process');

console.log('[worker-starter] Waiting 5 seconds for Temporal server to start...');

setTimeout(() => {
  console.log('[worker-starter] Starting Temporal worker...');
  const worker = spawn(process.execPath, [require.resolve('tsx/cli'), 'src/server/temporal/worker.ts'], {
    stdio: 'inherit',
    shell: false,
    cwd: process.cwd(),
  });

  worker.on('exit', (code) => {
    console.log(`[worker-starter] Worker exited with code ${code}`);
    process.exit(code ?? 0);
  });
}, 5000);
