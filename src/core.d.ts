/**
 * TypeScript type definitions for netq core module
 * @module netq/core
 */

/**
 * Check if the current platform is Windows
 */
export function isWindows(): boolean;

/**
 * Normalize and validate a host string
 * @param input - Input host string
 * @returns Normalized host string
 * @throws Error if input is empty or invalid
 */
export function normalizeHost(input: string | unknown): string;

/**
 * Normalize and validate a port number
 * @param input - Input port
 * @returns Valid port number (1-65535)
 * @throws Error if port is invalid or out of range
 */
export function normalizePort(input: number | string | unknown): number;

/**
 * Normalize and validate a URL string
 * @param input - Input URL string
 * @returns Validated URL object
 * @throws Error if URL is empty, invalid, or not http/https
 */
export function normalizeUrl(input: string | unknown): URL;

/**
 * Split a host:port string into components
 * @param s - Host:port string
 * @returns Parsed host and port
 */
export function splitHostPort(s: string): { host: string; port: number };

/**
 * Fetch the public IP address
 * @param options - Options
 * @param options.timeoutMs - Timeout in milliseconds (default: 4000)
 * @returns Promise resolving to public IP address
 * @throws Error if request fails or response is invalid
 */
export function fetchPublicIp(options?: { timeoutMs?: number }): Promise<string>;

/**
 * Network interface information
 */
export interface NetworkInterface {
  name: string;
  family: number;
  address: string;
  netmask: string;
  mac: string;
  internal: boolean;
}

/**
 * Get local network interfaces information
 * @returns Array of network interface information
 */
export function getLocalInterfaces(): NetworkInterface[];

/**
 * DNS lookup result
 */
export interface DnsLookupResult {
  address: string;
  family: number;
}

/**
 * Perform DNS lookup for a host
 * @param target - Host to lookup
 * @param options - Options
 * @param options.family - Address family (4 or 6, 0 for both)
 * @returns Promise resolving to lookup results
 */
export function dnsLookup(target: string, options?: { family?: number }): Promise<DnsLookupResult[]>;

/**
 * Resolve DNS records for a host
 * @param target - Host to resolve
 * @param rrtype - Record type (A, AAAA, CNAME, TXT, MX, NS, SRV)
 * @returns Promise resolving to resolution results
 * @throws Error if record type is not supported
 */
export function dnsResolve(target: string, rrtype?: string): Promise<unknown[]>;

/**
 * Command execution result
 */
export interface CommandResult {
  ok: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  cmd: string;
}

/**
 * Run a shell command with timeout
 * @param cmd - Command to run
 * @param args - Command arguments
 * @param options - Options
 * @param options.timeoutMs - Timeout in milliseconds (default: 15000)
 * @returns Promise resolving to command result
 */
export function runCommand(cmd: string, args: string[], options?: { timeoutMs?: number }): Promise<CommandResult>;

/**
 * Ping a host
 * @param target - Host to ping
 * @param options - Options
 * @param options.count - Number of ping packets (default: 4)
 * @param options.timeoutMs - Timeout in milliseconds (default: 15000)
 * @returns Promise resolving to command result
 */
export function ping(target: string, options?: { count?: number; timeoutMs?: number }): Promise<CommandResult>;

/**
 * Run traceroute to a host
 * @param target - Host to trace
 * @param options - Options
 * @param options.timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Promise resolving to command result
 */
export function traceroute(target: string, options?: { timeoutMs?: number }): Promise<CommandResult>;

/**
 * HTTP check result
 */
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

/**
 * Check HTTP(S) URL accessibility
 * @param urlInput - URL to check
 * @param options - Options
 * @param options.method - HTTP method (HEAD or GET, default: HEAD)
 * @param options.timeoutMs - Timeout in milliseconds (default: 6000)
 * @param options.followRedirects - Maximum redirects to follow (default: 3)
 * @returns Promise resolving to check result
 */
export function httpCheck(
  urlInput: string,
  options?: { method?: 'HEAD' | 'GET'; timeoutMs?: number; followRedirects?: number }
): Promise<HttpCheckResult>;

/**
 * TCP check result
 */
export interface TcpCheckResult {
  host: string;
  port: number;
  ok: boolean;
  ms: number;
  error?: string;
}

/**
 * Check if a TCP port is open on a host
 * @param hostInput - Target host
 * @param portInput - Target port
 * @param options - Options
 * @param options.timeoutMs - Timeout in milliseconds (default: 2500)
 * @returns Promise resolving to check result
 */
export function tcpCheck(hostInput: string, portInput: number | string, options?: { timeoutMs?: number }): Promise<TcpCheckResult>;

/**
 * Check multiple TCP ports on a host with concurrency control
 * @param hostInput - Target host
 * @param ports - Ports to check
 * @param options - Options
 * @param options.timeoutMs - Timeout per port in milliseconds (default: 2500)
 * @param options.concurrency - Maximum concurrent checks (default: 50)
 * @returns Promise resolving to check results, sorted by port
 */
export function tcpBatchCheck(
  hostInput: string,
  ports: Array<number | string>,
  options?: { timeoutMs?: number; concurrency?: number }
): Promise<TcpCheckResult[]>;

/**
 * Parse a port list string into an array of port numbers
 * Supports formats: "80", "80,443", "3000-3010", "80,443,3000-3010"
 * @param input - Port list string
 * @returns Array of port numbers
 * @throws Error if input is empty, invalid, or range exceeds 2000 ports
 */
export function parsePorts(input: string): number[];

/**
 * System network info result
 */
export interface SystemNetInfoResult {
  command: string;
  ok: boolean;
  stdout: string;
  stderr: string;
}

/**
 * Get system network configuration info
 * @param options - Options
 * @param options.timeoutMs - Timeout in milliseconds (default: 12000)
 * @returns Promise resolving to network info
 */
export function systemNetInfo(options?: { timeoutMs?: number }): Promise<SystemNetInfoResult>;

/**
 * List listening TCP/UDP ports
 * @param options - Options
 * @param options.timeoutMs - Timeout in milliseconds (default: 12000)
 * @returns Promise resolving to command result
 */
export function listListeningPorts(options?: { timeoutMs?: number }): Promise<CommandResult>;

/**
 * Parsed port entry
 */
export interface ParsedPortEntry {
  proto: 'TCP' | 'UDP';
  localAddr: string;
  localPort: number;
  state: string;
  pid: number;
  process?: string;
}

/**
 * Parse Windows netstat output
 * @param stdout - netstat -ano output
 * @returns Parsed port entries
 */
export function parseWindowsNetstat(stdout: string): ParsedPortEntry[];

/**
 * Parse Linux ss command output
 * @param stdout - ss -ltnp output
 * @returns Parsed port entries
 */
export function parseSs(stdout: string): ParsedPortEntry[];

/**
 * Parse Unix netstat output
 * @param stdout - netstat -ltnp output
 * @returns Parsed port entries
 */
export function parseUnixNetstat(stdout: string): ParsedPortEntry[];

/**
 * Resolve process names for given PIDs on Windows
 * @param pids - Array of PIDs
 * @param options - Options
 * @param options.timeoutMs - Timeout per PID in milliseconds (default: 8000)
 * @returns Promise resolving to Map of PID to process name
 */
export function resolveWindowsProcessNames(pids: number[], options?: { timeoutMs?: number }): Promise<Map<number, string>>;
