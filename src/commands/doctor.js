'use strict';

const core = require('../core');
const ui = require('../ui');
const ora = require('ora');
const { printJson } = require('./dns');

/**
 * Run the comprehensive diagnostics command
 * @param {string} host - Target host
 * @param {Object} options - Command options
 * @param {boolean} options.jsonMode - Output in JSON format
 * @param {string} [options.portsInput] - Custom ports to check
 * @param {boolean} options.quiet - Quiet mode (minimal output)
 * @returns {Promise<{ok: boolean, host: string, checks: Object}>} Command result
 */
async function runDoctor(host, { jsonMode, portsInput, quiet = false }) {
  const results = { host, checks: {} };

  if (!jsonMode && !quiet) console.log(ui.title(`快速体检: ${host}`));

  // 1. DNS
  const dnsSpinner = !jsonMode && !quiet ? ora('DNS 查询中...').start() : null;
  try {
    const lookup = await core.dnsLookup(host);
    results.checks.dns = { ok: true, addresses: lookup };
    if (dnsSpinner) dnsSpinner.succeed(`DNS: ${lookup.map(r => r.address).join(', ')}`);
  } catch (e) {
    results.checks.dns = { ok: false, error: e.message };
    if (dnsSpinner) dnsSpinner.fail(`DNS: ${e.message}`);
  }

  // 2. Ping
  const pingSpinner = !jsonMode && !quiet ? ora('Ping 中...').start() : null;
  try {
    const ping = await core.ping(host, { count: 2 });
    results.checks.ping = { ok: ping.ok, output: ping.stdout };
    if (ping.ok) {
      if (pingSpinner) pingSpinner.succeed('Ping: 连通');
    } else {
      if (pingSpinner) pingSpinner.fail(`Ping: ${ping.stderr || '失败'}`);
    }
  } catch (e) {
    results.checks.ping = { ok: false, error: e.message };
    if (pingSpinner) pingSpinner.fail(`Ping: ${e.message}`);
  }

  // 3. TCP ports
  let ports = [80, 443];
  if (portsInput) {
    try {
      ports = core.parsePorts(portsInput);
    } catch (e) {
      if (!quiet) console.log(ui.warn('端口参数无效，使用默认端口'));
    }
  }
  results.ports = ports;

  const tcpSpinner = !jsonMode && !quiet ? ora(`TCP 端口检测中 (${ports.join(',')})...`).start() : null;
  try {
    const tcp = await core.tcpBatchCheck(host, ports);
    results.checks.tcp = tcp;
    if (tcpSpinner) {
      const openPorts = tcp.filter(t => t.ok).map(t => t.port);
      const closedPorts = tcp.filter(t => !t.ok).map(t => t.port);
      if (closedPorts.length === 0) {
        tcpSpinner.succeed(`TCP: ${openPorts.join(',')} 开放`);
      } else if (openPorts.length === 0) {
        tcpSpinner.fail(`TCP: ${closedPorts.join(',')} 关闭`);
      } else {
        tcpSpinner.warn(`TCP: ${openPorts.join(',')} 开放, ${closedPorts.join(',')} 关闭`);
      }
    }
  } catch (e) {
    results.checks.tcp = { ok: false, error: e.message };
    if (tcpSpinner) tcpSpinner.fail(`TCP: ${e.message}`);
  }

  // 4. HTTP
  const httpSpinner = !jsonMode && !quiet ? ora('HTTP 检测中...').start() : null;
  try {
    const http = await core.httpCheck(`https://${host}`);
    results.checks.http = http;
    if (http.ok) {
      if (httpSpinner) httpSpinner.succeed(`HTTPS: ${http.status} (${http.ms}ms)`);
    } else {
      if (httpSpinner) httpSpinner.fail(`HTTPS: ${http.error || `状态码 ${http.status}`}`);
    }
  } catch (e) {
    results.checks.http = { ok: false, error: e.message };
    if (httpSpinner) httpSpinner.fail(`HTTPS: ${e.message}`);
  }

  const dnsOk = Boolean(results.checks.dns && results.checks.dns.ok);
  const pingOk = Boolean(results.checks.ping && results.checks.ping.ok);
  const httpOk = Boolean(results.checks.http && results.checks.http.ok);
  const tcpOk = Array.isArray(results.checks.tcp)
    ? results.checks.tcp.every((x) => x && x.ok)
    : Boolean(results.checks.tcp && results.checks.tcp.ok);
  results.ok = dnsOk && pingOk && tcpOk && httpOk;

  if (jsonMode) {
    printJson('doctor', results);
    if (!results.ok) process.exitCode = 1;
  } else if (quiet) {
    for (const t of (results.checks.tcp || [])) {
      console.log(`${t.port}\t${t.ok ? 'open' : 'closed'}`);
    }
    console.log(results.ok ? 'ok' : 'failed');
  }

  return results;
}

module.exports = { runDoctor };
