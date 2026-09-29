const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const serverDir = path.join(rootDir, 'app-seguimiento', 'server');
const clientDir = path.join(rootDir, 'app-seguimiento-cliente', 'client');

console.log('🚀 Arrancando Servidor y Cliente...\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Arrancar Servidor (node server.js)
const serverProcess = spawn('node', ['server.js'], {
  cwd: serverDir,
  stdio: 'pipe'
});

// Arrancar Cliente (npm run dev)
const clientProcess = isWin
  ? spawn('cmd.exe', ['/c', 'npm run dev'], { cwd: clientDir, stdio: 'pipe' })
  : spawn('npm', ['run', 'dev'], { cwd: clientDir, stdio: 'pipe' });

function handleLogs(childProcess, prefix) {
  childProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.log(`[${prefix}] ${line}`);
    });
  });

  childProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.error(`[${prefix} ERROR] ${line}`);
    });
  });
}

handleLogs(serverProcess, 'SERVER');
handleLogs(clientProcess, 'CLIENT');

// Manejar la salida limpia con Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo servidor y cliente...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
});
