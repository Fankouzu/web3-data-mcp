/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['**/tests/**/*.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/docs/',
    '<rootDir>/tests/jest-setup.js' // 排除Jest设置文件
  ],
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
  // timers: 'fake', // 使用模拟定时器 - 先注释掉，避免影响其他测试
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  reporters: ['default']
}; 