'use strict';

const os = require('os');
const dns = require('dns').promises;
const net = require('net');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

function isWindows() {
  return process.platform === 'win32';
}

function normalizeHost(input) {
  const s = String(input || '').trim();
  if (!s) throw new Error('目标不能为空');
  return s;
}

function normalizePort(input) {
  const n = Number(String(input).trim());
  if (!Number.isInteger(n) || n < 1 || n > 65535) throw new Error('端口必须是 1-65535 的整数');
  return n;
}

function withTimeout(promise, ms, timeoutMessage) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(timeoutMessage || `超时（${ms}ms）`)), ms);
  });
  return Promise.race([promise.finally(() => clearTimeout(t)), timeout]);
}

async function fetchPublicIp({ timeoutMs = 4000 } = {}) {
  const req = new Promise((resolve, reject) => {
    const r = https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (!j || !j.ip) return reject(new Error('返回格式异常'));
          resolve(j.ip);
        } catch {
          reject(new Error('解析公网 IP 响应失败'));
        }
      });
    });
    r.on('error', reject);
    r.setTimeout(timeoutMs, () => r.destroy(new Error('请求超时')));
  });
  return withTimeout(req, timeoutMs + 500, '获取公网 IP 超时');
}

function getLocalInterfaces() {
  const nis = os.networkInterfaces();
  const rows = [];
  for (const [name, infos] of Object.entries(nis)) {
    if (!Array.isArray(infos)) continue;
    for (const info of infos) {
      if (!info || !info.address) continue;
      rows.push({
        name,
        family: info.family,
        address: info.address,
        netmask: info.netmask || '',
        mac: info.mac || '',
        internal: Boolean(info.internal)
      });
    }
  }
  return rows;
}

async function dnsLookup(target, { family = 0 } = {}) {
  const host = normalizeHost(target);
  const res = await dns.lookup(host, { all: true, family, verbatim: true });
  return res.map((r) => ({ address: r.address, family: r.family }));
}

async function dnsResolve(target, rrtype = 'A') {
  const host = normalizeHost(target);
  const type = String(rrtype || '').toUpperCase();
  const allowed = new Set(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SRV']);
  if (!allowed.has(type)) throw new Error(`不支持的记录类型：${type}`);

  const out = await dns.resolve(host, type);
  return out;
}

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

    child.stdout.on('data', (d) => (stdout += d.toString('utf8')));
    child.stderr.on('data', (d) => (stderr += d.toString('utf8')));
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

async function ping(target, { count = 4, timeoutMs = 15000 } = {}) {
  const host = normalizeHost(target);
  const n = Math.max(1, Math.min(10, Number(count) || 4));
  if (isWindows()) {
    return runCommand('ping', ['-n', String(n), host], { timeoutMs });
  }
  return runCommand('ping', ['-c', String(n), host], { timeoutMs });
}

async function traceroute(target, { timeoutMs = 30000 } = {}) {
  const host = normalizeHost(target);
  if (isWindows()) {
    return runCommand('tracert', [host], { timeoutMs });
  }
  // macOS/Linux 常见为 traceroute
  return runCommand('traceroute', [host], { timeoutMs });
}

function normalizeUrl(input) {
  const s = String(input || '').trim();
  if (!s) throw new Error('URL 不能为空');
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('仅支持 http/https');
    return u;
  } catch {
    throw new Error('URL 格式不正确（例：https://example.com/path）');
  }
}

