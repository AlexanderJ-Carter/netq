'use strict';

const { spawn } = require('child_process');

/**
 * Run a shell command with timeout.
 * @param {string} cmd
 * @param {string[]} args
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=15000]
 * @returns {Promise<{ok: boolean, code: number|null, stdout: string, stderr: string, cmd: string}>}
 */
function runCommand(cmd, args, { timeoutMs = 15000 } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    let finished = false;

    const t = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill();
      resolve({ ok: false, code: null, stdout, stderr: stderr || '超时', cmd: [cmd, ...args].join(' ') });
    }, timeoutMs);
    if (typeof t.unref === 'function') t.unref();

    if (child.stdout) child.stdout.on('data', (d) => (stdout += d.toString('utf8')));
    if (child.stderr) child.stderr.on('data', (d) => (stderr += d.toString('utf8')));
    child.on('error', (e) => {
      clearTimeout(t);
      if (finished) return;
      finished = true;
      resolve({ ok: false, code: null, stdout, stderr: String(e.message || e), cmd: [cmd, ...args].join(' ') });
    });
    child.on('close', (code) => {
      clearTimeout(t);
      if (finished) return;
      finished = true;
      resolve({ ok: code === 0, code, stdout, stderr, cmd: [cmd, ...args].join(' ') });
    });
  });
}

module.exports = { runCommand };
