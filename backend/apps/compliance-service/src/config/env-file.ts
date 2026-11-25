import {
  findBackendRoot,
  resolveServiceEnvFile,
} from '../../../../libs/service-config/src';

/** Absolute path to apps/compliance-service/.env (cwd-independent). */
export function resolveComplianceEnvFile(): string {
  return resolveServiceEnvFile('compliance-service', __dirname);
}

export function resolveComplianceBackendRoot(): string {
  return findBackendRoot(__dirname);
}