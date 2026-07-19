'use strict';

jest.mock('ora', () => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis()
  };
  return jest.fn(() => spinner);
});

jest.mock('../src/lib', () => ({
  dnsLookup: jest.fn(async () => [{ address: '1.2.3.4', family: 4 }]),
  dnsResolve: jest.fn(async (_host, type) => {
    if (type === 'A') return ['1.2.3.4'];
    if (type === 'AAAA') return [];
    if (type === 'MX') return [{ exchange: 'mail.example.com', priority: 10 }];
    return [];
  })
}));

const lib = require('../src/lib');
const { runDns } = require('../src/commands/dns');

describe('runDns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns lookup/a/aaaa by default', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await runDns('example.com', { jsonMode: true });
    expect(result.ok).toBe(true);
    expect(result.lookup).toEqual([{ address: '1.2.3.4', family: 4 }]);
    expect(lib.dnsLookup).toHaveBeenCalledWith('example.com');
    spy.mockRestore();
  });

  test('supports --type MX', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await runDns('example.com', { jsonMode: true, type: 'MX' });
    expect(result.ok).toBe(true);
    expect(result.type).toBe('MX');
    expect(result.records).toEqual([{ exchange: 'mail.example.com', priority: 10 }]);
    spy.mockRestore();
  });

  test('rejects invalid type', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await runDns('example.com', { jsonMode: true, type: 'SOA' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/不支持的记录类型/);
    spy.mockRestore();
  });
});
