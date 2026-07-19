'use strict';

const lib = require('../lib');
const ui = require('../ui');
const ora = require('ora');
const { printJson } = require('./_output');
const storage = require('../storage');

/**
 * Probe HTTPS then HTTP for a host.
 * @param {string} host
 * @param {number} timeoutMs
 * @returns {Promise<Object>}
 */
async function probeHttp(host, timeoutMs) {
  const httpsResult = await lib.httpCheck(`https://${host}`, { timeoutMs }).catch((e) => ({
    ok: false,
    error: e.message,
    url: `https://${host}`
  }));
  if (httpsResult.ok) return { ...httpsResult, probed: 'https' };

  const httpResult = await lib.httpCheck(`http://${host}`, { timeoutMs }).catch((e) => ({
    ok: false,
    error: e.message,
    url: `http://${host}`
  }));
  return {
    ...httpResult,
    probed: 'http',
    httpsError: httpsResult.error || (httpsResult.status ? `status ${httpsResult.status}` : undefined)
  };
}

/**
 * Run comprehensive diagnostics.
 * @param {string} host
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {string} [options.portsInput]
 * @param {boolean} [options.quiet]
 * @param {boolean} [options.exportReport]
 * @returns {Promise<{ok: boolean, host: string, checks: Object}>}
 */
async function runDoctor(host, { jsonMode = false, portsInput, quiet = false, exportReport = false } = {}) {
  const cfg = storage.readConfigSync();
  const tcpTimeout = cfg.defaults.tcpTimeoutMs ?? 2500;
  const httpTimeout = cfg.defaults.httpTimeoutMs ?? 6000;
  const results = { host, checks: {} };

  if (!jsonMode && !quiet) console.log(ui.title(`快速体检: ${host}`));

  let ports = [80, 443];
  if (portsInput) {
    try {
      ports = lib.parsePorts(portsInput);
    } catch {
      if (!quiet) console.log(ui.warn('端口参数无效，使用默认端口 80,443'));
    }
  }
  results.ports = ports;

  const dnsSpinner = !jsonMode && !quiet ? ora('DNS 查询中...').start() : null;
  const pingSpinner = !jsonMode && !quiet ? ora('Ping 中...').start() : null;

  const [dnsResult, pingResult] = await Promise.all([
    lib
      .dnsLookup(host)
      .then((lookup) => ({ ok: true, addresses: lookup }))
      .catch((e) => ({ ok: false, error: e.message })),
    lib
      .ping(host, { count: 2 })
      .then((ping) => ({ ok: ping.ok, output: ping.stdout, stderr: ping.stderr }))
      .catch((e) => ({ ok: false, error: e.message }))
  ]);

  results.checks.dns = dnsResult;
  if (dnsSpinner) {
    if (dnsResult.ok) dnsSpinner.succeed(`DNS: ${dnsResult.addresses.map((r) => r.address).join(', ')}`);
    else dnsSpinner.fail(`DNS: ${dnsResult.error}`);
  }

  results.checks.ping = pingResult;
  if (pingSpinner) {
    if (pingResult.ok) pingSpinner.succeed('Ping: 连通');
    else pingSpinner.fail(`Ping: ${pingResult.stderr || pingResult.error || '失败'}`);
  }

  const tcpSpinner = !jsonMode && !quiet ? ora(`TCP 端口检测中 (${ports.join(',')})...`).start() : null;
  const httpSpinner = !jsonMode && !quiet ? ora('HTTP 检测中...').start() : null;

  const [tcpResult, httpResult] = await Promise.all([
    lib.tcpBatchCheck(host, ports, { timeoutMs: tcpTimeout }).catch((e) => ({ ok: false, error: e.message })),
    probeHttp(host, httpTimeout)
  ]);

  results.checks.tcp = tcpResult;
  if (tcpSpinner) {
    if (Array.isArray(tcpResult)) {
      const openPorts = tcpResult.filter((t) => t.ok).map((t) => t.port);
      const closedPorts = tcpResult.filter((t) => !t.ok).map((t) => t.port);
      if (closedPorts.length === 0) tcpSpinner.succeed(`TCP: ${openPorts.join(',')} 开放`);
      else if (openPorts.length === 0) tcpSpinner.fail(`TCP: ${closedPorts.join(',')} 关闭`);
      else tcpSpinner.warn(`TCP: ${openPorts.join(',')} 开放, ${closedPorts.join(',')} 关闭`);
    } else {
      tcpSpinner.fail(`TCP: ${tcpResult.error || '失败'}`);
    }
  }

  results.checks.http = httpResult;
  if (httpSpinner) {
    if (httpResult.ok) {
      httpSpinner.succeed(`${(httpResult.probed || 'HTTP').toUpperCase()}: ${httpResult.status} (${httpResult.ms}ms)`);
    } else {
      httpSpinner.fail(`HTTP: ${httpResult.error || `状态码 ${httpResult.status}`}`);
    }
  }

  const dnsOk = Boolean(results.checks.dns && results.checks.dns.ok);
  const pingOk = Boolean(results.checks.ping && results.checks.ping.ok);
  const httpOk = Boolean(results.checks.http && results.checks.http.ok);
  const tcpOk = Array.isArray(results.checks.tcp)
    ? results.checks.tcp.every((x) => x && x.ok)
    : Boolean(results.checks.tcp && results.checks.tcp.ok);
  results.ok = dnsOk && pingOk && tcpOk && httpOk;

  if (exportReport) {
    const paths = storage.writeReportSync({
      title: `doctor-${host}`,
      text: JSON.stringify(results, null, 2),
      json: results
    });
    results.report = paths;
    if (!jsonMode && !quiet) {
      if (paths.textPath) console.log(ui.dim(`报告已导出: ${paths.textPath}`));
      if (paths.jsonPath) console.log(ui.dim(`JSON 报告: ${paths.jsonPath}`));
    }
  }

  if (jsonMode) {
    printJson('doctor', results.ok, results);
  } else if (quiet) {
    for (const t of results.checks.tcp || []) {
      if (t && t.port !== undefined && t.port !== null) console.log(`${t.port}\t${t.ok ? 'open' : 'closed'}`);
    }
    console.log(results.ok ? 'ok' : 'failed');
  }

  return results;
}

module.exports = { runDoctor };
