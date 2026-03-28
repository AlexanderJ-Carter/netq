'use strict';

const { parseArgs } = require('../src/cli/args');

describe('parseArgs', () => {
  describe('help and version', () => {
    test('parses --help flag', () => {
      const result = parseArgs(['--help']);
      expect(result.help).toBe(true);
      expect(result.interactive).toBe(false);
    });

    test('parses -h flag', () => {
      const result = parseArgs(['-h']);
      expect(result.help).toBe(true);
      expect(result.interactive).toBe(false);
    });

    test('parses --version flag', () => {
      const result = parseArgs(['--version']);
      expect(result.version).toBe(true);
      expect(result.interactive).toBe(false);
    });

    test('parses -v flag', () => {
      const result = parseArgs(['-v']);
      expect(result.version).toBe(true);
      expect(result.interactive).toBe(false);
    });

    test('parses help with command name for command-specific help', () => {
      const result = parseArgs(['--help', 'tcp']);
      expect(result.help).toBe(false);
      expect(result.helpCommand).toBe('tcp');
      expect(result.interactive).toBe(false);
    });
  });

  describe('output flags', () => {
    test('parses --json flag', () => {
      const result = parseArgs(['--json']);
      expect(result.json).toBe(true);
    });

    test('parses -j flag', () => {
      const result = parseArgs(['-j']);
      expect(result.json).toBe(true);
    });

    test('parses --quiet flag', () => {
      const result = parseArgs(['--quiet']);
      expect(result.quiet).toBe(true);
    });

    test('parses -q flag', () => {
      const result = parseArgs(['-q']);
      expect(result.quiet).toBe(true);
    });

    test('parses --no-color flag', () => {
      const result = parseArgs(['--no-color']);
      expect(result.noColor).toBe(true);
    });
  });

  describe('commands', () => {
    test('parses --public-ip command', () => {
      const result = parseArgs(['--public-ip']);
      expect(result.command).toBe('public-ip');
      expect(result.interactive).toBe(false);
    });

    test('parses --dns command with host', () => {
      const result = parseArgs(['--dns', 'example.com']);
      expect(result.command).toBe('dns');
      expect(result.host).toBe('example.com');
      expect(result.interactive).toBe(false);
    });

    test('parses --tcp command with host and port', () => {
      const result = parseArgs(['--tcp', 'example.com', '443']);
      expect(result.command).toBe('tcp');
      expect(result.host).toBe('example.com');
      expect(result.port).toBe(443);
      expect(result.interactive).toBe(false);
    });

    test('parses --http command with URL', () => {
      const result = parseArgs(['--http', 'https://example.com']);
      expect(result.command).toBe('http');
      expect(result.url).toBe('https://example.com');
      expect(result.interactive).toBe(false);
    });

    test('parses --listening command', () => {
      const result = parseArgs(['--listening']);
      expect(result.command).toBe('listening');
      expect(result.interactive).toBe(false);
    });

    test('parses --doctor command with host', () => {
      const result = parseArgs(['--doctor', 'example.com']);
      expect(result.command).toBe('doctor');
      expect(result.host).toBe('example.com');
      expect(result.interactive).toBe(false);
    });

    test('parses --ports option', () => {
      const result = parseArgs(['--ports', '80,443']);
      expect(result.ports).toBe('80,443');
    });

    test('parses -p option for port', () => {
      const result = parseArgs(['-p', '8080']);
      expect(result.port).toBe(8080);
    });
  });

  describe('legacy JSON commands', () => {
    test('parses --tcp-json command', () => {
      const result = parseArgs(['--tcp-json', 'example.com', '443']);
      expect(result.command).toBe('tcp');
      expect(result.json).toBe(true);
      expect(result.host).toBe('example.com');
      expect(result.port).toBe(443);
    });

    test('parses --http-json command', () => {
      const result = parseArgs(['--http-json', 'https://example.com']);
      expect(result.command).toBe('http');
      expect(result.json).toBe(true);
      expect(result.url).toBe('https://example.com');
    });

    test('parses --listening-json command', () => {
      const result = parseArgs(['--listening-json']);
      expect(result.command).toBe('listening');
      expect(result.json).toBe(true);
    });

    test('parses --doctor-json command', () => {
      const result = parseArgs(['--doctor-json', 'example.com']);
      expect(result.command).toBe('doctor');
      expect(result.json).toBe(true);
      expect(result.host).toBe('example.com');
    });
  });

  describe('default values', () => {
    test('returns default values for empty args', () => {
      const result = parseArgs([]);
      expect(result.interactive).toBe(true);
      expect(result.help).toBe(false);
      expect(result.version).toBe(false);
      expect(result.json).toBe(false);
      expect(result.quiet).toBe(false);
      expect(result.command).toBeNull();
      expect(result.host).toBeNull();
      expect(result.port).toBeNull();
    });
  });

  describe('edge cases', () => {
    test('handles missing host for --dns', () => {
      const result = parseArgs(['--dns']);
      expect(result.command).toBe('dns');
      expect(result.host).toBeNull();
    });

    test('handles missing URL for --http', () => {
      const result = parseArgs(['--http']);
      expect(result.command).toBe('http');
      expect(result.url).toBeNull();
    });

    test('handles combined flags', () => {
      const result = parseArgs(['--json', '--quiet', '--dns', 'example.com']);
      expect(result.json).toBe(true);
      expect(result.quiet).toBe(true);
      expect(result.command).toBe('dns');
      expect(result.host).toBe('example.com');
    });
  });
});
