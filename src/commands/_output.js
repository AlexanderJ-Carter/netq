'use strict';

/**
 * Print structured JSON for a command result.
 * Schema: { ok, command, ts, data }
 * @param {string} command
 * @param {boolean} ok
 * @param {Object} [data]
 */
function printJson(command, ok, data = {}) {
  console.log(
    JSON.stringify(
      {
        ok,
        command,
        ts: new Date().toISOString(),
        data
      },
      null,
      2
    )
  );
}

/**
 * Create a spinner-aware result helper context.
 * @param {Object} options
 * @param {boolean} options.jsonMode
 * @param {boolean} [options.quiet]
 * @returns {{jsonMode: boolean, quiet: boolean}}
 */
function outputOpts({ jsonMode = false, quiet = false } = {}) {
  return { jsonMode: Boolean(jsonMode), quiet: Boolean(quiet) };
}

module.exports = { printJson, outputOpts };
