'use strict';

const { daysRemaining, formatCertName, collectSans } = require('../src/lib/tls');

describe('tls helpers', () => {
  test('daysRemaining computes ceil days', () => {
    const now = Date.parse('2026-07-30T00:00:00.000Z');
    const inTenDays = '2026-08-09T00:00:00.000Z';
    expect(daysRemaining(inTenDays, now)).toBe(10);
  });

  test('daysRemaining can be negative', () => {
    const now = Date.parse('2026-07-30T00:00:00.000Z');
    expect(daysRemaining('2026-07-20T00:00:00.000Z', now)).toBeLessThan(0);
  });

  test('formatCertName prefers CN', () => {
    expect(formatCertName({ CN: 'example.com', O: 'Example' })).toBe('example.com');
    expect(formatCertName('raw')).toBe('raw');
    expect(formatCertName(null)).toBe('');
  });

  test('collectSans parses string SANs', () => {
    expect(collectSans({ subjectaltname: 'DNS:a.com, DNS:b.com' })).toEqual([
      'DNS:a.com',
      'DNS:b.com'
    ]);
    expect(collectSans({ subjectaltname: ['DNS:a.com'] })).toEqual(['DNS:a.com']);
    expect(collectSans({})).toEqual([]);
  });
});
