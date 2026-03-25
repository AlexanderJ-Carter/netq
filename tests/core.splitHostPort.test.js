'use strict';

const { splitHostPort } = require('../src/core');

describe('splitHostPort', () => {
  test('parses IPv4 with port', () => {
    expect(splitHostPort('192.168.1.1:80')).toEqual({ host: '192.168.1.1', port: 80 });
  });

  test('parses IPv4 wildcard with port', () => {
    expect(splitHostPort('0.0.0.0:443')).toEqual({ host: '0.0.0.0', port: 443 });
  });

  test('parses IPv6 bracketed address with port', () => {
    expect(splitHostPort('[::1]:8080')).toEqual({ host: '::1', port: 8080 });
  });

  test('parses IPv6 wildcard with port', () => {
    expect(splitHostPort('[::]:443')).toEqual({ host: '::', port: 443 });
  });

  test('handles address without port', () => {
    expect(splitHostPort('192.168.1.1')).toEqual({ host: '192.168.1.1', port: 0 });
  });

  test('handles empty string', () => {
    expect(splitHostPort('')).toEqual({ host: '', port: 0 });
  });

  test('handles only colon', () => {
    expect(splitHostPort(':')).toEqual({ host: ':', port: 0 });
  });

  test('handles port without host', () => {
    expect(splitHostPort(':8080')).toEqual({ host: ':8080', port: 0 });
  });

  test('handles IPv6 address without brackets (partial)', () => {
    // This is an edge case - IPv6 without brackets is ambiguous
    const result = splitHostPort('::1:8080');
    expect(result.host).toBe('::1');
    expect(result.port).toBe(8080);
  });

  test('handles localhost with port', () => {
    expect(splitHostPort('localhost:3000')).toEqual({ host: 'localhost', port: 3000 });
  });

  test('handles wildcard port', () => {
    expect(splitHostPort('*:80')).toEqual({ host: '*', port: 80 });
  });

  test('parses :::80 format (IPv6 wildcard)', () => {
    const result = splitHostPort(':::80');
    expect(result.host).toBe('::');
    expect(result.port).toBe(80);
  });
});
