'use strict';

const { normalizeRecords } = require('../src/lib/dns-compare');

describe('dns-compare helpers', () => {
  test('normalizeRecords sorts unique A records', () => {
    expect(normalizeRecords(['2.2.2.2', '1.1.1.1', '1.1.1.1'], 'A')).toEqual(['1.1.1.1', '2.2.2.2']);
  });

  test('normalizeRecords formats MX', () => {
    expect(
      normalizeRecords(
        [
          { exchange: 'mail.example.com', priority: 10 },
          { exchange: 'mail2.example.com', priority: 20 }
        ],
        'MX'
      )
    ).toEqual(['10 mail.example.com', '20 mail2.example.com']);
  });

  test('normalizeRecords formats SRV', () => {
    expect(normalizeRecords([{ name: 'sip.example.com', priority: 0, port: 5060 }], 'SRV')).toEqual([
      '0 5060 sip.example.com'
    ]);
  });
});
