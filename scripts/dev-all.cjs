const { spawn } = require('child_process');
const path = require('path');

function startProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    if (code !== 0 && options.exitOnError !== false) {
      process.exit(code ?? 0);
    }
  });

  return child;
}

function main() {
  const command = process.platform === 'win32' ? 'node.exe' : 'node';
  const server = startProcess(command, ['scripts/dev-server.cjs'], { exitOnError: true });
  const temporal = startProcess(command, ['scripts/start-temporal.cjs'], { exitOnError: false });
  const worker = startProcess(command, ['scripts/start-worker.cjs'], { exitOnError: false });

  const shutdown = (signal) => {
    [server, temporal, worker].forEach((child) => child && child.kill(signal));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
