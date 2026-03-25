/**
 * TypeScript type definitions for netq storage module
 * @module netq/storage
 */

/**
 * Favorite item configuration
 */
export interface FavoriteItem {
  label: string;
  type: 'ping' | 'tcp' | 'http' | 'dns';
  target: string;
  port?: number;
}

/**
 * Default configuration values
 */
export interface DefaultConfig {
  tcpTimeoutMs: number;
  httpTimeoutMs: number;
  pingCount: number;
}

/**
 * Application configuration
 */
export interface AppConfig {
  defaults: DefaultConfig;
  favorites: FavoriteItem[];
}

/**
 * Get the configuration directory path
 * @returns Configuration directory path
 */
export function configDir(): string;

/**
 * Get the configuration file path
 * @returns Configuration file path
 */
export function configPath(): string;

/**
 * Get the reports directory path
 * @returns Reports directory path
 */
export function reportsDir(): string;

/**
 * Write a report to disk
 * @param options - Report options
 * @param options.title - Report title
 * @param options.text - Text content
 * @param options.json - JSON content
 * @returns Object containing paths to written files
 */
export function writeReportSync(options: {
  title?: string;
  text?: string;
  json?: unknown;
}): { textPath?: string; jsonPath?: string };

/**
 * Get the default configuration
 * @returns Default configuration object
 */
export function defaultConfig(): AppConfig;

/**
 * Read configuration synchronously
 * @returns Merged configuration (user config + defaults)
 */
export function readConfigSync(): AppConfig;

/**
 * Write configuration synchronously
 * @param cfg - Configuration to write
 */
export function writeConfigSync(cfg: AppConfig): void;
