/** @type {import('jest').Config} */
module.exports = {
  // Point preset to backend's ts-jest since dependencies are installed there
  preset: '<rootDir>/backend/node_modules/ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': [
      '<rootDir>/backend/node_modules/ts-jest',
      { tsconfig: 'backend/tsconfig.json' },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  roots: ['<rootDir>/backend/src', '<rootDir>/frontend/src'],
  clearMocks: true,
};
