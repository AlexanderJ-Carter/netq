'use strict';

const { parseWindowsNetstat, parseSs, parseUnixNetstat } = require('../src/core');

describe('parseWindowsNetstat', () => {
  test('parses TCP connections', () => {
    const stdout = `
Proto  Local Address          Foreign Address        State           PID
TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       1234
TCP    192.168.1.1:443        10.0.0.1:54321         ESTABLISHED     5678
`;
    const result = parseWindowsNetstat(stdout);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      proto: 'TCP',
      localAddr: '0.0.0.0',
      localPort: 80,
      state: 'LISTENING',
      pid: 1234
    });
    expect(result[1]).toEqual({
      proto: 'TCP',
      localAddr: '192.168.1.1',
      localPort: 443,
      state: 'ESTABLISHED',
      pid: 5678
    });
  });

  test('parses UDP connections', () => {
    const stdout = `
Proto  Local Address          Foreign Address        State           PID
UDP    0.0.0.0:53             *:*                                    1234
UDP    [::]:123               *:*                                    5678
`;
    const result = parseWindowsNetstat(stdout);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      proto: 'UDP',
      localAddr: '0.0.0.0',
      localPort: 53,
      state: 'UDP',
      pid: 1234
    });
    expect(result[1]).toEqual({
      proto: 'UDP',
      localAddr: '::',
      localPort: 123,
      state: 'UDP',
      pid: 5678
    });
  });

  test('handles empty input', () => {
    expect(parseWindowsNetstat('')).toEqual([]);
    expect(parseWindowsNetstat('\n\n')).toEqual([]);
  });

  test('skips non-TCP/UDP lines', () => {
    const stdout = `
Active Connections
Proto  Local Address          Foreign Address        State           PID
TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       1234
`;
    const result = parseWindowsNetstat(stdout);
    expect(result).toHaveLength(1);
  });

  test('filters out invalid ports', () => {
    const stdout = 'TCP    0.0.0.0:abc             0.0.0.0:0              LISTENING       1234';
    const result = parseWindowsNetstat(stdout);
    expect(result).toHaveLength(0);
  });
});

describe('parseSs', () => {
  test('parses ss output', () => {
    const stdout = `
State      Recv-Q Send-Q Local Address:Port    Peer Address:Port Process
LISTEN     0      0          0.0.0.0:80         0.0.0.0:*      users:name="nginx",pid=1234,fd=6
LISTEN     0      0             [::]:443            [::]:*      users:name="nginx",pid=1234,fd=7
`;
    const result = parseSs(stdout);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      proto: 'TCP',
      localAddr: '0.0.0.0',
      localPort: 80,
      state: 'LISTEN',
      pid: 1234,
      process: 'users:name="nginx",pid=1234,fd=6'
    });
    expect(result[1]).toEqual({
      proto: 'TCP',
      localAddr: '::',
      localPort: 443,
      state: 'LISTEN',
      pid: 1234,
      process: 'users:name="nginx",pid=1234,fd=7'
    });
  });

  test('handles empty input', () => {
    expect(parseSs('')).toEqual([]);
  });

  test('skips header line', () => {
    const stdout = 'State      Recv-Q Send-Q Local Address:Port    Peer Address:Port Process';
    expect(parseSs(stdout)).toEqual([]);
  });
});

describe('parseUnixNetstat', () => {
  test('parses netstat output', () => {
    const stdout = `
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1234/nginx
tcp6       0      0 :::443                  :::*                    LISTEN      1234/nginx
udp        0      0 0.0.0.0:53              0.0.0.0:*                           5678/named
`;
    const result = parseUnixNetstat(stdout);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      proto: 'TCP',
      localAddr: '0.0.0.0',
      localPort: 80,
      state: 'LISTEN',
      pid: 1234,
      process: '1234/nginx'
    });
  });

  test('handles empty input', () => {
    expect(parseUnixNetstat('')).toEqual([]);
  });

  test('skips header line', () => {
    const stdout = 'Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name';
    expect(parseUnixNetstat(stdout)).toEqual([]);
  });
});
