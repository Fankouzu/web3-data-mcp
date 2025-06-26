/**
 * 测试设置脚本
 * 用于验证开发环境和API连接
 */

const RootDataApiTester = require('./api-test.js');
const languageUtils = require('../src/utils/language.js');

console.log('🔧 Web3 Data MCP 服务器开发环境测试');
console.log('='.repeat(50));

// 测试语言检测功能
console.log('\n📝 测试语言检测功能:');

const testQueries = [
  'Bitcoin price analysis',
  '比特币价格分析',
  'What is Ethereum?',
  '以太坊是什么？',
  'blockchain technology',
  '区块链技术',
  'crypto投资分析' // 混合语言
];

testQueries.forEach(query => {
  const lang = languageUtils.detectLanguage(query);
  const langName = languageUtils.getLanguageName(lang);
  console.log(`"${query}" -> ${lang} (${langName})`);
});

// 检查API Key
console.log('\n🔑 检查API Key配置:');
const apiKey = process.env.ROOTDATA_API_KEY;

if (!apiKey) {
  console.log('❌ 未找到 ROOTDATA_API_KEY 环境变量');
  console.log('');
  console.log('要测试API连接，请执行:');
  console.log('ROOTDATA_API_KEY=your-api-key node test-setup.js');
  console.log('');
  console.log('或者设置环境变量:');
  console.log('export ROOTDATA_API_KEY=your-api-key');
  console.log('node test-setup.js');

  process.exit(0);
} else {
  console.log('✅ 找到API Key:', apiKey.substring(0, 8) + '...');

  // 运行API测试
  console.log('\n🚀 开始API连接测试:');
  const tester = new RootDataApiTester(apiKey);

  tester
    .runAllTests()
    .then(report => {
      console.log('\n📋 测试完成报告:');
      if (report.successRate === 100) {
        console.log('🎉 恭喜！所有测试通过，可以开始正式开发');
      } else if (report.successRate >= 50) {
        console.log('⚠️  部分测试通过，建议检查API配置或网络连接');
      } else {
        console.log('❌ 大部分测试失败，请检查API Key和网络连接');
      }

      console.log('\n下一步:');
      console.log('1. 如果测试通过，可以运行: npm run develop');
      console.log('2. 如果测试失败，请检查API Key和网络连接');
    })
    .catch(error => {
      console.error('\n💥 测试过程出错:', error.message);
      console.log('请检查网络连接和API配置');
    });
}
