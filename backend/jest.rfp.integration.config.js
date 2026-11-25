/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'apps/rfp-service/.*\\.integration-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs|typeorm|uuid|dotenv)/)',
  ],
  testEnvironment: 'node',
  testTimeout: 60000,
};