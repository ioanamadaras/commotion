module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/?(*.)+(test|spec).ts'],
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
};
