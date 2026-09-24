const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLOUDFLARED_PATH = path.resolve(__dirname, '..', 'cloudflared.exe');
const URL_FILE = path.resolve(__dirname, 'data', 'live_tunnel_url.txt');

let tunnelProcess = null;
let currentUrl = null;
let isStopping = false;

function ensureDataDir() {
  const dataDir = path.resolve(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function startTunnel() {
  if (isStopping) return;

  ensureDataDir();
  console.log('[TUNNEL-SUPERVISOR] Starting Cloudflare Tunnel daemon...');

  tunnelProcess = spawn(CLOUDFLARED_PATH, ['tunnel', '--url', 'http://127.0.0.1:5000'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const handleOutput = (data) => {
    const text = data.toString();
    // Look for trycloudflare.com URL pattern
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      const url = match[0];
      if (url !== currentUrl) {
        currentUrl = url;
        fs.writeFileSync(URL_FILE, url, 'utf8');
        console.log('=======================================================');
        console.log(' [TUNNEL-SUPERVISOR] ACTIVE PUBLIC TOURNAMENT URL:');
        console.log(` ${url}`);
        console.log('=======================================================');
      }
    }
  };

  tunnelProcess.stdout.on('data', handleOutput);
  tunnelProcess.stderr.on('data', handleOutput);

  tunnelProcess.on('exit', (code, signal) => {
    console.warn(`[TUNNEL-SUPERVISOR] Tunnel process exited (Code: ${code}, Signal: ${signal}).`);
    if (!isStopping) {
      console.log('[TUNNEL-SUPERVISOR] Reconnecting tunnel in 4 seconds...');
      setTimeout(startTunnel, 4000);
    }
  });

  tunnelProcess.on('error', (err) => {
    console.error('[TUNNEL-SUPERVISOR] Process error:', err.message);
  });
}

function stopTunnel() {
  isStopping = true;
  if (tunnelProcess) {
    tunnelProcess.kill('SIGINT');
  }
}

process.on('SIGINT', () => {
  stopTunnel();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopTunnel();
  process.exit(0);
});

startTunnel();
