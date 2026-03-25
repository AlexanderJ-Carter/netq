'use strict';

const { parsePorts } = require('../src/core');

describe('parsePorts', () => {
  describe('single port', () => {
    test('parses single port number', () => {
      expect(parsePorts('80')).toEqual([80]);
    });

    test('parses single port with whitespace', () => {
      expect(parsePorts('  443  ')).toEqual([443]);
    });

    test('parses minimum valid port', () => {
      expect(parsePorts('1')).toEqual([1]);
    });

    test('parses maximum valid port', () => {
      expect(parsePorts('65535')).toEqual([65535]);
    });
  });

  describe('comma-separated ports', () => {
    test('parses comma-separated ports', () => {
      expect(parsePorts('80,443')).toEqual([80, 443]);
    });

    test('parses comma-separated ports with spaces', () => {
      expect(parsePorts('80, 443, 8080')).toEqual([80, 443, 8080]);
    });

    test('does not deduplicate ports', () => {
      expect(parsePorts('80,443,80,443')).toEqual([80, 443, 80, 443]);
    });
  });

  describe('port ranges', () => {
    test('parses port range', () => {
      expect(parsePorts('3000-3003')).toEqual([3000, 3001, 3002, 3003]);
    });

    test('parses port range in reverse order', () => {
      expect(parsePorts('3003-3000')).toEqual([3000, 3001, 3002, 3003]);
    });

    test('parses mixed ports and ranges', () => {
      expect(parsePorts('80,443,3000-3002')).toEqual([80, 443, 3000, 3001, 3002]);
    });
  });

  describe('error handling', () => {
    test('throws on empty string', () => {
      expect(() => parsePorts('')).toThrow('端口列表不能为空');
    });

    test('throws on whitespace only', () => {
      expect(() => parsePorts('   ')).toThrow('端口列表不能为空');
    });

    test('throws on port below range', () => {
      expect(() => parsePorts('0')).toThrow('端口必须是 1-65535 的整数');
    });

    test('throws on port above range', () => {
      expect(() => parsePorts('65536')).toThrow('端口必须是 1-65535 的整数');
    });

    test('throws on negative port', () => {
      expect(() => parsePorts('-1')).toThrow('端口必须是 1-65535 的整数');
    });

    test('throws on non-numeric input', () => {
      expect(() => parsePorts('abc')).toThrow();
    });

    test('throws on range exceeding limit', () => {
      expect(() => parsePorts('1-2002')).toThrow('端口范围过大（最多 2000 个）');
    });
  });
});
