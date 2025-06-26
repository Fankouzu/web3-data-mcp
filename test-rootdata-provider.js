/**
 * RootData供应商模块测试脚本
 * 验证供应商模块的功能是否正常
 */

const RootDataProvider = require('./src/providers/rootdata/RootDataProvider');

async function testRootDataProvider() {
  console.log('🧪 测试RootData供应商模块');
  console.log('='.repeat(50));

  const apiKey = process.env.ROOTDATA_API_KEY;
  
  if (!apiKey) {
    console.log('❌ 请设置环境变量 ROOTDATA_API_KEY');
    process.exit(1);
  }

  try {
    // 1. 创建供应商实例
    console.log('\n1️⃣ 创建RootData供应商实例...');
    const provider = new RootDataProvider({
      apiKey: apiKey,
      timeout: 30000,
      retries: 3
    });
    
    // 2. 初始化供应商
    console.log('\n2️⃣ 初始化供应商...');
    const initResult = await provider.initialize();
    
    if (!initResult) {
      console.log('❌ 供应商初始化失败');
      return;
    }

    // 3. 查看供应商状态
    console.log('\n3️⃣ 供应商状态信息:');
    const status = provider.getDetailedStatus();
    console.log(`- 供应商: ${status.provider}`);
    console.log(`- 用户等级: ${status.level}`);
    console.log(`- 剩余Credits: ${status.credits}`);
    console.log(`- 可用工具数: ${status.availableToolsCount}`);
    console.log(`- 总工具数: ${status.totalToolsCount}`);

    // 4. 测试工具注册
    console.log('\n4️⃣ 测试可用工具:');
    const tools = provider.getAvailableTools();
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // 5. 测试API调用
    console.log('\n5️⃣ 测试API调用功能:');
    
    // 测试credits查询
    console.log('\n5.1 测试credits查询...');
    try {
      const creditsResult = await provider.executeApiCall('credits_check', {});
      console.log('✅ Credits查询成功');
      console.log(`剩余Credits: ${creditsResult.credits.remaining}`);
    } catch (error) {
      console.log('❌ Credits查询失败:', error.message);
    }

    // 测试搜索功能
    console.log('\n5.2 测试搜索功能...');
    try {
      const searchResult = await provider.executeApiCall('search_entities', {
        query: 'Bitcoin'
      });
      console.log('✅ 搜索功能成功');
      console.log(`搜索结果数量: ${searchResult.data.data.length}`);
      console.log(`剩余Credits: ${searchResult.credits.remaining}`);
    } catch (error) {
      console.log('❌ 搜索功能失败:', error.message);
    }

    // 测试智能查询
    console.log('\n5.3 测试智能查询...');
    try {
      const smartResult = await provider.smartQuery('Ethereum projects');
      console.log('✅ 智能查询成功');
      console.log(`查询结果: ${smartResult.success ? '成功' : '失败'}`);
      if (smartResult.credits) {
        console.log(`剩余Credits: ${smartResult.credits.remaining}`);
      }
    } catch (error) {
      console.log('❌ 智能查询失败:', error.message);
    }

    // 6. 测试语言检测
    console.log('\n6️⃣ 测试语言检测功能:');
    const testQueries = [
      'Bitcoin price analysis',
      '比特币价格分析',
      'Ethereum ecosystem projects',
      '以太坊生态项目'
    ];

    testQueries.forEach(query => {
      const language = provider.detectQueryLanguage(query);
      console.log(`"${query}" -> ${language}`);
    });

    // 7. 最终状态检查
    console.log('\n7️⃣ 最终状态检查:');
    const finalStatus = provider.getCreditsStatus();
    console.log(`Credits状态: ${finalStatus.status}`);
    if (finalStatus.message) {
      console.log(`提示信息: ${finalStatus.message}`);
    }

    console.log('\n🎉 RootData供应商模块测试完成！');
    
  } catch (error) {
    console.error('\n💥 测试过程中出现错误:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testRootDataProvider().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = testRootDataProvider;