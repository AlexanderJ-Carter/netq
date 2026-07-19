/**
 * TypeScript type definitions for netq lib module
 * @module netq
 */

export function isWindows(): boolean;

export function normalizeHost(input: string | unknown): string;
export function normalizePort(input: number | string | unknown): number;
export function normalizeUrl(input: string | unknown): URL;
export function splitHostPort(s: string): { host: string; port: number };
export function parsePorts(input: string): number[];
export function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage?: string): Promise<T>;

export function fetchPublicIp(options?: { timeoutMs?: number }): Promise<string>;

export interface NetworkInterface {
  name: string;
  family: number | string;
  address: string;
  netmask: string;
  mac: string;
  internal: boolean;
}

export function getLocalInterfaces(): NetworkInterface[];

export interface DnsLookupResult {
  address: string;
  family: number;
}

export function dnsLookup(target: string, options?: { family?: number }): Promise<DnsLookupResult[]>;
export function dnsResolve(target: string, rrtype?: string): Promise<unknown[]>;

export interface CommandResult {
  ok: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  cmd: string;
}

export function runCommand(cmd: string, args: string[], options?: { timeoutMs?: number }): Promise<CommandResult>;
export function ping(target: string, options?: { count?: number; timeoutMs?: number }): Promise<CommandResult>;
export function traceroute(target: string, options?: { timeoutMs?: number }): Promise<CommandResult>;

export interface HttpCheckResult {
  url: string;
  status: number;
  statusText: string;
  location: string;
  ms: number;
  ip: string;
  ok: boolean;
  error?: string;
  resolved: Array<{ address: string; family: number }>;
  chain: Array<{
    url: string;
    status: number;
    statusText: string;
    location: string;
    ms: number;
    ip: string;
  }>;
}

export function httpCheck(
  urlInput: string,
  options?: { method?: 'HEAD' | 'GET'; timeoutMs?: number; followRedirects?: number }
): Promise<HttpCheckResult>;

export interface TcpCheckResult {
  host: string;
  port: number;
  ok: boolean;
  ms: number;
  error?: string;
}

export function tcpCheck(
  hostInput: string,
  portInput: number | string,
  options?: { timeoutMs?: number }
): Promise<TcpCheckResult>;

export function tcpBatchCheck(
  hostInput: string,
  ports: Array<number | string>,
  options?: { timeoutMs?: number; concurrency?: number }
): Promise<TcpCheckResult[]>;

export interface SystemNetInfoResult {
  command: string;
  ok: boolean;
  stdout: string;
  stderr: string;
}

export function systemNetInfo(options?: { timeoutMs?: number }): Promise<SystemNetInfoResult>;
export function listListeningPorts(options?: { timeoutMs?: number }): Promise<CommandResult>;

export interface ParsedPortEntry {
  proto: 'TCP' | 'UDP' | string;
  localAddr: string;
  localPort: number;
  state: string;
  pid: number;
  process?: string;
}

export function parseWindowsNetstat(stdout: string): ParsedPortEntry[];
export function parseSs(stdout: string): ParsedPortEntry[];
export function parseUnixNetstat(stdout: string): ParsedPortEntry[];
export function resolveWindowsProcessNames(
  pids: number[],
  options?: { timeoutMs?: number }
): Promise<Map<number, string>>;
