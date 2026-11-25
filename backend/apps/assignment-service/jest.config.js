/** Jest config for assignment-service. Run from backend/: npm run test:assignments */
/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testRegex: '.*\.spec\.ts$',
  transform: {
    '^.+\.ts$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testTimeout: 30000,
};
