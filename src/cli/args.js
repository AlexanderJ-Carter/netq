'use strict';

const COMMANDS = new Set([
  'interactive',
  'public-ip',
  'interfaces',
  'dns',
  'ping',
  'traceroute',
  'tcp',
  'http',
  'listening',
  'doctor',
  'favorites',
  'help'
]);

const FAVORITE_ACTIONS = new Set(['list', 'add', 'remove', 'run']);

/**
 * Parse CLI arguments into a structured options object (subcommand style).
 * @param {string[]} args - process.argv.slice(2)
 * @returns {Object}
 */
function parseArgs(args) {
  const out = {
    interactive: false,
    help: false,
    version: false,
    json: false,
    quiet: false,
    noColor: false,
    command: null,
    helpCommand: null,
    host: null,
    port: null,
    ports: null,
    url: null,
    type: null,
    count: null,
    method: null,
    system: false,
    exportReport: false,
    favoritesAction: null,
    favoriteLabel: null,
    favoriteType: null,
    favoriteTarget: null,
    favoritePort: null,
    favoriteIndex: null,
    error: null
  };

  if (!args || args.length === 0) {
    out.interactive = true;
    out.command = 'interactive';
    return out;
  }

  let i = 0;
  const first = args[0];

  if (first === '-h' || first === '--help') {
    out.help = true;
    if (args[1] && !args[1].startsWith('-') && COMMANDS.has(args[1])) {
      out.helpCommand = args[1];
    }
    return out;
  }

  if (first === '-v' || first === '--version') {
    out.version = true;
    return out;
  }

  if (first.startsWith('-')) {
    out.error = `未知选项: ${first}\n用法: netq <命令> [参数]\n运行 netq help 查看命令列表`;
    return out;
  }

  if (!COMMANDS.has(first)) {
    out.error = `未知命令: ${first}\n运行 netq help 查看命令列表`;
    return out;
  }

  out.command = first;
  i = 1;

  if (first === 'help') {
    out.help = true;
    if (args[1] && !args[1].startsWith('-')) {
      out.helpCommand = args[1];
    }
    return out;
  }

  if (first === 'interactive') {
    out.interactive = true;
    return out;
  }

  if (first === 'favorites') {
    const action = args[i];
    if (!action || action.startsWith('-')) {
      out.favoritesAction = 'list';
    } else if (!FAVORITE_ACTIONS.has(action)) {
      out.error =
        `未知 favorites 操作: ${action}\n用法: netq favorites list|add|remove|run\n示例: netq favorites list`;
      return out;
    } else {
      out.favoritesAction = action;
      i++;
    }
  }

  while (i < args.length) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      out.help = true;
      out.helpCommand = out.command;
      return out;
    }
    if (arg === '-j' || arg === '--json') {
      out.json = true;
      i++;
      continue;
    }
    if (arg === '-q' || arg === '--quiet') {
      out.quiet = true;
      i++;
      continue;
    }
    if (arg === '--no-color') {
      out.noColor = true;
      i++;
      continue;
    }
    if (arg === '--system') {
      out.system = true;
      i++;
      continue;
    }
    if (arg === '--export') {
      out.exportReport = true;
      i++;
      continue;
    }
    if (arg === '--type') {
      out.type = args[++i] || null;
      i++;
      continue;
    }
    if (arg === '-c' || arg === '--count') {
      const raw = args[++i];
      out.count = raw !== undefined && raw !== null ? Number(raw) : null;
      i++;
      continue;
    }
    if (arg === '--method') {
      out.method = args[++i] || null;
      i++;
      continue;
    }
    if (arg === '-p' || arg === '--port') {
      const raw = args[++i];
      out.port = raw !== undefined && raw !== null ? Number(raw) : null;
      i++;
      continue;
    }
    if (arg === '--ports') {
      out.ports = args[++i] || null;
      i++;
      continue;
    }
    if (arg === '--label') {
      out.favoriteLabel = args[++i] || null;
      i++;
      continue;
    }
    if (arg === '--fav-type') {
      out.favoriteType = args[++i] || null;
      i++;
      continue;
    }
    if (arg === '--target') {
      out.favoriteTarget = args[++i] || null;
      i++;
      continue;
    }
    if (arg === '--index') {
      const raw = args[++i];
      out.favoriteIndex = raw !== undefined && raw !== null ? Number(raw) : null;
      i++;
      continue;
    }

    if (arg.startsWith('-')) {
      out.error = `未知选项: ${arg}`;
      return out;
    }

    // Positional arguments by command
    if (out.command === 'dns' || out.command === 'ping' || out.command === 'traceroute' || out.command === 'doctor') {
      if (!out.host) {
        out.host = arg;
        i++;
        continue;
      }
    }
    if (out.command === 'tcp') {
      if (!out.host) {
        out.host = arg;
        i++;
        continue;
      }
      if (out.ports === null) {
        out.ports = arg;
        i++;
        continue;
      }
    }
    if (out.command === 'http') {
      if (!out.url) {
        out.url = arg;
        i++;
        continue;
      }
    }
    if (out.command === 'favorites') {
      if (out.favoritesAction === 'add') {
        if (!out.favoriteType) {
          out.favoriteType = arg;
          i++;
          continue;
        }
        if (!out.favoriteTarget) {
          out.favoriteTarget = arg;
          i++;
          continue;
        }
        if (out.favoritePort === null && /^\d+$/.test(arg)) {
          out.favoritePort = Number(arg);
          i++;
          continue;
        }
      }
      if (
        (out.favoritesAction === 'remove' || out.favoritesAction === 'run') &&
        out.favoriteIndex === null
      ) {
        out.favoriteIndex = Number(arg);
        i++;
        continue;
      }
    }

    out.error = `多余参数: ${arg}`;
    return out;
  }

  return out;
}

module.exports = { parseArgs, COMMANDS, FAVORITE_ACTIONS };
