'use strict';

const WEIGHTS = {
  dns: 25,
  ping: 15,
  tcp: 25,
  http: 20,
  tls: 15
};

/**
 * Whether a doctor check passed.
 * @param {string} key
 * @param {*} value
 * @returns {boolean}
 */
function checkOk(key, value) {
  if (!value) return false;
  if (key === 'tcp' && Array.isArray(value)) return value.length > 0 && value.every(x => x && x.ok);
  return Boolean(value.ok);
}

/**
 * Build human-readable advice lines from failed / weak checks.
 * @param {Object} checks
 * @returns {string[]}
 */
function buildAdvice(checks) {
  const advice = [];
  if (!checkOk('dns', checks.dns)) {
    advice.push('DNS 解析失败：检查域名拼写、本机 DNS 或网络出口');
  }
  if (!checkOk('ping', checks.ping)) {
    advice.push('Ping 不通：目标可能禁 ICMP，可结合 TCP/HTTP 判断');
  }
  if (!checkOk('tcp', checks.tcp)) {
    advice.push('部分 TCP 端口不可达：检查防火墙、安全组或服务监听');
  }
  if (!checkOk('http', checks.http)) {
    advice.push('HTTP(S) 异常：确认证书、反向代理与应用是否正常');
  }
  if (checks.tls) {
    if (!checkOk('tls', checks.tls)) {
      advice.push('TLS 握手或证书异常：检查证书链、SNI 与有效期');
    } else if (
      typeof checks.tls.daysRemaining === 'number' &&
      checks.tls.daysRemaining >= 0 &&
      checks.tls.daysRemaining <= 14
    ) {
      advice.push(`TLS 证书将在 ${checks.tls.daysRemaining} 天后过期，尽快续期`);
    }
  }
  if (advice.length === 0) advice.push('各项检查通过，网络路径健康');
  return advice;
}

/**
 * Score doctor checks from 0–100 and produce advice.
 * @param {Object} checks
 * @returns {{score: number, max: number, parts: Object, advice: string[]}}
 */
function scoreDoctor(checks = {}) {
  let earned = 0;
  let max = 0;
  const parts = {};

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    if (checks[key] === undefined) continue;
    max += weight;
    const passed = checkOk(key, checks[key]);
    parts[key] = { weight, ok: passed, earned: passed ? weight : 0 };
    if (passed) earned += weight;
  }

  const score = max === 0 ? 0 : Math.round((earned / max) * 100);
  return {
    score,
    max,
    earned,
    parts,
    advice: buildAdvice(checks)
  };
}

module.exports = { scoreDoctor, buildAdvice, checkOk, WEIGHTS };
