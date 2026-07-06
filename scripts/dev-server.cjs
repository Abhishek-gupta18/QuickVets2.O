const { spawn } = require('child_process');
const path = require('path');
const { getAvailablePort } = require('./port-utils.cjs');

async function main() {
  const preferredPort = Number(process.env.PORT || 3000);
  const port = await getAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`[dev] Port ${preferredPort} is busy; using ${port} instead.`);
  }

  const child = spawn(process.execPath, [require.resolve('tsx/cli'), 'server.ts'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      VITE_API_URL: `http://localhost:${port}`,
      APP_URL: `http://localhost:${port}`,
    },
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

main().catch((error) => {
  console.error('[dev] Failed to start the development server.', error);
  process.exit(1);
});
