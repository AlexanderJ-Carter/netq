'use strict';

const DEBUG = process.env.NETQ_DEBUG === '1' || process.env.NETQ_DEBUG === 'true';

/**
 * Log a debug message when NETQ_DEBUG is enabled.
 * @param {string} message
 */
function debugLog(message) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.error(`[DEBUG] ${new Date().toISOString()} ${message}`);
  }
}

module.exports = { debugLog, DEBUG };
