"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceEnvFile = serviceEnvFile;
exports.loadServiceEnv = loadServiceEnv;
exports.assertRequiredEnv = assertRequiredEnv;
const dotenv_1 = require("dotenv");
const path_1 = require("path");
function serviceEnvFile(serviceDirName) {
    return (0, path_1.resolve)(process.cwd(), 'apps', serviceDirName, '.env');
}
function loadServiceEnv(serviceDirName) {
    (0, dotenv_1.config)({ path: serviceEnvFile(serviceDirName) });
}
function assertRequiredEnv(keys) {
    const missing = keys.filter((k) => !process.env[k]?.trim());
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
//# sourceMappingURL=service-env.js.map