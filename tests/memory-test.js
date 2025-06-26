/**
 * 内存泄漏检测测试 - Jest兼容版本
 * 专门用于检测潜在的内存泄漏问题
 */

const { PerformanceOptimizer } = require('../src/utils/performanceOptimizer');

// 内存测试配置
const MEMORY_CONFIG = {
  iterations: 100, // 减少迭代次数以适应测试环境
  maxMemoryIncrease: 50, // MB
  checkInterval: 20, // 每20次迭代检查一次
  gcInterval: 50, // 每50次迭代强制GC
  stabilityChecks: 3 // 连续3次检查内存稳定
};

class MemoryTester {
  constructor() {
    this.memorySnapshots = [];
    this.warnings = [];
    this.leakDetected = false;
  }

  /**
   * 获取内存使用情况
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      timestamp: Date.now(),
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB, 保留2位小数
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100
    };
  }

  /**
   * 强制垃圾回收
   */
  forceGC() {
    if (global.gc) {
      global.gc();
      console.log('🗑️ Forced garbage collection');
    }
  }

  /**
   * 分析内存趋势
   */
  analyzeMemoryTrend() {
    if (this.memorySnapshots.length < 3) {
      return { trend: 'insufficient_data', slope: 0 };
    }

    const recent = this.memorySnapshots.slice(-3);
    const y = recent.map(snap => snap.heapUsed);

    // 简单计算增长趋势
    const slope = (y[y.length - 1] - y[0]) / y.length;

    let trend;
    if (slope > 5) {
      trend = 'increasing_fast'; // 内存快速增长
    } else if (slope > 1) {
      trend = 'increasing_slow'; // 内存缓慢增长
    } else if (slope < -1) {
      trend = 'decreasing'; // 内存减少
    } else {
      trend = 'stable'; // 内存稳定
    }

    return { trend, slope: Math.round(slope * 100) / 100 };
  }

  /**
   * 检测内存泄漏
   */
  detectMemoryLeak() {
    const analysis = this.analyzeMemoryTrend();
    const currentMemory = this.memorySnapshots[this.memorySnapshots.length - 1];
    const initialMemory = this.memorySnapshots[0];
    
    const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;

    // 检查条件
    const conditions = {
      excessiveIncrease: memoryIncrease > MEMORY_CONFIG.maxMemoryIncrease,
      continuousGrowth: analysis.trend === 'increasing_fast'
    };

    const leakIndicators = Object.values(conditions).filter(Boolean).length;

    if (leakIndicators >= 1) {
      this.leakDetected = true;
      const warning = {
        timestamp: Date.now(),
        type: 'memory_leak',
        message: 'Potential memory leak detected',
        details: {
          memoryIncrease: `${memoryIncrease.toFixed(2)}MB`,
          trend: analysis.trend,
          slope: analysis.slope,
          conditions
        }
      };
      this.warnings.push(warning);
    }

    return leakIndicators;
  }

  /**
   * 执行缓存压力测试
   */
  async runCacheStressTest() {
    const optimizer = new PerformanceOptimizer({
      cache: { enabled: true, maxSize: 100, ttl: 60000 }
    });

    for (let i = 0; i < MEMORY_CONFIG.iterations; i++) {
      // 创建不同的端点和参数以填充缓存
      const endpoint = `endpoint_${i % 10}`; // 10个不同端点
      const params = {
        id: i,
        query: `test_query_${i}`,
        data: 'x'.repeat(100) // 100字节数据
      };

      await optimizer.optimizeRequest(endpoint, params, async () => {
        return {
          success: true,
          data: {
            id: i,
            result: 'x'.repeat(200), // 200字节响应
            timestamp: Date.now()
          }
        };
      });

      // 定期检查内存
      if (i % MEMORY_CONFIG.checkInterval === 0) {
        const memory = this.getMemoryUsage();
        this.memorySnapshots.push(memory);
        this.detectMemoryLeak();
      }

      // 定期强制GC
      if (i % MEMORY_CONFIG.gcInterval === 0 && i > 0) {
        this.forceGC();
      }
    }

    optimizer.cleanup();
  }

  /**
   * 执行大数据处理测试
   */
  async runLargeDataTest() {
    const largeDataSets = [];

    for (let i = 0; i < 20; i++) {
      // 创建大型数据集
      const largeData = {
        id: i,
        data: new Array(1000).fill(0).map((_, idx) => ({
          index: idx,
          value: Math.random(),
          text: 'sample'.repeat(10) // 约60字节
        }))
      };

      largeDataSets.push(largeData);

      // 模拟数据处理
      const processed = largeData.data.map(item => ({
        ...item,
        processed: true,
        hash: item.index * item.value
      }));

      // 定期清理
      if (i % 5 === 0 && i > 0) {
        largeDataSets.splice(0, 2); // 移除前2个数据集
        
        const memory = this.getMemoryUsage();
        this.memorySnapshots.push(memory);
        this.detectMemoryLeak();
      }
    }

    // 最终清理
    largeDataSets.length = 0;
    this.forceGC();
  }

