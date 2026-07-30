'use strict';

const { scoreDoctor, buildAdvice, checkOk, WEIGHTS } = require('../src/lib/score');

describe('scoreDoctor', () => {
  test('scores full success as 100', () => {
    const result = scoreDoctor({
      dns: { ok: true },
      ping: { ok: true },
      tcp: [{ ok: true }, { ok: true }],
      http: { ok: true },
      tls: { ok: true, daysRemaining: 90 }
    });
    expect(result.score).toBe(100);
    expect(result.advice[0]).toMatch(/健康/);
  });

  test('returns 0 when all fail', () => {
    const result = scoreDoctor({
      dns: { ok: false },
      ping: { ok: false },
      tcp: [{ ok: false }],
      http: { ok: false },
      tls: { ok: false }
    });
    expect(result.score).toBe(0);
    expect(result.advice.length).toBeGreaterThan(1);
  });

  test('weights DNS failure correctly', () => {
    const result = scoreDoctor({
      dns: { ok: false },
      ping: { ok: true },
      tcp: [{ ok: true }],
      http: { ok: true },
      tls: { ok: true, daysRemaining: 30 }
    });
    expect(result.score).toBe(75);
    expect(result.parts.dns.ok).toBe(false);
  });

  test('warns when certificate expires soon', () => {
    const advice = buildAdvice({
      dns: { ok: true },
      ping: { ok: true },
      tcp: [{ ok: true }],
      http: { ok: true },
      tls: { ok: true, daysRemaining: 7 }
    });
    expect(advice.some((line) => line.includes('7 天'))).toBe(true);
  });

  test('checkOk handles tcp arrays', () => {
    expect(checkOk('tcp', [{ ok: true }, { ok: true }])).toBe(true);
    expect(checkOk('tcp', [{ ok: true }, { ok: false }])).toBe(false);
    expect(checkOk('tcp', [])).toBe(false);
  });

  test('exports weights totaling 100', () => {
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });
});
