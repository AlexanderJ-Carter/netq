'use strict';

const { isWindows } = require('./platform');
const {
  normalizeHost,
  normalizePort,
  normalizeUrl,
  parsePorts,
  splitHostPort,
  withTimeout
} = require('./normalize');
const { runCommand, decodeOutput } = require('./run-command');
const { dnsLookup, dnsResolve } = require('./dns');
const { fetchPublicIp } = require('./public-ip');
const { getLocalInterfaces, systemNetInfo } = require('./interfaces');
const { ping, traceroute } = require('./ping');
const { httpCheck } = require('./http');
const { tcpCheck, tcpBatchCheck } = require('./tcp');
const {
  listListeningPorts,
  parseWindowsNetstat,
  parseSs,
  parseUnixNetstat,
  resolveWindowsProcessNames
} = require('./listening');

module.exports = {
  isWindows,
  normalizeHost,
  normalizePort,
  normalizeUrl,
  parsePorts,
  splitHostPort,
  withTimeout,
  runCommand,
  decodeOutput,
  dnsLookup,
  dnsResolve,
  fetchPublicIp,
  getLocalInterfaces,
  systemNetInfo,
  ping,
  traceroute,
  httpCheck,
  tcpCheck,
  tcpBatchCheck,
  listListeningPorts,
  parseWindowsNetstat,
  parseSs,
  parseUnixNetstat,
  resolveWindowsProcessNames
};
