#!/usr/bin/env node

/**
 * 测试PromptManager基础功能
 */

const PromptManager = require('../src/core/PromptManager');

async function testPromptManager() {
  console.error('=== Testing PromptManager ===');
  console.error('Start time:', new Date().toISOString());
  
  try {
    // 1. 创建PromptManager实例
    console.error('\n1. Creating PromptManager instance...');
    const promptManager = new PromptManager({
      defaultLanguage: 'en',
      cacheEnabled: true
    });
    console.error('✅ Instance created');
    
    // 2. 初始化
    console.error('\n2. Initializing PromptManager...');
    const initResult = await promptManager.initialize();
    if (!initResult) {
      throw new Error('PromptManager initialization failed');
    }
    console.error('✅ Initialization successful');
    
    // 3. 获取统计信息
    console.error('\n3. Getting stats...');
    const stats = promptManager.getStats();
    console.error('Stats:', JSON.stringify(stats, null, 2));
    
    // 4. 测试工具提示词 - 英文
    console.error('\n4. Testing tool prompts (English)...');
    const searchSystemEn = promptManager.getToolPrompt('search_web3_entities', 'system', { language: 'en' });
    console.error('search_web3_entities system (EN):', searchSystemEn ? '✅ Loaded' : '❌ Failed');
    
    const searchUsageEn = promptManager.getToolPrompt('search_web3_entities', 'usage', { language: 'en' });
    console.error('search_web3_entities usage (EN):', searchUsageEn ? '✅ Loaded' : '❌ Failed');
    
    // 5. 测试工具提示词 - 中文
    console.error('\n5. Testing tool prompts (Chinese)...');
    const searchSystemZh = promptManager.getToolPrompt('search_web3_entities', 'system', { language: 'zh' });
    console.error('search_web3_entities system (ZH):', searchSystemZh ? '✅ Loaded' : '❌ Failed');
    
    const searchUsageZh = promptManager.getToolPrompt('search_web3_entities', 'usage', { language: 'zh' });
    console.error('search_web3_entities usage (ZH):', searchUsageZh ? '✅ Loaded' : '❌ Failed');
    
    // 6. 测试get_project_details工具
    console.error('\n6. Testing get_project_details prompts...');
    const projectSystemEn = promptManager.getToolPrompt('get_project_details', 'system', { language: 'en' });
    console.error('get_project_details system (EN):', projectSystemEn ? '✅ Loaded' : '❌ Failed');
    
    // 7. 测试缓存命中
    console.error('\n7. Testing cache functionality...');
    const beforeStats = promptManager.getStats();
    console.error('Before cache test - Hits:', beforeStats.hits, 'Misses:', beforeStats.misses);
    
    // 再次获取相同的提示词，应该从缓存中获取
    promptManager.getToolPrompt('search_web3_entities', 'system', { language: 'en' });
    
    const afterStats = promptManager.getStats();
    console.error('After cache test - Hits:', afterStats.hits, 'Misses:', afterStats.misses);
    console.error('Cache working:', afterStats.hits > beforeStats.hits ? '✅ Yes' : '❌ No');
    
    // 8. 测试语言降级
    console.error('\n8. Testing language fallback...');
    const frenchPrompt = promptManager.getToolPrompt('search_web3_entities', 'system', { language: 'fr' });
    console.error('French fallback to English:', frenchPrompt ? '✅ Success' : '❌ Failed');
    
    // 9. 测试模板插值
    console.error('\n9. Testing template interpolation...');
    // 这需要在YAML中有模板变量，暂时跳过
    
    // 10. 显示示例内容
    console.error('\n10. Sample prompt content:');
    console.error('---');
    console.error('Tool: search_web3_entities');
    console.error('Type: system');
    console.error('Language: en');
    console.error('Content preview:');
    console.error(searchSystemEn.substring(0, 200) + '...');
    console.error('---');
    
    // 最终统计
    console.error('\n=== Final Statistics ===');
    const finalStats = promptManager.getStats();
    console.error(JSON.stringify(finalStats, null, 2));
    
    console.error('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// 运行测试
testPromptManager().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 