'use strict';

const { parseArgs } = require('../src/cli/args');

describe('parseArgs', () => {
  describe('defaults', () => {
    test('empty args enter interactive mode', () => {
      const result = parseArgs([]);
      expect(result.interactive).toBe(true);
      expect(result.command).toBe('interactive');
    });
  });

  describe('help and version', () => {
    test('parses --help', () => {
      const result = parseArgs(['--help']);
      expect(result.help).toBe(true);
    });

    test('parses -h with command', () => {
      const result = parseArgs(['-h', 'tcp']);
      expect(result.help).toBe(true);
      expect(result.helpCommand).toBe('tcp');
    });

    test('parses help subcommand', () => {
      const result = parseArgs(['help', 'doctor']);
      expect(result.help).toBe(true);
      expect(result.helpCommand).toBe('doctor');
    });

    test('parses --version and -v', () => {
      expect(parseArgs(['--version']).version).toBe(true);
      expect(parseArgs(['-v']).version).toBe(true);
    });
  });

  describe('subcommands', () => {
    test('parses public-ip', () => {
      const result = parseArgs(['public-ip', '--json']);
      expect(result.command).toBe('public-ip');
      expect(result.json).toBe(true);
      expect(result.interactive).toBe(false);
    });

    test('parses dns with type', () => {
      const result = parseArgs(['dns', 'example.com', '--type', 'MX', '-q']);
      expect(result.command).toBe('dns');
      expect(result.host).toBe('example.com');
      expect(result.type).toBe('MX');
      expect(result.quiet).toBe(true);
    });

    test('parses ping with count', () => {
      const result = parseArgs(['ping', '1.1.1.1', '-c', '4']);
      expect(result.command).toBe('ping');
      expect(result.host).toBe('1.1.1.1');
      expect(result.count).toBe(4);
    });

    test('parses traceroute', () => {
      const result = parseArgs(['traceroute', 'github.com']);
      expect(result.command).toBe('traceroute');
      expect(result.host).toBe('github.com');
    });

    test('parses tcp with port list', () => {
      const result = parseArgs(['tcp', 'example.com', '80,443,3000-3010', '--json']);
      expect(result.command).toBe('tcp');
      expect(result.host).toBe('example.com');
      expect(result.ports).toBe('80,443,3000-3010');
      expect(result.json).toBe(true);
    });

    test('parses http with method', () => {
      const result = parseArgs(['http', 'https://example.com', '--method', 'GET']);
      expect(result.command).toBe('http');
      expect(result.url).toBe('https://example.com');
      expect(result.method).toBe('GET');
    });

    test('parses listening with port filter', () => {
      const result = parseArgs(['listening', '--port', '3000']);
      expect(result.command).toBe('listening');
      expect(result.port).toBe(3000);
    });

    test('parses doctor with ports and export', () => {
      const result = parseArgs(['doctor', 'example.com', '--ports', '80,443', '--export']);
      expect(result.command).toBe('doctor');
      expect(result.host).toBe('example.com');
      expect(result.ports).toBe('80,443');
      expect(result.exportReport).toBe(true);
    });

    test('parses interfaces --system', () => {
      const result = parseArgs(['interfaces', '--system']);
      expect(result.command).toBe('interfaces');
      expect(result.system).toBe(true);
    });

    test('parses interactive', () => {
      const result = parseArgs(['interactive']);
      expect(result.command).toBe('interactive');
      expect(result.interactive).toBe(true);
    });

    test('parses tls with port', () => {
      const result = parseArgs(['tls', 'example.com', '--port', '8443', '--json']);
      expect(result.command).toBe('tls');
      expect(result.host).toBe('example.com');
      expect(result.port).toBe(8443);
      expect(result.json).toBe(true);
    });

    test('parses dns-compare with type', () => {
      const result = parseArgs(['dns-compare', 'example.com', '--type', 'AAAA']);
      expect(result.command).toBe('dns-compare');
      expect(result.host).toBe('example.com');
      expect(result.type).toBe('AAAA');
    });

    test('parses watch with interval and count', () => {
      const result = parseArgs([
        'watch',
        '1.1.1.1',
        '--interval',
        '1500',
        '-c',
        '5',
        '--port',
        '443'
      ]);
      expect(result.command).toBe('watch');
      expect(result.host).toBe('1.1.1.1');
      expect(result.interval).toBe(1500);
      expect(result.count).toBe(5);
      expect(result.port).toBe(443);
    });
  });

  describe('favorites', () => {
    test('defaults to list', () => {
      const result = parseArgs(['favorites']);
      expect(result.command).toBe('favorites');
      expect(result.favoritesAction).toBe('list');
    });

    test('parses add with positionals', () => {
      const result = parseArgs(['favorites', 'add', 'tcp', 'github.com', '443', '--label', 'GH']);
      expect(result.favoritesAction).toBe('add');
      expect(result.favoriteType).toBe('tcp');
      expect(result.favoriteTarget).toBe('github.com');
      expect(result.favoritePort).toBe(443);
      expect(result.favoriteLabel).toBe('GH');
    });

    test('parses remove and run by index', () => {
      expect(parseArgs(['favorites', 'remove', '2']).favoriteIndex).toBe(2);
      expect(parseArgs(['favorites', 'run', '1']).favoriteIndex).toBe(1);
    });
  });

  describe('errors', () => {
    test('unknown command', () => {
      const result = parseArgs(['foobar']);
      expect(result.error).toMatch(/未知命令/);
    });

    test('legacy flag style rejected', () => {
      const result = parseArgs(['--dns', 'example.com']);
      expect(result.error).toMatch(/未知选项/);
    });

    test('unknown option on command', () => {
      const result = parseArgs(['dns', 'example.com', '--nope']);
      expect(result.error).toMatch(/未知选项/);
    });
  });
});
