/**
 * Root Jest configuration for monorepo-style projects (backend + frontend)
 */

module.exports = {
  projects: [
    {
      displayName: 'backend',
      rootDir: __dirname,
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/**/*.test.ts', '<rootDir>/backend/**/__tests__/**/*.test.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/backend/tsconfig.json',
          },
        ],
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
      setupFilesAfterEnv: [],
      collectCoverageFrom: ['backend/src/**/*.{ts,tsx}'],
    },
    {
      displayName: 'frontend',
      rootDir: __dirname,
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/frontend/**/*.(test|spec).ts',
        '<rootDir>/frontend/**/*.(test|spec).tsx',
        '<rootDir>/frontend/**/__tests__/**/*.(test|spec).ts',
        '<rootDir>/frontend/**/__tests__/**/*.(test|spec).tsx',
      ],
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/frontend/tsconfig.json',
          },
        ],
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      setupFilesAfterEnv: ['<rootDir>/frontend/jest.setup.ts'],
      collectCoverageFrom: [
        'frontend/src/auth/**/*.{ts,tsx}',
        'frontend/src/context/**/*.{ts,tsx}',
        'frontend/src/components/Auth/**/*.{ts,tsx}',
        'frontend/src/router/**/*.{ts,tsx}',
      ],
      coverageThreshold: {
        global: {
          branches: 60,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  ],
};
