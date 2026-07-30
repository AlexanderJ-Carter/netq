'use strict';

const tls = require('tls');
const { normalizeHost, normalizePort } = require('./normalize');

/**
 * Days remaining until certificate expiry (can be negative).
 * @param {string|Date} validTo
 * @param {number} [nowMs]
 * @returns {number}
 */
function daysRemaining(validTo, nowMs = Date.now()) {
  const end = new Date(validTo).getTime();
  if (!Number.isFinite(end)) throw new Error('证书有效期无效');
  return Math.ceil((end - nowMs) / (24 * 60 * 60 * 1000));
}

/**
 * Flatten certificate subject/issuer objects into readable strings.
 * @param {Object|string|null|undefined} name
 * @returns {string}
 */
function formatCertName(name) {
  if (!name) return '';
  if (typeof name === 'string') return name;
  if (name.CN) return String(name.CN);
  return Object.entries(name)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
}

/**
 * Collect SANs from a peer certificate.
 * @param {Object} cert
 * @returns {string[]}
 */
function collectSans(cert) {
  if (!cert) return [];
  if (Array.isArray(cert.subjectaltname)) {
    return cert.subjectaltname.map(String);
  }
  if (typeof cert.subjectaltname === 'string') {
    return cert.subjectaltname
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Perform a TLS handshake and inspect the peer certificate.
 * @param {string} hostInput
 * @param {Object} [options]
 * @param {number|string} [options.port=443]
 * @param {number} [options.timeoutMs=6000]
 * @param {string} [options.servername]
 * @returns {Promise<Object>}
 */
function tlsCheck(hostInput, { port = 443, timeoutMs = 6000, servername } = {}) {
  const host = normalizeHost(hostInput);
  const p = normalizePort(port);
  const sn = servername ? String(servername) : host;

  return new Promise(resolve => {
    const start = Date.now();
    let settled = false;

    const finish = result => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const socket = tls.connect(
      {
        host,
        port: p,
        servername: sn,
        rejectUnauthorized: false,
        timeout: timeoutMs
      },
      () => {
        const cert = socket.getPeerCertificate(true);
        const protocol = socket.getProtocol() || '';
        const cipher = socket.getCipher() || {};
        const authorized = socket.authorized;
        const authorizationError = socket.authorizationError
          ? String(socket.authorizationError)
          : '';

        const validFrom = cert && cert.valid_from ? String(cert.valid_from) : '';
        const validTo = cert && cert.valid_to ? String(cert.valid_to) : '';
        let remaining = null;
        if (validTo) {
          remaining = daysRemaining(validTo);
        }

        const expired = remaining !== null && remaining < 0;
        const ok = Boolean(cert && cert.subject) && !expired;

        socket.end();
        finish({
          ok,
          host,
          port: p,
          ms: Date.now() - start,
          protocol,
          cipher: cipher.name || '',
          authorized,
          authorizationError: authorizationError || undefined,
          subject: formatCertName(cert && cert.subject),
          issuer: formatCertName(cert && cert.issuer),
          validFrom,
          validTo,
          daysRemaining: remaining,
          san: collectSans(cert),
          fingerprint256: cert && cert.fingerprint256 ? String(cert.fingerprint256) : '',
          error: ok ? undefined : expired ? '证书已过期' : '未获取到对端证书'
        });
      }
    );

    socket.on('error', e => {
      finish({
        ok: false,
        host,
        port: p,
        ms: Date.now() - start,
        error: e.message
      });
    });

    socket.on('timeout', () => {
      socket.destroy();
      finish({
        ok: false,
        host,
        port: p,
        ms: Date.now() - start,
        error: '超时'
      });
    });
  });
}

module.exports = { tlsCheck, daysRemaining, formatCertName, collectSans };
