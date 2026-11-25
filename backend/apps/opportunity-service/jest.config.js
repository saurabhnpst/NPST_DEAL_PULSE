/** Jest config for opportunity-service. Run from backend/: npm run test:opportunities */
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
};
