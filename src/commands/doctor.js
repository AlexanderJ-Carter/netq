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

  // Parse ports first (synchronous, fast)
  let ports = [80, 443];
  if (portsInput) {
    try {
      ports = core.parsePorts(portsInput);
    } catch (e) {
      if (!quiet) console.log(ui.warn('端口参数无效，使用默认端口'));
    }
  }
  results.ports = ports;

  // Phase 1: DNS and Ping in parallel
  const dnsSpinner = !jsonMode && !quiet ? ora('DNS 查询中...').start() : null;
  const pingSpinner = !jsonMode && !quiet ? ora('Ping 中...').start() : null;

  const [dnsResult, pingResult] = await Promise.all([
    core.dnsLookup(host).then(lookup => ({ ok: true, addresses: lookup })).catch(e => ({ ok: false, error: e.message })),
    core.ping(host, { count: 2 }).then(ping => ({ ok: ping.ok, output: ping.stdout, stderr: ping.stderr })).catch(e => ({ ok: false, error: e.message }))
  ]);

  // Process DNS result
  results.checks.dns = dnsResult;
  if (dnsSpinner) {
    if (dnsResult.ok) {
      dnsSpinner.succeed(`DNS: ${dnsResult.addresses.map(r => r.address).join(', ')}`);
    } else {
      dnsSpinner.fail(`DNS: ${dnsResult.error}`);
    }
  }

  // Process Ping result
  results.checks.ping = pingResult;
  if (pingSpinner) {
    if (pingResult.ok) {
      pingSpinner.succeed('Ping: 连通');
    } else {
      pingSpinner.fail(`Ping: ${pingResult.stderr || pingResult.error || '失败'}`);
    }
  }

  // Phase 2: TCP and HTTP in parallel
  const tcpSpinner = !jsonMode && !quiet ? ora(`TCP 端口检测中 (${ports.join(',')})...`).start() : null;
  const httpSpinner = !jsonMode && !quiet ? ora('HTTP 检测中...').start() : null;

  const [tcpResult, httpResult] = await Promise.all([
    core.tcpBatchCheck(host, ports).catch(e => ({ ok: false, error: e.message })),
    core.httpCheck(`https://${host}`).catch(e => ({ ok: false, error: e.message }))
  ]);

  // Process TCP result
  results.checks.tcp = tcpResult;
  if (tcpSpinner) {
    if (Array.isArray(tcpResult)) {
      const openPorts = tcpResult.filter(t => t.ok).map(t => t.port);
      const closedPorts = tcpResult.filter(t => !t.ok).map(t => t.port);
      if (closedPorts.length === 0) {
        tcpSpinner.succeed(`TCP: ${openPorts.join(',')} 开放`);
      } else if (openPorts.length === 0) {
        tcpSpinner.fail(`TCP: ${closedPorts.join(',')} 关闭`);
      } else {
        tcpSpinner.warn(`TCP: ${openPorts.join(',')} 开放, ${closedPorts.join(',')} 关闭`);
      }
    } else {
      tcpSpinner.fail(`TCP: ${tcpResult.error || '失败'}`);
    }
  }

  // Process HTTP result
  results.checks.http = httpResult;
  if (httpSpinner) {
    if (httpResult.ok) {
      httpSpinner.succeed(`HTTPS: ${httpResult.status} (${httpResult.ms}ms)`);
    } else {
      httpSpinner.fail(`HTTPS: ${httpResult.error || `状态码 ${httpResult.status}`}`);
    }
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