  /**
   * 执行事件监听器测试
   */
  async runEventListenerTest() {
    const { EventEmitter } = require('events');
    const emitters = [];

    for (let i = 0; i < 100; i++) {
      const emitter = new EventEmitter();
      
      // 添加监听器
      const listener1 = () => { /* do nothing */ };
      const listener2 = () => { /* do nothing */ };
      
      emitter.on('test', listener1);
      emitter.on('data', listener2);
      
      emitters.push(emitter);

      // 触发事件
      emitter.emit('test', { data: i });
      emitter.emit('data', 'sample');

      // 定期检查和清理
      if (i % 20 === 0 && i > 0) {
        // 移除前面的emitter
        const toRemove = emitters.splice(0, 10);
        toRemove.forEach(em => {
          em.removeAllListeners();
        });

        const memory = this.getMemoryUsage();
        this.memorySnapshots.push(memory);
        this.detectMemoryLeak();
      }
    }

    // 清理所有监听器
    emitters.forEach(emitter => {
      emitter.removeAllListeners();
    });
    emitters.length = 0;
  }

  /**
   * 内存稳定性检查
   */
  async checkMemoryStability() {
    const stabilitySnapshots = [];
    
    for (let i = 0; i < MEMORY_CONFIG.stabilityChecks; i++) {
      this.forceGC();
      await new Promise(resolve => setTimeout(resolve, 500)); // 等待500ms
      
      const memory = this.getMemoryUsage();
      stabilitySnapshots.push(memory);
    }

    // 计算内存波动
    const heapValues = stabilitySnapshots.map(s => s.heapUsed);
    const avg = heapValues.reduce((a, b) => a + b, 0) / heapValues.length;
    const variance = heapValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / heapValues.length;
    const stdDev = Math.sqrt(variance);

    const isStable = stdDev < 5; // 标准差小于5MB认为稳定

    return {
      stable: isStable,
      average: avg,
      standardDeviation: stdDev,
      snapshots: stabilitySnapshots
    };
  }

  /**
   * 生成内存测试报告
   */
  generateReport() {
    if (this.memorySnapshots.length === 0) {
      return {
        summary: { passed: true, leakDetected: false, totalWarnings: 0 },
        memoryStats: { increase: '0MB' },
        trend: { trend: 'no_data', slope: 0 },
        warnings: []
      };
    }

    const initialMemory = this.memorySnapshots[0];
    const finalMemory = this.memorySnapshots[this.memorySnapshots.length - 1];
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    return {
      summary: {
        passed: !this.leakDetected && memoryIncrease <= MEMORY_CONFIG.maxMemoryIncrease,
        leakDetected: this.leakDetected,
        totalWarnings: this.warnings.length
      },
      memoryStats: {
        initial: `${initialMemory.heapUsed}MB`,
        final: `${finalMemory.heapUsed}MB`,
        increase: `${memoryIncrease.toFixed(2)}MB`,
        increaseAllowed: `${MEMORY_CONFIG.maxMemoryIncrease}MB`
      },
      trend: this.analyzeMemoryTrend(),
      warnings: this.warnings
    };
  }
}

// Jest测试套件
describe('Memory Tests', () => {
  let tester;

  beforeEach(() => {
    tester = new MemoryTester();
    // 记录初始内存状态
    if (global.gc) global.gc();
    const initialMemory = tester.getMemoryUsage();
    tester.memorySnapshots.push(initialMemory);
  });

  test('缓存压力测试 - 内存管理', async () => {
    await tester.runCacheStressTest();
    const report = tester.generateReport();
    expect(report.summary.passed).toBe(true);
    expect(report.summary.leakDetected).toBe(false);
  }, 30000);

  test('大数据处理测试 - 内存清理', async () => {
    await tester.runLargeDataTest();
    const trend = tester.analyzeMemoryTrend();
    expect(['stable', 'decreasing', 'increasing_slow', 'insufficient_data']).toContain(trend.trend);
  }, 30000);

  test('事件监听器测试 - 内存泄漏检测', async () => {
    await tester.runEventListenerTest();
    expect(tester.leakDetected).toBe(false);
    expect(tester.warnings.length).toBeLessThan(5);
  }, 30000);

  test('内存稳定性检查', async () => {
    const stabilityResult = await tester.checkMemoryStability();
    expect(stabilityResult.stable).toBe(true);
    expect(stabilityResult.standardDeviation).toBeLessThan(20); // 20MB标准差
  }, 15000);
});

module.exports = { MemoryTester, MEMORY_CONFIG }; 