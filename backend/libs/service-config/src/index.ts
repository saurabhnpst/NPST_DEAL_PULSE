import { existsSync } from 'fs';
import { isAbsolute, join, normalize, relative, resolve } from 'path';

export interface DatabaseEnvValidationOptions {
  readonly expectedDbName: string;
  readonly serviceLabel: string;
}

type EnvConfig = Record<string, unknown>;

const REQUIRED_DATABASE_KEYS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'DB_SSL_CA',
] as const;

export function findBackendRoot(fromDir: string): string {
  let current = resolve(fromDir);
  while (true) {
    const hasManifest = existsSync(join(current, 'package.json'));
    const hasApps = existsSync(join(current, 'apps'));
    if (hasManifest && hasApps) {
      return current;
    }
    const parent = resolve(current, '..');
    if (parent === current) {
      throw new Error('Backend root not found');
    }
    current = parent;
  }
}

export function resolveServiceEnvFile(serviceName: string, fromDir: string): string {
  if (!/^[a-z][a-z0-9-]*$/.test(serviceName)) {
    throw new Error(`Invalid service name: ${serviceName}`);
  }
  return join(findBackendRoot(fromDir), 'apps', serviceName, '.env');
}

export function resolveSslCaPath(backendRoot: string, configuredPath: string): string {
  const root = resolve(backendRoot);
  const target = isAbsolute(configuredPath)
    ? normalize(configuredPath)
    : resolve(root, configuredPath);
  const targetRelative = relative(root, target);
  if (targetRelative.startsWith('..') || isAbsolute(targetRelative)) {
    throw new Error('DB_SSL_CA must resolve inside backend root');
  }
  if (!existsSync(target)) {
    throw new Error(`DB_SSL_CA file not found: ${configuredPath}`);
  }
  return target;
}

function requireString(
  config: EnvConfig,
  key: (typeof REQUIRED_DATABASE_KEYS)[number],
  serviceLabel: string,
): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${serviceLabel}: ${key} is required`);
  }
  return value.trim();
}

export function validateDatabaseEnv(
  config: EnvConfig,
  options: DatabaseEnvValidationOptions,
): EnvConfig {
  for (const key of REQUIRED_DATABASE_KEYS) {
    requireString(config, key, options.serviceLabel);
  }
  const dbName = requireString(config, 'DB_NAME', options.serviceLabel);
  if (dbName !== options.expectedDbName) {
    throw new Error(`${options.serviceLabel}: DB_NAME must be ${options.expectedDbName}`);
  }
  const portRaw = requireString(config, 'DB_PORT', options.serviceLabel);
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${options.serviceLabel}: DB_PORT must be 1-65535`);
  }
  return config;
}
