'use strict';

const ui = require('./ui');
const { parseArgs } = require('./cli/args');
const { showHelp, showCommandHelp } = require('./cli/help');
const { runPublicIp, runDns, runTcp, runHttp, runListening, runDoctor } = require('./commands');
const { interactiveMenu } = require('./interactive/menu');

const VERSION = require('../package.json').version;

/**
 * Main entry point for the CLI
 */
async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (process.env.NO_COLOR || opts.noColor) ui.setColorEnabled(false);

  if (opts.help) {
    showHelp();
    return;
  }

  if (opts.helpCommand) {
    showCommandHelp(opts.helpCommand);
    return;
  }

  if (opts.version) {
    console.log(`netq v${VERSION}`);
    return;
  }

  // Non-interactive mode
  if (!opts.interactive) {
    const commandOpts = { jsonMode: opts.json, quiet: opts.quiet };

    switch (opts.command) {
      case 'public-ip':
        return runPublicIp(commandOpts);
      case 'dns':
        if (!opts.host) {
          console.log(ui.err('请指定域名') + ui.dim('\n用法: netq --dns <域名>'));
          process.exitCode = 1;
          return;
        }
        return runDns(opts.host, commandOpts);
      case 'tcp':
        if (!opts.host || !Number.isFinite(opts.port) || opts.port < 1 || opts.port > 65535) {
          console.log(ui.err('请指定主机和端口') + ui.dim('\n用法: netq --tcp <主机> <端口>'));
          process.exitCode = 1;
          return;
        }
        return runTcp(opts.host, opts.port, commandOpts);
      case 'http':
        if (!opts.url) {
          console.log(ui.err('请指定 URL') + ui.dim('\n用法: netq --http <URL>'));
          process.exitCode = 1;
          return;
        }
        return runHttp(opts.url, commandOpts);
      case 'listening':
        return runListening({ ...commandOpts, filterPort: opts.port });
      case 'doctor':
        if (!opts.host) {
          console.log(ui.err('请指定目标主机') + ui.dim('\n用法: netq --doctor <主机>'));
          process.exitCode = 1;
          return;
        }
        return runDoctor(opts.host, { ...commandOpts, portsInput: opts.ports });
      default:
        showHelp();
    }
    return;
  }

  // Interactive mode
  await interactiveMenu();
}

module.exports = { main };
