'use strict';

const { decodeOutput } = require('../src/lib/run-command');

describe('decodeOutput', () => {
  test('returns empty string for empty buffer', () => {
    expect(decodeOutput(Buffer.alloc(0))).toBe('');
  });

  test('decodes utf8-compatible ascii', () => {
    expect(decodeOutput(Buffer.from('hello', 'utf8'))).toBe('hello');
  });

  test('decodes windows chinese ping sample as gb18030 on win32', () => {
    if (process.platform !== 'win32') return;
    // "正在" in GBK
    const buf = Buffer.from([0xd5, 0xfd, 0xd4, 0xda]);
    expect(decodeOutput(buf)).toBe('正在');
  });
});
