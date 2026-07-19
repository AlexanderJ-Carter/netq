'use strict';

const { isWindows } = require('./platform');
const { runCommand } = require('./run-command');
const { splitHostPort } = require('./normalize');

/**
 * List listening TCP/UDP ports via system tools.
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=12000]
 * @returns {Promise<{ok: boolean, code: number|null, stdout: string, stderr: string, cmd: string}>}
 */
async function listListeningPorts({ timeoutMs = 12000 } = {}) {
  if (isWindows()) {
    return runCommand('netstat', ['-ano'], { timeoutMs });
  }
  const lsof = await runCommand('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { timeoutMs });
  if (lsof.ok) return lsof;
  const ss = await runCommand('ss', ['-ltnp'], { timeoutMs });
  if (ss.ok) return ss;
  return runCommand('netstat', ['-ltnp'], { timeoutMs });
}

/**
 * Parse Windows netstat -ano output.
 * @param {string} stdout
 * @returns {Array<Object>}
 */
function parseWindowsNetstat(stdout) {
  const lines = String(stdout || '').split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;
    if (!/^TCP|^UDP/i.test(s)) continue;
    const parts = s.split(/\s+/);
    const proto = parts[0].toUpperCase();
    if (proto === 'UDP') {
      if (parts.length < 4) continue;
      const local = splitHostPort(parts[1]);
      const pid = Number(parts[3]);
      out.push({
        proto,
        localAddr: local.host,
        localPort: local.port,
        state: 'UDP',
        pid: Number.isFinite(pid) ? pid : 0
      });
      continue;
    }
    if (parts.length < 5) continue;
    const local = splitHostPort(parts[1]);
    const state = parts[3] || '';
    const pid = Number(parts[4]);
    out.push({
      proto,
      localAddr: local.host,
      localPort: local.port,
      state,
      pid: Number.isFinite(pid) ? pid : 0
    });
  }
  return out.filter((x) => x.localPort > 0);
}

/**
 * Parse Linux ss -ltnp output.
 * @param {string} stdout
 * @returns {Array<Object>}
 */
function parseSs(stdout) {
  const lines = String(stdout || '').split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;
    if (/^State\s+/i.test(s)) continue;
    const parts = s.split(/\s+/);
    if (parts.length < 5) continue;
    const state = parts[0];
    const local = splitHostPort(parts[3]);
    const proc = parts.slice(5).join(' ');
    const pidMatch = proc.match(/pid=(\d+)/);
    const pid = pidMatch ? Number(pidMatch[1]) : 0;
    out.push({
      proto: 'TCP',
      localAddr: local.host,
      localPort: local.port,
      state,
      pid: Number.isFinite(pid) ? pid : 0,
      process: proc
    });
  }
  return out.filter((x) => x.localPort > 0);
}

/**
 * Parse Unix netstat -ltnp output.
 * @param {string} stdout
 * @returns {Array<Object>}
 */
function parseUnixNetstat(stdout) {
  const lines = String(stdout || '').split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;
    if (/^Proto\s+/i.test(s)) continue;
    if (!/^(tcp|udp)/i.test(s)) continue;
    const parts = s.split(/\s+/);
    if (parts.length < 4) continue;
    const proto = parts[0].toUpperCase();
    const local = splitHostPort(parts[3]);
    const state = parts.includes('LISTEN') ? 'LISTEN' : parts[5] || '';
    const last = parts[parts.length - 1] || '';
    const pid = Number((last.split('/')[0] || '').replace(/[^\d]/g, ''));
    out.push({
      proto,
      localAddr: local.host,
      localPort: local.port,
      state,
      pid: Number.isFinite(pid) ? pid : 0,
      process: last.includes('/') ? last : ''
    });
  }
  return out.filter((x) => x.localPort > 0);
}

/**
 * Resolve process names for PIDs on Windows.
 * @param {number[]} pids
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=8000]
 * @returns {Promise<Map<number, string>>}
 */
async function resolveWindowsProcessNames(pids, { timeoutMs = 8000 } = {}) {
  const uniq = Array.from(new Set((pids || []).filter((x) => Number.isFinite(x) && x > 0))).slice(0, 200);
  const map = new Map();

  const results = await Promise.all(
    uniq.map(async (pid) => {
      const r = await runCommand('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { timeoutMs });
      const line = (r.stdout || '').trim();
      const m = line.match(/^"([^"]+)",\s*"(\d+)"/);
      return { pid, name: m ? m[1] : null };
    })
  );

  for (const { pid, name } of results) {
    if (name) map.set(pid, name);
  }

  return map;
}

module.exports = {
  listListeningPorts,
  parseWindowsNetstat,
  parseSs,
  parseUnixNetstat,
  resolveWindowsProcessNames
};
