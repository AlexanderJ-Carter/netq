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
  parsePorts: jest.requireActual('../src/lib/normalize').parsePorts,
  tcpCheck: jest.fn(async (host, port) => ({ host, port, ok: true, ms: 12, error: '' })),
  tcpBatchCheck: jest.fn(async (host, ports) =>
    ports.map(port => ({
      host,
      port,
      ok: port === 443,
      ms: 5,
      error: port === 443 ? '' : 'ECONNREFUSED'
    }))
  )
}));

jest.mock('../src/storage', () => ({
  readConfigSync: () => ({
    defaults: { tcpTimeoutMs: 2500, httpTimeoutMs: 6000, pingCount: 4 },
    favorites: []
  })
}));

const lib = require('../src/lib');
const { runTcp } = require('../src/commands/tcp');

describe('runTcp', () => {
  beforeEach(() => jest.clearAllMocks());

  test('single port uses tcpCheck', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await runTcp('example.com', '443', { jsonMode: true });
    expect(lib.tcpCheck).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.results).toHaveLength(1);
    spy.mockRestore();
  });

  test('port list uses tcpBatchCheck', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await runTcp('example.com', '80,443', { jsonMode: true });
    expect(lib.tcpBatchCheck).toHaveBeenCalled();
    expect(result.results).toHaveLength(2);
    expect(result.ok).toBe(false);
    spy.mockRestore();
  });
});
