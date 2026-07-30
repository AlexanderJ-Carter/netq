'use strict';

const ui = require('./ui');
const { parseArgs } = require('./cli/args');
const { showHelp, showCommandHelp } = require('./cli/help');
const {
  runPublicIp,
  runDns,
  runTcp,
  runHttp,
  runListening,
  runDoctor,
  runPing,
  runTraceroute,
  runInterfaces,
  runFavoritesList,
  runFavoritesAdd,
  runFavoritesRemove,
  runFavoritesRun,
  runTls,
  runDnsCompare,
  runWatch
} = require('./commands');
const { interactiveMenu } = require('./interactive/menu');

const VERSION = require('../package.json').version;

/**
 * Apply exit code from a command result.
 * @param {{ok?: boolean}|null|undefined} result
 */
function applyExit(result) {
  if (result && result.ok === false) process.exitCode = 1;
}

/**
 * Fail fast with message and example.
 * @param {string} message
 * @param {string} example
 */
function failUsage(message, example) {
  console.log(ui.err(message) + ui.dim(`\n示例: ${example}`));
  process.exitCode = 1;
}

/**
 * Main CLI entry.
 */
async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (process.env.NO_COLOR || opts.noColor) ui.setColorEnabled(false);

  if (opts.error) {
    console.log(ui.err(opts.error));
    process.exitCode = 1;
    return;
  }

  if (opts.version) {
    console.log(`netq v${VERSION}`);
    return;
  }

  if (opts.help) {
    if (opts.helpCommand) {
      const ok = showCommandHelp(opts.helpCommand);
      if (!ok) process.exitCode = 1;
    } else {
      showHelp();
    }
    return;
  }

  if (opts.interactive || opts.command === 'interactive') {
    await interactiveMenu();
    return;
  }

  const common = { jsonMode: opts.json, quiet: opts.quiet };

  switch (opts.command) {
    case 'public-ip':
      return applyExit(await runPublicIp(common));

    case 'interfaces':
      return applyExit(await runInterfaces({ ...common, system: opts.system }));

    case 'dns':
      if (!opts.host) return failUsage('请指定主机', 'netq dns github.com');
      return applyExit(await runDns(opts.host, { ...common, type: opts.type }));

    case 'dns-compare':
      if (!opts.host) return failUsage('请指定主机', 'netq dns-compare github.com');
      return applyExit(await runDnsCompare(opts.host, { ...common, type: opts.type || 'A' }));

    case 'ping':
      if (!opts.host) return failUsage('请指定主机', 'netq ping 1.1.1.1');
      return applyExit(await runPing(opts.host, { ...common, count: opts.count }));

    case 'traceroute':
      if (!opts.host) return failUsage('请指定主机', 'netq traceroute github.com');
      return applyExit(await runTraceroute(opts.host, common));

    case 'tcp':
      if (!opts.host || !opts.ports) {
        return failUsage('请指定主机和端口列表', 'netq tcp github.com 443');
      }
      return applyExit(await runTcp(opts.host, opts.ports, common));

    case 'http':
      if (!opts.url) return failUsage('请指定 URL', 'netq http https://github.com');
      return applyExit(await runHttp(opts.url, { ...common, method: opts.method || 'HEAD' }));

    case 'tls':
      if (!opts.host) return failUsage('请指定主机', 'netq tls github.com');
      return applyExit(await runTls(opts.host, { ...common, port: opts.port || 443 }));

    case 'listening':
      return applyExit(await runListening({ ...common, filterPort: opts.port }));

    case 'doctor':
      if (!opts.host) return failUsage('请指定目标主机', 'netq doctor github.com');
      return applyExit(
        await runDoctor(opts.host, {
          ...common,
          portsInput: opts.ports,
          exportReport: opts.exportReport
        })
      );

    case 'watch':
      if (!opts.host) return failUsage('请指定主机', 'netq watch 1.1.1.1');
      return applyExit(
        await runWatch(opts.host, {
          ...common,
          port: opts.port || 443,
          intervalMs: opts.interval || 2000,
          count: opts.count
        })
      );

    case 'favorites':
      return applyExit(await dispatchFavorites(opts, common));

    default:
      showHelp();
      process.exitCode = 1;
  }
}

/**
 * Dispatch favorites sub-actions.
 * @param {Object} opts
 * @param {Object} common
 */
async function dispatchFavorites(opts, common) {
  switch (opts.favoritesAction) {
    case 'list':
      return runFavoritesList(common);
    case 'add':
      if (!opts.favoriteType || !opts.favoriteTarget) {
        failUsage(
          '用法: netq favorites add <type> <target> [port] [--label <标签>]',
          'netq favorites add ping 1.1.1.1 --label "CF"'
        );
        return { ok: false };
      }
      return runFavoritesAdd(
        {
          type: opts.favoriteType,
          target: opts.favoriteTarget,
          port: opts.favoritePort ?? opts.port,
          label: opts.favoriteLabel
        },
        common
      );
    case 'remove':
      if (opts.favoriteIndex === null || opts.favoriteIndex === undefined) {
        failUsage('用法: netq favorites remove <index>', 'netq favorites remove 1');
        return { ok: false };
      }
      return runFavoritesRemove(opts.favoriteIndex, common);
    case 'run':
      if (opts.favoriteIndex === null || opts.favoriteIndex === undefined) {
        failUsage('用法: netq favorites run <index>', 'netq favorites run 1');
        return { ok: false };
      }
      return runFavoritesRun(opts.favoriteIndex, common);
    default:
      failUsage('用法: netq favorites list|add|remove|run', 'netq favorites list');
      return { ok: false };
  }
}

module.exports = { main };
