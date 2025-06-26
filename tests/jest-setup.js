/**
 * Jest测试环境设置文件
 * 在所有测试运行前设置全局配置
 */

// 设置测试超时
jest.setTimeout(30000);

// 全局测试前设置
beforeAll(() => {
  // 设置环境变量
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';
  
  // 禁用console.log在测试中的输出（可选）
  if (process.env.SILENT_TESTS === 'true') {
    global.console = {
      ...console,
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: console.error // 保留错误输出
    };
  }
});

// 全局测试后清理
afterAll(() => {
  // 清理可能的定时器
  jest.clearAllTimers();
  
  // 强制垃圾回收（如果可用）
  if (global.gc) {
    global.gc();
  }
});

// 每个测试前设置
beforeEach(() => {
  // 清除所有mock
  jest.clearAllMocks();
});

// 每个测试后清理
afterEach(() => {
  // 清理可能的定时器
  jest.clearAllTimers();
  
  // 强制清理所有定时器和间隔
  if (typeof global !== 'undefined') {
    // 清理可能的内存监控定时器
    for (let i = 1; i < 1000; i++) {
      clearInterval(i);
      clearTimeout(i);
    }
  }
});

// 设置全局测试工具
global.testUtils = {
  /**
   * 等待指定时间
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * 生成测试用的API密钥
   */
  generateTestApiKey: () => 'test-api-key-' + Math.random().toString(36).substr(2, 9),
  
  /**
   * 检查对象是否包含指定属性
   */
  expectObjectHasProperties: (obj, properties) => {
    properties.forEach(prop => {
      expect(obj).toHaveProperty(prop);
    });
  }
}; 