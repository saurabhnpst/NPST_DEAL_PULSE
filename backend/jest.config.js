module.exports = {
  projects: [
    {
      displayName: 'approval',
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: '.',
      roots: ['<rootDir>/apps/approval-service', '<rootDir>/test'],
      testRegex: '.*\\.spec\\.ts$',
      transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
      },
      testEnvironment: 'node',
    },
    {
      displayName: 'documents',
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: '.',
      roots: ['<rootDir>/apps/document-service'],
      testRegex: '.*\\.spec\\.ts$',
      transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
      },
      testEnvironment: 'node',
    },
    '<rootDir>/apps/lead-service/jest.config.js',
    '<rootDir>/apps/opportunity-service/jest.config.js',
    '<rootDir>/apps/assignment-service/jest.config.js',
  ],
};
