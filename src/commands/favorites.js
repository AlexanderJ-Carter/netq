'use strict';

const ui = require('../ui');
const storage = require('../storage');
const { printJson } = require('./_output');
const { runPing } = require('./ping');
const { runTcp } = require('./tcp');
const { runHttp } = require('./http');
const { runDns } = require('./dns');
const { runDoctor } = require('./doctor');

const FAVORITE_TYPES = new Set(['ping', 'tcp', 'http', 'dns', 'doctor']);

/**
 * List favorites.
 * @param {Object} [options]
 * @param {boolean} [options.jsonMode]
 * @param {boolean} [options.quiet]
 * @returns {Promise<{ok: boolean, favorites: Array}>}
 */
async function runFavoritesList({ jsonMode = false, quiet = false } = {}) {
  const cfg = storage.readConfigSync();
  const favorites = cfg.favorites || [];

  if (jsonMode) {
    printJson('favorites', true, { action: 'list', favorites });
  } else if (!quiet) {
    console.log(ui.title('收藏夹'));
    if (favorites.length === 0) {
      console.log(ui.warn('暂无收藏'));
    } else {
      const rows = [['#', '标签', '类型', '目标']];
      favorites.forEach((f, i) => {
        const target = f.port !== undefined && f.port !== null ? `${f.target}:${f.port}` : f.target;
        rows.push([String(i + 1), f.label || '-', f.type || '-', target || '-']);
      });
      console.log(ui.listTable(rows[0], rows.slice(1)));
    }
  } else {
    for (const f of favorites) {
      const portSuffix = f.port !== undefined && f.port !== null ? ':' + f.port : '';
      console.log(`${f.type}\t${f.target}${portSuffix}\t${f.label || ''}`);
    }
  }

  return { ok: true, favorites };
}

/**
 * Add a favorite.
 * @param {Object} entry
 * @param {string} entry.label
 * @param {string} entry.type
 * @param {string} entry.target
 * @param {number} [entry.port]
 * @param {Object} [options]
 * @returns {Promise<{ok: boolean, favorites?: Array, error?: string}>}
 */
async function runFavoritesAdd(entry, { jsonMode = false, quiet = false } = {}) {
  const type = String(entry.type || '').toLowerCase();
  if (!FAVORITE_TYPES.has(type)) {
    const msg = `类型无效（可用: ${[...FAVORITE_TYPES].join(', ')}）`;
    if (jsonMode) printJson('favorites', false, { action: 'add', error: msg });
    else if (!quiet) console.log(ui.err(msg));
    return { ok: false, error: msg };
  }
  if (!entry.target) {
    const msg = '缺少 target';
    if (jsonMode) printJson('favorites', false, { action: 'add', error: msg });
    else if (!quiet) console.log(ui.err(msg));
    return { ok: false, error: msg };
  }
  if (
    type === 'tcp' &&
    (entry.port === undefined || entry.port === null || !Number.isFinite(Number(entry.port)))
  ) {
    const msg = 'tcp 类型需要 port';
    if (jsonMode) printJson('favorites', false, { action: 'add', error: msg });
    else if (!quiet) console.log(ui.err(msg));
    return { ok: false, error: msg };
  }

  const cfg = storage.readConfigSync();
  const item = {
    label: entry.label || `${type}: ${entry.target}`,
    type,
    target: entry.target
  };
  if (entry.port !== undefined && entry.port !== null) item.port = Number(entry.port);

  cfg.favorites = Array.isArray(cfg.favorites) ? cfg.favorites : [];
  cfg.favorites.push(item);
  storage.writeConfigSync(cfg);

  if (jsonMode) printJson('favorites', true, { action: 'add', item, favorites: cfg.favorites });
  else if (!quiet) console.log(ui.ok(`已添加: ${item.label}`));

  return { ok: true, favorites: cfg.favorites, item };
}

/**
 * Remove a favorite by 1-based index.
 * @param {number} index
 * @param {Object} [options]
 * @returns {Promise<{ok: boolean, favorites?: Array, error?: string}>}
 */
async function runFavoritesRemove(index, { jsonMode = false, quiet = false } = {}) {
  const cfg = storage.readConfigSync();
  const favorites = cfg.favorites || [];
  const i = Number(index) - 1;
  if (!Number.isInteger(i) || i < 0 || i >= favorites.length) {
    const msg = `索引无效（1-${favorites.length || 0}）`;
    if (jsonMode) printJson('favorites', false, { action: 'remove', error: msg });
    else if (!quiet) console.log(ui.err(msg));
    return { ok: false, error: msg };
  }

  const [removed] = favorites.splice(i, 1);
  cfg.favorites = favorites;
  storage.writeConfigSync(cfg);

  if (jsonMode) printJson('favorites', true, { action: 'remove', removed, favorites });
  else if (!quiet) console.log(ui.ok(`已删除: ${removed.label}`));

  return { ok: true, favorites, removed };
}

/**
 * Run a favorite by 1-based index.
 * @param {number} index
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
async function runFavoritesRun(index, { jsonMode = false, quiet = false } = {}) {
  const cfg = storage.readConfigSync();
  const favorites = cfg.favorites || [];
  const i = Number(index) - 1;
  if (!Number.isInteger(i) || i < 0 || i >= favorites.length) {
    const msg = `索引无效（1-${favorites.length || 0}）`;
    if (jsonMode) printJson('favorites', false, { action: 'run', error: msg });
    else if (!quiet) console.log(ui.err(msg));
    return { ok: false, error: msg };
  }

  const fav = favorites[i];
  const opts = { jsonMode, quiet };

  switch (fav.type) {
    case 'ping':
      return runPing(fav.target, opts);
    case 'tcp':
      return runTcp(fav.target, fav.port, opts);
    case 'http':
      return runHttp(fav.target, opts);
    case 'dns':
      return runDns(fav.target, opts);
    case 'doctor':
      return runDoctor(fav.target, opts);
    default:
      return { ok: false, error: `未知类型: ${fav.type}` };
  }
}

module.exports = {
  runFavoritesList,
  runFavoritesAdd,
  runFavoritesRemove,
  runFavoritesRun,
  FAVORITE_TYPES
};
