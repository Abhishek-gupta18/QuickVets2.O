const net = require('net');

function isPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function getAvailablePort(startPort, host = '0.0.0.0') {
  let port = Number(startPort);

  if (!Number.isFinite(port) || port <= 0) {
    port = 3000;
  }

  let current = port;
  while (!(await isPortAvailable(current))) {
    current += 1;
  }

  return current;
}

module.exports = { isPortAvailable, getAvailablePort };
