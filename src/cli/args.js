'use strict';

/**
 * Parse CLI arguments into a structured options object
 * @param {string[]} args - Command line arguments (process.argv.slice(2))
 * @returns {Object} Parsed options
 */
function parseArgs(args) {
  const out = {
    interactive: true,
    help: false,
    version: false,
    json: false,
    quiet: false,
    noColor: false,
    command: null, // 'public-ip' | 'dns' | 'tcp' | 'http' | 'listening' | 'doctor'
    host: null,
    port: null,
    ports: null,
    url: null,
    helpCommand: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      // Check if next arg is a command name for command-specific help
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        out.helpCommand = nextArg;
        i++; // Skip the next arg
      } else {
        out.help = true;
      }
      out.interactive = false;
    } else if (arg === '-v' || arg === '--version') {
      out.version = true;
      out.interactive = false;
    } else if (arg === '-j' || arg === '--json') {
      out.json = true;
    } else if (arg === '-q' || arg === '--quiet') {
      out.quiet = true;
    } else if (arg === '--no-color') {
      out.noColor = true;
    } else if (arg === '--public-ip') {
      out.command = 'public-ip';
      out.interactive = false;
    } else if (arg === '--dns') {
      out.command = 'dns';
      out.host = args[++i] || null;
      out.interactive = false;
    } else if (arg === '--tcp') {
      out.command = 'tcp';
      out.host = args[++i] || null;
      const portRaw = args[++i];
      out.port = portRaw ? Number(portRaw) : null;
      out.interactive = false;
    } else if (arg === '--http') {
      out.command = 'http';
      out.url = args[++i] || null;
      out.interactive = false;
    } else if (arg === '--listening') {
      out.command = 'listening';
      out.interactive = false;
    } else if (arg === '--doctor') {
      out.command = 'doctor';
      out.host = args[++i] || null;
      out.interactive = false;
    } else if (arg === '-p' || arg === '--port') {
      const portRaw = args[++i];
      out.port = portRaw ? Number(portRaw) : null;
    } else if (arg === '--ports') {
      out.ports = args[++i] || null;
    }
    // Compatibility with old parameter formats
    else if (arg === '--tcp-json') {
      out.command = 'tcp';
      out.json = true;
      out.host = args[++i] || null;
      const portRaw = args[++i];
      out.port = portRaw ? Number(portRaw) : null;
      out.interactive = false;
    } else if (arg === '--http-json') {
      out.command = 'http';
      out.json = true;
      out.url = args[++i] || null;
      out.interactive = false;
    } else if (arg === '--listening-json') {
      out.command = 'listening';
      out.json = true;
      out.interactive = false;
    } else if (arg === '--doctor-json') {
      out.command = 'doctor';
      out.json = true;
      out.host = args[++i] || null;
      out.interactive = false;
    }
  }

  return out;
}

module.exports = { parseArgs };
