#!/usr/bin/env node
'use strict';

const { main } = require('../src/main');

main().catch((err) => {
  // 尽量保证 CLI 不会静默失败
  const msg = err && err.stack ? err.stack : String(err);
  // eslint-disable-next-line no-console
  console.error(msg);
  process.exitCode = 1;
});

