'use strict';

const { normalizeHost, normalizePort, normalizeUrl } = require('../src/core');

describe('normalizeHost', () => {
  test('returns trimmed string', () => {
    expect(normalizeHost('  example.com  ')).toBe('example.com');
  });

  test('handles numeric host (IP)', () => {
    expect(normalizeHost('192.168.1.1')).toBe('192.168.1.1');
  });

  test('handles IPv6 address', () => {
    expect(normalizeHost('::1')).toBe('::1');
  });

  test('handles localhost', () => {
    expect(normalizeHost('localhost')).toBe('localhost');
  });

  test('throws on empty string', () => {
    expect(() => normalizeHost('')).toThrow('目标不能为空');
  });

  test('throws on whitespace only', () => {
    expect(() => normalizeHost('   ')).toThrow('目标不能为空');
  });

  test('throws on null', () => {
    expect(() => normalizeHost(null)).toThrow('目标不能为空');
  });

  test('throws on undefined', () => {
    expect(() => normalizeHost(undefined)).toThrow('目标不能为空');
  });
});

describe('normalizePort', () => {
  test('parses valid port number', () => {
    expect(normalizePort(80)).toBe(80);
  });

  test('parses string port number', () => {
    expect(normalizePort('443')).toBe(443);
  });

  test('trims whitespace from string', () => {
    expect(normalizePort('  8080  ')).toBe(8080);
  });

  test('accepts minimum port (1)', () => {
    expect(normalizePort(1)).toBe(1);
  });

  test('accepts maximum port (65535)', () => {
    expect(normalizePort(65535)).toBe(65535);
  });

  test('throws on port 0', () => {
    expect(() => normalizePort(0)).toThrow('端口必须是 1-65535 的整数');
  });

  test('throws on negative port', () => {
    expect(() => normalizePort(-1)).toThrow('端口必须是 1-65535 的整数');
  });

  test('throws on port above 65535', () => {
    expect(() => normalizePort(65536)).toThrow('端口必须是 1-65535 的整数');
  });

  test('throws on non-integer', () => {
    expect(() => normalizePort(80.5)).toThrow('端口必须是 1-65535 的整数');
  });

  test('throws on non-numeric string', () => {
    expect(() => normalizePort('abc')).toThrow('端口必须是 1-65535 的整数');
  });
});

describe('normalizeUrl', () => {
  test('parses valid HTTP URL', () => {
    const url = normalizeUrl('http://example.com/path');
    expect(url.href).toBe('http://example.com/path');
  });

  test('parses valid HTTPS URL', () => {
    const url = normalizeUrl('https://example.com/path?query=1');
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('example.com');
  });

  test('trims whitespace', () => {
    const url = normalizeUrl('  https://example.com  ');
    expect(url.hostname).toBe('example.com');
  });

  test('throws on empty string', () => {
    expect(() => normalizeUrl('')).toThrow('URL 不能为空');
  });

  test('throws on whitespace only', () => {
    expect(() => normalizeUrl('   ')).toThrow('URL 不能为空');
  });

  test('throws on invalid URL format', () => {
    expect(() => normalizeUrl('not-a-url')).toThrow('URL 格式不正确');
  });

  test('throws on non-HTTP protocol', () => {
    // The function correctly throws "仅支持 http/https" for non-HTTP protocols
    expect(() => normalizeUrl('ftp://example.com')).toThrow('仅支持 http/https');
  });

  test('throws on file protocol', () => {
    expect(() => normalizeUrl('file:///path')).toThrow('仅支持 http/https');
  });
});
