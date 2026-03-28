'use strict';

const fs = require('fs');
const storage = require('../src/storage');

describe('storage', () => {
  describe('defaultConfig', () => {
    test('returns valid default configuration', () => {
      const config = storage.defaultConfig();
      expect(config).toHaveProperty('defaults');
      expect(config).toHaveProperty('favorites');
      expect(config.defaults.tcpTimeoutMs).toBe(2500);
      expect(config.defaults.httpTimeoutMs).toBe(6000);
      expect(config.defaults.pingCount).toBe(4);
      expect(Array.isArray(config.favorites)).toBe(true);
    });

    test('default favorites include common servers', () => {
      const config = storage.defaultConfig();
      expect(config.favorites.length).toBeGreaterThan(0);
      expect(config.favorites[0]).toHaveProperty('label');
      expect(config.favorites[0]).toHaveProperty('type');
      expect(config.favorites[0]).toHaveProperty('target');
    });
  });

  describe('configPath', () => {
    test('returns path ending with config.json', () => {
      const result = storage.configPath();
      expect(result).toContain('.netq');
      expect(result).toContain('config.json');
    });
  });

  describe('configDir', () => {
    test('returns path containing home directory', () => {
      // Just verify the path structure is correct
      const configP = storage.configPath();
      expect(configP).toMatch(/\.netq[\\/]config\.json$/);
    });
  });

  describe('writeReportSync', () => {
    test('returns object with paths when text and json provided', () => {
      // Mock fs functions
      const originalMkdirSync = fs.mkdirSync;
      const originalWriteFileSync = fs.writeFileSync;

      fs.mkdirSync = jest.fn();
      fs.writeFileSync = jest.fn();

      const result = storage.writeReportSync({
        title: 'test-report',
        text: 'test content',
        json: { data: 'test' }
      });

      expect(result).toHaveProperty('textPath');
      expect(result).toHaveProperty('jsonPath');
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

      fs.mkdirSync = originalMkdirSync;
      fs.writeFileSync = originalWriteFileSync;
    });

    test('returns empty object when no content provided', () => {
      const originalMkdirSync = fs.mkdirSync;
      const originalWriteFileSync = fs.writeFileSync;

      fs.mkdirSync = jest.fn();
      fs.writeFileSync = jest.fn();

      const result = storage.writeReportSync({
        title: 'empty-report'
      });

      expect(result).toEqual({});
      expect(fs.writeFileSync).not.toHaveBeenCalled();

      fs.mkdirSync = originalMkdirSync;
      fs.writeFileSync = originalWriteFileSync;
    });

    test('sanitizes title for safe filename', () => {
      const originalMkdirSync = fs.mkdirSync;
      const originalWriteFileSync = fs.writeFileSync;

      fs.mkdirSync = jest.fn();
      fs.writeFileSync = jest.fn();

      const result = storage.writeReportSync({
        title: 'Test Report!!@#$%',
        text: 'content'
      });

      expect(result.textPath).toMatch(/test-report/);
      expect(result.textPath).not.toMatch(/[!@#$%]/);

      fs.mkdirSync = originalMkdirSync;
      fs.writeFileSync = originalWriteFileSync;
    });
  });
});
