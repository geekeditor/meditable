/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper:{
    '@/(.*)$': '<rootDir>/src/$1'
  }
};