'use strict';

/**
 * Check if the current platform is Windows.
 * @returns {boolean}
 */
function isWindows() {
  return process.platform === 'win32';
}

module.exports = { isWindows };
