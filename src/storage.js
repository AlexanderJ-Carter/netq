'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function configDir() {
  const home = os.homedir();
  return path.join(home, '.netq');
}

function configPath() {
  return path.join(configDir(), 'config.json');
}

function reportsDir() {
  return path.join(configDir(), 'reports');
}

function writeReportSync({ title, text, json }) {
  const dir = reportsDir();
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTitle = String(title || 'report')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'report';

  const base = path.join(dir, `${ts}-${safeTitle}`);
  const out = {};

  if (typeof text === 'string' && text.trim()) {
    const p = base + '.txt';
    fs.writeFileSync(p, text, 'utf8');
    out.textPath = p;
  }
  if (json !== undefined) {
    const p = base + '.json';
    fs.writeFileSync(p, JSON.stringify(json, null, 2), 'utf8');
    out.jsonPath = p;
  }
  return out;
}

function defaultConfig() {
  return {
    defaults: {
      tcpTimeoutMs: 2500,
      httpTimeoutMs: 6000,
      pingCount: 4
    },
    favorites: [
      { label: 'DNS: 1.1.1.1', type: 'ping', target: '1.1.1.1' },
      { label: 'DNS: 8.8.8.8', type: 'ping', target: '8.8.8.8' },
      { label: 'HTTP: https://www.baidu.com', type: 'http', target: 'https://www.baidu.com' },
      { label: 'TCP: github.com:443', type: 'tcp', target: 'github.com', port: 443 }
    ]
  };
}

function readConfigSync() {
  const p = configPath();
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    return mergeDefaults(parsed, defaultConfig());
  } catch {
    return defaultConfig();
  }
}

function writeConfigSync(cfg) {
  const dir = configDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2), 'utf8');
}

function mergeDefaults(cfg, def) {
  if (!cfg || typeof cfg !== 'object') return def;
  const out = { ...def, ...cfg };
  out.defaults = { ...def.defaults, ...(cfg.defaults || {}) };
  out.favorites = Array.isArray(cfg.favorites) ? cfg.favorites : def.favorites;
  return out;
}

module.exports = {
  configPath,
  reportsDir,
  readConfigSync,
  writeConfigSync,
  writeReportSync,
  defaultConfig
};

