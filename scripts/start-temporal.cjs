const { spawn } = require('child_process');
const path = require('path');
const { isPortAvailable } = require('./port-utils.cjs');

async function main() {
  const temporalPort = 7233;
  const temporalUiPort = 8233;

  if (!(await isPortAvailable(temporalPort, '127.0.0.1'))) {
    console.log(`[temporal] Port ${temporalPort} is already in use; skipping Temporal server startup.`);
    return;
  }

  const temporalExecutable = process.platform === 'win32' ? 'C:/temporal/temporal.exe' : 'temporal';
  const child = spawn(temporalExecutable, ['server', 'start-dev', '--ui-port', String(temporalUiPort)], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.exit(1);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error('[temporal] Failed to start Temporal server.', error);
  process.exit(1);
});
