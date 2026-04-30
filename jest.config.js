/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    '\\.(css|less|svg|png|jpg|woff2?|ttf)$': '<rootDir>/jest.styleMock.js',
    '@/(.*)$': '<rootDir>/src/$1'
  }
};