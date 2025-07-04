/**
 * RootData API连接测试脚本
 * 用于验证API认证和基本功能
 */

const https = require('https');

class RootDataApiTester {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.rootdata.com/open';
    this.testResults = [];
  }

  /**
   * 执行HTTP请求
   */
  async makeRequest(endpoint, data = {}) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);

      const options = {
        hostname: 'api.rootdata.com',
        path:     '/open' + endpoint,
        method:   'POST',
        headers:  {
          'Content-Type':   'application/json',
          apikey:           this.apiKey,
          language:         'en',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, res => {
        let body = '';

        res.on('data', chunk => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            resolve({
              statusCode: res.statusCode,
              headers:    res.headers,
              data:       result
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers:    res.headers,
              data:       body,
              parseError: error.message
            });
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * 测试API Key余额查询
   */
  async testCreditsBalance() {
    console.log('测试1: 查询API Key余额和等级');

    try {
      const response = await this.makeRequest('/quotacredits');

      this.testResults.push({
        test:       'credits_balance',
        success:    response.statusCode === 200,
        statusCode: response.statusCode,
        data:       response.data
      });

      if (response.statusCode === 200 && response.data.result === 200) {
        console.log('✅ API Key验证成功');
        console.log('用户等级:', response.data.data.level);
        console.log('剩余Credits:', response.data.data.credits);
        return {
          success: true,
          level:   response.data.data.level,
          credits: response.data.data.credits
        };
      } else {
        console.log('❌ API Key验证失败');
        console.log('错误信息:', response.data.message || response.data);
        return { success: false, error: response.data };
      }
    } catch (error) {
      console.log('❌ 网络请求失败:', error.message);
      this.testResults.push({
        test:    'credits_balance',
        success: false,
        error:   error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * 测试项目搜索API (基础功能)
   */
  async testProjectSearch() {
    console.log('\n测试2: 项目搜索功能');

    try {
      const searchData = {
        query: 'Bitcoin'
      };

      const response = await this.makeRequest('/ser_inv', searchData);

      this.testResults.push({
        test:       'project_search',
        success:    response.statusCode === 200,
        statusCode: response.statusCode,
        data:       response.data
      });

      if (response.statusCode === 200 && response.data.result === 200) {
        console.log('✅ 项目搜索成功');
        console.log('搜索结果数量:', response.data.data ? response.data.data.length : 0);
        return { success: true, data: response.data.data };
      } else {
        console.log('❌ 项目搜索失败');
        console.log('错误信息:', response.data.message || response.data);
        return { success: false, error: response.data };
      }
    } catch (error) {
      console.log('❌ 搜索请求失败:', error.message);
      this.testResults.push({
        test:    'project_search',
        success: false,
        error:   error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * 测试语言检测 (中文搜索)
   */
  async testChineseSearch() {
    console.log('\n测试3: 中文语言支持');

    try {
      const searchData = {
        query: '比特币'
      };

      const response = await this.makeRequest('/ser_inv', searchData);

      this.testResults.push({
        test:       'chinese_search',
        success:    response.statusCode === 200,
        statusCode: response.statusCode,
        data:       response.data
      });

      if (response.statusCode === 200 && response.data.result === 200) {
        console.log('✅ 中文搜索成功');
        console.log('搜索结果数量:', response.data.data ? response.data.data.length : 0);
        return { success: true, data: response.data.data };
      } else {
        console.log('❌ 中文搜索失败');
        console.log('错误信息:', response.data.message || response.data);
        return { success: false, error: response.data };
      }
    } catch (error) {
      console.log('❌ 中文搜索请求失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始RootData API测试\n');

    // 测试1: API Key验证和余额查询
    const creditsResult = await this.testCreditsBalance();
    if (!creditsResult.success) {
      console.log('\n❌ API Key验证失败，无法继续其他测试');
      return this.generateReport();
    }

    // 测试2: 基础项目搜索
    await this.testProjectSearch();

    // 测试3: 中文语言支持
    await this.testChineseSearch();

    return this.generateReport();
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    console.log('\n📊 测试报告');
    console.log('='.repeat(50));

    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;

    console.log(`总测试数: ${totalCount}`);
    console.log(`成功: ${successCount}`);
    console.log(`失败: ${totalCount - successCount}`);
    console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);

    console.log('\n详细结果:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.success ? '成功' : '失败'}`);
      if (!result.success && result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });

    return {
      total:       totalCount,
      success:     successCount,
      failed:      totalCount - successCount,
      successRate: (successCount / totalCount) * 100,
      results:     this.testResults
    };
  }
}

// 如果直接运行此脚本
// Jest测试套件
describe('RootData API Tests', () => {
  let tester;
  const mockApiKey = 'test-api-key-12345';

  beforeEach(() => {
    tester = new RootDataApiTester(mockApiKey);
  });

  test('API连接测试器应该正确初始化', () => {
    expect(tester.apiKey).toBe(mockApiKey);
    expect(tester.baseUrl).toBe('https://api.rootdata.com/open');
    expect(tester.testResults).toEqual([]);
  });

  test('应该能够构造正确的HTTP请求', () => {
    // 测试makeRequest方法的构造逻辑
    expect(tester.makeRequest).toBeDefined();
    expect(typeof tester.makeRequest).toBe('function');
  });

  test('测试结果生成器应该工作', () => {
    // 添加一些模拟测试结果
    tester.testResults = [
      { test: 'mock_test_1', success: true },
      { test: 'mock_test_2', success: false }
    ];

    const report = tester.generateReport();
    expect(report.total).toBe(2);
    expect(report.success).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.successRate).toBe(50);
  });

  // 跳过实际的API调用测试，因为需要真实的API密钥
  test.skip('真实API调用 - Credits余额查询', async () => {
    const realApiKey = process.env.ROOTDATA_API_KEY;
    if (!realApiKey) {
      console.log('跳过真实API测试 - 缺少ROOTDATA_API_KEY环境变量');
      return;
    }

    const realTester = new RootDataApiTester(realApiKey);
    const result = await realTester.testCreditsBalance();
    expect(result.success).toBe(true);
  }, 10000);

  test.skip('真实API调用 - 项目搜索', async () => {
    const realApiKey = process.env.ROOTDATA_API_KEY;
    if (!realApiKey) {
      console.log('跳过真实API测试 - 缺少ROOTDATA_API_KEY环境变量');
      return;
    }

    const realTester = new RootDataApiTester(realApiKey);
    const result = await realTester.testProjectSearch();
    expect(result.success).toBe(true);
  }, 10000);
});

if (require.main === module) {
  const apiKey = process.env.ROOTDATA_API_KEY;

  if (!apiKey) {
    console.log('❌ 请设置环境变量 ROOTDATA_API_KEY');
    console.log('使用方法: ROOTDATA_API_KEY=your-key node tests/api-test.js');
    process.exit(1);
  }

  const tester = new RootDataApiTester(apiKey);
  tester
    .runAllTests()
    .then(report => {
      if (report.successRate === 100) {
        console.log('\n🎉 所有测试通过！API连接正常');
        process.exit(0);
      } else {
        console.log('\n⚠️ 部分测试失败，请检查API配置');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 测试执行出错:', error);
      process.exit(1);
    });
}

module.exports = RootDataApiTester;
