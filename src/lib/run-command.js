'use strict';

const { spawn } = require('child_process');
const { isWindows } = require('./platform');

/**
 * Decode command output bytes for the current platform.
 * Windows console tools typically emit the active ANSI/OEM code page (GBK family).
 * @param {Buffer} buf
 * @returns {string}
 */
function decodeOutput(buf) {
  if (!Buffer.isBuffer(buf) || buf.length === 0) return '';
  if (!isWindows()) return buf.toString('utf8');
  try {
    return new TextDecoder('gb18030').decode(buf);
  } catch {
    return buf.toString('utf8');
  }
}

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
    const stdoutChunks = [];
    const stderrChunks = [];
    let finished = false;

    const t = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill();
      resolve({
        ok: false,
        code: null,
        stdout: decodeOutput(Buffer.concat(stdoutChunks)),
        stderr: decodeOutput(Buffer.concat(stderrChunks)) || '超时',
        cmd: [cmd, ...args].join(' ')
      });
    }, timeoutMs);
    if (typeof t.unref === 'function') t.unref();

    if (child.stdout) child.stdout.on('data', (d) => stdoutChunks.push(Buffer.from(d)));
    if (child.stderr) child.stderr.on('data', (d) => stderrChunks.push(Buffer.from(d)));
    child.on('error', (e) => {
      clearTimeout(t);
      if (finished) return;
      finished = true;
      resolve({
        ok: false,
        code: null,
        stdout: decodeOutput(Buffer.concat(stdoutChunks)),
        stderr: String(e.message || e),
        cmd: [cmd, ...args].join(' ')
      });
    });
    child.on('close', (code) => {
      clearTimeout(t);
      if (finished) return;
      finished = true;
      resolve({
        ok: code === 0,
        code,
        stdout: decodeOutput(Buffer.concat(stdoutChunks)),
        stderr: decodeOutput(Buffer.concat(stderrChunks)),
        cmd: [cmd, ...args].join(' ')
      });
    });
  });
}

module.exports = { runCommand, decodeOutput };
