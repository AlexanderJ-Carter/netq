'use strict';

const mod = require('ora');
const ora = typeof mod === 'function' ? mod : mod.default;

module.exports = ora;
