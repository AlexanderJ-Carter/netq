'use strict';

const { printJson } = require('../src/commands/_output');

describe('printJson', () => {
  test('prints ok/command/ts/data schema', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printJson('dns', true, { host: 'example.com' });
    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(spy.mock.calls[0][0]);
    expect(payload).toMatchObject({
      ok: true,
      command: 'dns',
      data: { host: 'example.com' }
    });
    expect(typeof payload.ts).toBe('string');
    spy.mockRestore();
  });
});
