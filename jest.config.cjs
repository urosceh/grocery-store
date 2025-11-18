/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  setupFiles: ['<rootDir>/test/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/jest.silenceConsole.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  coveragePathIgnorePatterns: ['<rootDir>/test/', '<rootDir>/src/config/'],
  clearMocks: true,
  verbose: false,
};
