'use strict';

const https = require('https');
const { withTimeout } = require('./normalize');

/**
 * Fetch the public IP address via api.ipify.org.
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=4000]
 * @returns {Promise<string>}
 */
async function fetchPublicIp({ timeoutMs = 4000 } = {}) {
  const req = new Promise((resolve, reject) => {
    const r = https.get('https://api.ipify.org?format=json', res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => (data += c));
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

module.exports = { fetchPublicIp };
