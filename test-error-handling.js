/**
 * 错误处理和智能路由系统测试脚本
 */

const RootDataProvider = require('./src/providers/rootdata/RootDataProvider');
const { ErrorHandler, ErrorTypes } = require('./src/core/ErrorHandler');
const { CreditsMonitor, CreditsStatus } = require('./src/core/CreditsMonitor');
const { ToolRouter, IntentTypes } = require('./src/core/ToolRouter');
const { ApiError } = require('./src/providers/base/ApiClient');

async function testErrorHandlingSystem() {
  console.log('🧪 测试错误处理和智能路由系统');
  console.log('='.repeat(50));

  const apiKey = process.env.ROOTDATA_API_KEY;
  
  if (!apiKey) {
    console.log('❌ 请设置环境变量 ROOTDATA_API_KEY');
    process.exit(1);
  }

  try {
    // 1. 初始化组件
    console.log('\n1️⃣ 初始化系统组件...');
    
    const errorHandler = new ErrorHandler();
    const creditsMonitor = new CreditsMonitor();
    const toolRouter = new ToolRouter();
    
    // 初始化RootData供应商
    const rootDataProvider = new RootDataProvider({
      apiKey: apiKey,
      timeout: 30000,
      retries: 3
    });
    
    const initResult = await rootDataProvider.initialize();
    if (!initResult) {
      console.log('❌ RootData供应商初始化失败');
      return;
    }

    // 2. 注册供应商到路由器和监控器
    console.log('\n2️⃣ 注册供应商到系统...');
    toolRouter.registerProvider('rootdata', rootDataProvider);
    creditsMonitor.registerProvider('rootdata', rootDataProvider, {
      warning: 100,
      critical: 20,
      exhausted: 0
    });

    console.log('✅ 系统组件初始化完成');

    // 3. 测试错误处理器
    console.log('\n3️⃣ 测试错误处理器...');
    
    // 测试API错误处理
    console.log('3.1 测试API错误处理...');
    const apiError = new ApiError('API call failed', 'API_ERROR', 500, 'rootdata');
    const errorResponse = errorHandler.handleApiError(apiError, 'rootdata', { 
      query: 'test query',
      includeDetails: true 
    });
    console.log('API错误处理结果:', JSON.stringify(errorResponse, null, 2));

    // 测试Credits不足错误
    console.log('\n3.2 测试Credits不足错误...');
    const creditsError = errorHandler.handleInsufficientCredits(50, 10, 'rootdata');
    console.log('Credits不足错误:', JSON.stringify(creditsError, null, 2));

    // 测试权限不足错误
    console.log('\n3.3 测试权限不足错误...');
    const permissionError = errorHandler.handleInsufficientPermissions('pro', 'basic', 'rootdata');
    console.log('权限不足错误:', JSON.stringify(permissionError, null, 2));

    // 4. 测试Credits监控
    console.log('\n4️⃣ 测试Credits监控系统...');
    
    // 获取当前状态
    const providerStatus = creditsMonitor.getProviderStatus('rootdata');
    console.log('供应商状态:', JSON.stringify(providerStatus, null, 2));
    
    // 模拟Credits消耗
    console.log('\n4.1 模拟Credits消耗...');
    creditsMonitor.updateCredits('rootdata', providerStatus.credits - 50, 50);
    
    // 获取消耗预测
    const prediction = creditsMonitor.predictConsumption('rootdata', 24);
    console.log('消耗预测:', JSON.stringify(prediction, null, 2));
    
    // 获取系统概览
    const overview = creditsMonitor.getOverview();
    console.log('系统概览:', JSON.stringify(overview, null, 2));

    // 5. 测试智能路由
    console.log('\n5️⃣ 测试智能路由系统...');
    
    const testQueries = [
      'Search for Bitcoin projects',
      '比特币项目搜索',
      'Get details about Ethereum',
      'Check my credits balance',
      'Find projects in Solana ecosystem',
      'What is the price of ETH token?',
      'Show me DeFi projects funding information'
    ];

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`\n5.${i + 1} 测试查询: "${query}"`);
      
      try {
        const routingResult = await toolRouter.routeQuery(query, {
          includeDetails: true,
          maxCredits: 20
        });
        
        console.log('路由结果:', {
          success: routingResult.success,
          provider: routingResult.provider,
          tool: routingResult.tool,
          intent: routingResult.intent,
          entities: routingResult.entities,
          language: routingResult.language,
          error: routingResult.error
        });
        
        if (routingResult.credits) {
          console.log('Credits信息:', routingResult.credits);
        }
        
      } catch (error) {
        console.log('❌ 路由失败:', error.message);
      }
    }

    // 6. 测试工具推荐
    console.log('\n6️⃣ 测试工具推荐系统...');
    
    const recommendations = toolRouter.getRecommendedTools('Find Ethereum DeFi projects', 3);
    console.log('推荐工具:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.name} (相关性: ${rec.relevanceScore.toFixed(2)})`);
      console.log(`   推荐理由: ${rec.reason}`);
      console.log(`   Credits: ${rec.creditsPerCall}, 等级要求: ${rec.requiredLevel}`);
    });

    // 7. 测试错误统计
    console.log('\n7️⃣ 错误处理统计信息...');
    const errorStats = errorHandler.getErrorStats();
    console.log('错误统计:', JSON.stringify(errorStats, null, 2));

    // 8. 测试路由统计
    console.log('\n8️⃣ 路由系统统计信息...');
    const routingStats = toolRouter.getRoutingStats();
    console.log('路由统计:', JSON.stringify(routingStats, null, 2));

    // 9. 测试事件监听
    console.log('\n9️⃣ 测试事件监听系统...');
    
    creditsMonitor.on('credits_warning', (data) => {
      console.log('⚠️ Credits警告事件:', data);
    });
    
    creditsMonitor.on('credits_critical', (data) => {
      console.log('🚨 Credits严重警告事件:', data);
    });
    
    // 模拟触发警告事件
    creditsMonitor.updateCredits('rootdata', 50, 10); // 触发警告
    creditsMonitor.updateCredits('rootdata', 10, 5);  // 触发严重警告

    console.log('\n🎉 错误处理和智能路由系统测试完成！');
    
  } catch (error) {
    console.error('\n💥 测试过程中出现错误:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testErrorHandlingSystem().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = testErrorHandlingSystem;