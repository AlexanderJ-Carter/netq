'use strict';

const lib = require('../lib');
const ui = require('../ui');
const storage = require('../storage');

/**
 * Continuously probe host with ping + optional TCP.
 * @param {string} host
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @param {number} [options.intervalMs]
 * @param {number|string} [options.port]
 * @param {number} [options.count]
 * @returns {Promise<{ok: boolean, host: string, rounds: number}>}
 */
async function runWatch(
  host,
  { jsonMode = false, quiet = false, intervalMs = 2000, port = 443, count = null } = {}
) {
  if (jsonMode) {
    console.log(ui.warn('watch 为交互刷新命令，不支持 --json；请改用 doctor / ping / tcp'));
    return { ok: false, host, rounds: 0, error: 'json_unsupported' };
  }

  storage.rememberHost(host);
  const cfg = storage.readConfigSync();
  const tcpTimeout = cfg.defaults.tcpTimeoutMs ?? 2500;
  const interval = Math.max(500, Number(intervalMs) || 2000);
  const maxRounds = count === null || count === undefined ? null : Math.max(1, Number(count));

  let rounds = 0;
  let lastOk = true;
  let stopped = false;

  const onSigInt = () => {
    stopped = true;
  };
  process.on('SIGINT', onSigInt);

  try {
    if (!quiet) {
      console.log(ui.title(`监视: ${host}`));
      console.log(ui.dim(`间隔 ${interval}ms · TCP ${port} · Ctrl+C 退出`));
    }

    while (!stopped) {
      rounds += 1;
      const started = Date.now();

      const [pingResult, tcpResult] = await Promise.all([
        lib
          .ping(host, { count: 1 })
          .then(p => ({ ok: p.ok, detail: p.ok ? '通' : p.stderr || p.stdout || '失败' }))
          .catch(e => ({ ok: false, detail: e.message })),
        lib
          .tcpCheck(host, port, { timeoutMs: tcpTimeout })
          .then(t => ({ ok: t.ok, ms: t.ms, detail: t.ok ? `${t.ms}ms` : t.error || '关闭' }))
          .catch(e => ({ ok: false, ms: 0, detail: e.message }))
      ]);

      lastOk = pingResult.ok && tcpResult.ok;
      const stamp = new Date().toISOString().slice(11, 19);

      if (quiet) {
        console.log(
          `${stamp}\tping=${pingResult.ok ? 'ok' : 'fail'}\ttcp=${tcpResult.ok ? 'ok' : 'fail'}\t${tcpResult.ms || 0}ms`
        );
      } else {
        if (rounds > 1) process.stdout.write('\x1b[2K\x1b[1A\x1b[2K\x1b[1A\x1b[2K\x1b[1A');
        console.log(ui.hr());
        console.log(
          `${ui.dim(`#${rounds} ${stamp}`)}  Ping: ${
            pingResult.ok ? ui.ok(pingResult.detail) : ui.err(pingResult.detail)
          }  TCP ${port}: ${tcpResult.ok ? ui.ok(tcpResult.detail) : ui.err(tcpResult.detail)}`
        );
        console.log(ui.dim(lastOk ? '状态: 健康' : '状态: 异常'));
      }

      if (maxRounds !== null && rounds >= maxRounds) break;

      const elapsed = Date.now() - started;
      const wait = Math.max(0, interval - elapsed);
      await new Promise(r => setTimeout(r, wait));
    }
  } finally {
    process.removeListener('SIGINT', onSigInt);
    if (!quiet) console.log(ui.dim(`\n已停止，共 ${rounds} 轮`));
  }

  return { ok: lastOk, host, rounds };
}

module.exports = { runWatch };
