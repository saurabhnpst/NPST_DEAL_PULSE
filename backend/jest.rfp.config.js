/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'apps/rfp-service/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/apps/rfp-service/src/testing/jest-setup.ts'],
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(pdfjs-dist|@nestjs/bullmq|@nestjs/bull-shared|bullmq)/)',
  ],
  collectCoverageFrom: ['apps/rfp-service/src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/database/migrations/'],
};