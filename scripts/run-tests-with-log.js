#!/usr/bin/env node

/**
 * 运行测试并将结果保存到日志文件
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const logDir = path.join(__dirname, '../logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 测试脚本列表
const tests = [
  {
    name: 'prompt-manager',
    script: 'test-prompt-manager.js',
    description: 'PromptManager 基础功能测试'
  },
  {
    name: 'tool-prompts',
    script: 'test-tool-prompts.js',
    description: '工具层提示词增强测试'
  },
  {
    name: 'routing-enhancement',
    script: 'test-routing-enhancement.js',
    description: '路由层智能化测试'
  },
  {
    name: 'response-enhancement',
    script: 'test-response-enhancement.js',
    description: '响应优化测试'
  },
  {
    name: 'integration',
    script: 'test-integration.js',
    description: '系统集成测试'
  }
];

console.log('=== 运行测试套件 ===');
console.log(`时间: ${new Date().toISOString()}`);
console.log(`日志目录: ${logDir}\n`);

async function runTest(test) {
  const logFile = path.join(logDir, `${test.name}-${timestamp}.log`);
  console.log(`\n运行测试: ${test.description}`);
  console.log(`脚本: ${test.script}`);
  console.log(`日志: ${logFile}`);
  
  return new Promise((resolve) => {
    const logStream = fs.createWriteStream(logFile);
    const child = spawn('node', [path.join(__dirname, test.script)], {
      env: process.env
    });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      logStream.write(text);
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      logStream.write(text);
    });
    
    child.on('close', (code) => {
      logStream.end();
      
      // 分析结果
      const passed = code === 0;
      // 检查是否有最终的成功消息
      const hasSuccessMessage = output.includes('✅ All') && output.includes('completed successfully!');
      // 检查是否有致命错误
      const hasFatalError = output.includes('❌ Test failed:') || output.includes('❌ Fatal error:');
      const summary = {
        test: test.name,
        passed: passed && (hasSuccessMessage || !hasFatalError),
        exitCode: code,
        logFile: logFile
      };
      
      if (summary.passed) {
        console.log(`✅ 测试通过`);
      } else {
        console.log(`❌ 测试失败 (退出码: ${code})`);
      }
      
      resolve(summary);
    });
  });
}

async function runAllTests() {
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await runTest(test);
      results.push(result);
    } catch (error) {
      console.error(`测试运行错误: ${error.message}`);
      results.push({
        test: test.name,
        passed: false,
        error: error.message
      });
    }
  }
  
  // 生成总结报告
  console.log('\n\n=== 测试总结 ===');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`总测试数: ${results.length}`);
  console.log(`通过: ${passed} ✅`);
  console.log(`失败: ${failed} ❌`);
  console.log(`成功率: ${((passed / results.length) * 100).toFixed(2)}%`);
  
  // 保存总结报告
  const summaryFile = path.join(logDir, `test-summary-${timestamp}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    tests: results,
    summary: {
      total: results.length,
      passed: passed,
      failed: failed,
      successRate: `${((passed / results.length) * 100).toFixed(2)}%`
    }
  }, null, 2));
  
  console.log(`\n详细日志保存在: ${logDir}`);
  console.log(`总结报告: ${summaryFile}`);
  
  // 如果有失败的测试，显示日志位置
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    console.log('\n失败测试的日志文件:');
    failedTests.forEach(t => {
      console.log(`- ${t.test}: ${t.logFile}`);
    });
  }
}

// 运行所有测试
runAllTests().catch(error => {
  console.error('运行测试套件时出错:', error);
  process.exit(1);
}); 