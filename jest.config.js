/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/**/*.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.js'],
  testTimeout: 30000,
  maxWorkers: 1, // 避免并发问题
  forceExit: true, // 强制退出以避免挂起
  detectOpenHandles: true, // 检测未关闭的句柄
  bail: false, // 不在第一个失败后停止
  transform: {},
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/docs/'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  reporters: ['default']
}; 