async function httpCheck(urlInput, { method = 'HEAD', timeoutMs = 6000, followRedirects = 3 } = {}) {
  const url = normalizeUrl(urlInput);
  const m = String(method || 'HEAD').toUpperCase();
  const allowed = new Set(['HEAD', 'GET']);
  if (!allowed.has(m)) throw new Error('HTTP 方法仅支持 HEAD/GET');

  const resolved = [];
  try {
    const host = url.hostname;
    const addrs = await dns.lookup(host, { all: true, verbatim: true });
    for (const a of addrs) resolved.push({ address: a.address, family: a.family });
  } catch {
    // ignore
  }

  const doOne = (u) =>
    new Promise((resolve, reject) => {
      const lib = u.protocol === 'https:' ? https : http;
      const start = Date.now();
      let remoteAddress = '';
      const req = lib.request(
        u,
        {
          method: m,
          headers: {
            'user-agent': 'netq/0.2',
            accept: '*/*'
          }
        },
        (res) => {
          // 不读 body，速度更快
          res.resume();
          remoteAddress = (res.socket && res.socket.remoteAddress) ? String(res.socket.remoteAddress) : remoteAddress;
          resolve({
            url: u.toString(),
            status: res.statusCode || 0,
            statusText: res.statusMessage || '',
            location: res.headers.location ? String(res.headers.location) : '',
            ms: Date.now() - start,
            ip: remoteAddress
          });
        }
      );
      req.on('error', (e) => reject(e));
      req.on('socket', (s) => {
        if (!s) return;
        s.on('connect', () => {
          if (s.remoteAddress) remoteAddress = String(s.remoteAddress);
        });
      });
      req.setTimeout(timeoutMs, () => req.destroy(new Error('超时')));
      req.end();
    });

  let current = url;
  const chain = [];
  for (let i = 0; i <= followRedirects; i++) {
    // eslint-disable-next-line no-await-in-loop
    const r = await doOne(current);
    chain.push(r);
    const isRedirect = r.status >= 300 && r.status < 400 && r.location;
    if (!isRedirect) return { ...r, ok: r.status > 0 && r.status < 500, resolved, chain };
    if (i === followRedirects) return { ...r, ok: false, error: '重定向过多', resolved, chain };
    try {
      current = new URL(r.location, current);
    } catch {
      return { ...r, ok: false, error: '重定向 URL 无效', resolved, chain };
    }
  }
  return { url: url.toString(), ok: false, status: 0, statusText: '', location: '', ms: 0, error: '未知错误', resolved, chain };
}

async function tcpCheck(hostInput, portInput, { timeoutMs = 2500 } = {}) {
  const host = normalizeHost(hostInput);
  const port = normalizePort(portInput);

  const start = Date.now();
  const result = await new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (ok, error) => {
      if (done) return;
      done = true;
      try {
        socket.destroy();
      } catch {}
      resolve({
        host,
        port,
        ok,
        ms: Date.now() - start,
        error: error ? String(error) : ''
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false, '超时'));
    socket.once('error', (e) => finish(false, e && e.code ? e.code : e.message || '错误'));

    socket.connect(port, host);
  });

  return result;
}

async function tcpBatchCheck(hostInput, ports, { timeoutMs = 2500, concurrency = 50 } = {}) {
  const host = normalizeHost(hostInput);
  const list = Array.from(new Set(ports.map(normalizePort))).sort((a, b) => a - b);
  const limit = Math.max(1, Math.min(200, Number(concurrency) || 50));

  const out = [];
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (idx < list.length) {
      const p = list[idx++];
      // eslint-disable-next-line no-await-in-loop
      out.push(await tcpCheck(host, p, { timeoutMs }));
    }
  });
  await Promise.all(workers);
  out.sort((a, b) => a.port - b.port);
  return out;
}

function parsePorts(input) {
  const s = String(input || '').trim();
  if (!s) throw new Error('端口列表不能为空');
  // 支持：80,443, 3000-3010
  const parts = s.split(',').map((x) => x.trim()).filter(Boolean);
  const ports = [];
  for (const part of parts) {
    if (part.includes('-')) {
      const [aRaw, bRaw] = part.split('-').map((x) => x.trim());
      const a = normalizePort(aRaw);
      const b = normalizePort(bRaw);
      const from = Math.min(a, b);
      const to = Math.max(a, b);
      const span = to - from + 1;
      if (span > 2000) throw new Error('端口范围过大（最多 2000 个）');
      for (let p = from; p <= to; p++) ports.push(p);
    } else {
      ports.push(normalizePort(part));
    }
  }
  return ports;
}

async function systemNetInfo({ timeoutMs = 12000 } = {}) {
  // 只做“快速可读”的信息，不做复杂解析
  if (isWindows()) {
    const ipconfig = await runCommand('ipconfig', ['/all'], { timeoutMs });
    return { command: ipconfig.cmd, ok: ipconfig.ok, stdout: ipconfig.stdout, stderr: ipconfig.stderr };
  }
  const ifconfig = await runCommand('ifconfig', [], { timeoutMs });
  if (ifconfig.ok) return { command: ifconfig.cmd, ok: true, stdout: ifconfig.stdout, stderr: ifconfig.stderr };
  const ip = await runCommand('ip', ['a'], { timeoutMs });
  return { command: ip.cmd, ok: ip.ok, stdout: ip.stdout, stderr: ip.stderr };
}

async function listListeningPorts({ timeoutMs = 12000 } = {}) {
  if (isWindows()) {
    return runCommand('netstat', ['-ano'], { timeoutMs });
  }
  // macOS：lsof 通常可用；Linux：优先 ss，其次 netstat
  const lsof = await runCommand('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN'], { timeoutMs });
  if (lsof.ok) return lsof;
  const ss = await runCommand('ss', ['-ltnp'], { timeoutMs });
  if (ss.ok) return ss;
  return runCommand('netstat', ['-ltnp'], { timeoutMs });
}

function splitHostPort(s) {
  const v = String(s || '').trim();
  // [::]:80
  const m6 = v.match(/^\[(.+)\]:(\d+)$/);
  if (m6) return { host: m6[1], port: Number(m6[2]) };
  // 0.0.0.0:80 或 :::80（少见）
  const idx = v.lastIndexOf(':');
  if (idx <= 0) return { host: v, port: 0 };
  const host = v.slice(0, idx);
  const port = Number(v.slice(idx + 1));
  return { host, port: Number.isFinite(port) ? port : 0 };
}

function parseWindowsNetstat(stdout) {
  const lines = String(stdout || '').split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;
    if (!/^TCP|^UDP/i.test(s)) continue;
    const parts = s.split(/\s+/);
    const proto = parts[0].toUpperCase();
    // UDP 行没有 STATE
    if (proto === 'UDP') {
      if (parts.length < 4) continue;
      const local = splitHostPort(parts[1]);
      const pid = Number(parts[3]);
      out.push({ proto, localAddr: local.host, localPort: local.port, state: 'UDP', pid: Number.isFinite(pid) ? pid : 0 });
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

function parseSs(stdout) {
  // ss -ltnp
  const lines = String(stdout || '').split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;
    if (/^State\s+/i.test(s)) continue;
    const parts = s.split(/\s+/);
    // State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
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

function parseUnixNetstat(stdout) {
  // netstat -ltnp
  const lines = String(stdout || '').split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;
    if (/^Proto\s+/i.test(s)) continue;
    if (!/^(tcp|udp)/i.test(s)) continue;
    const parts = s.split(/\s+/);
    // Proto Recv-Q Send-Q Local Address Foreign Address State PID/Program name
    if (parts.length < 4) continue;
    const proto = parts[0].toUpperCase();
    const local = splitHostPort(parts[3]);
    const state = parts.includes('LISTEN') ? 'LISTEN' : (parts[5] || '');
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

async function resolveWindowsProcessNames(pids, { timeoutMs = 8000 } = {}) {
  const uniq = Array.from(new Set((pids || []).filter((x) => Number.isFinite(x) && x > 0))).slice(0, 200);
  const map = new Map();
  for (const pid of uniq) {
    // eslint-disable-next-line no-await-in-loop
    const r = await runCommand('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { timeoutMs });
    const line = (r.stdout || '').trim();
    // "Image Name","PID","Session Name","Session#","Mem Usage"
    const m = line.match(/^"([^"]+)",\s*"(\d+)"/);
    if (m) map.set(pid, m[1]);
  }
  return map;
}

module.exports = {
  isWindows,
  fetchPublicIp,
  getLocalInterfaces,
  dnsLookup,
  dnsResolve,
  ping,
  traceroute,
  httpCheck,
  tcpCheck,
  tcpBatchCheck,
  parsePorts,
  systemNetInfo,
  listListeningPorts,
  parseWindowsNetstat,
  parseSs,
  parseUnixNetstat,
  resolveWindowsProcessNames
};

