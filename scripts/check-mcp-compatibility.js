#!/usr/bin/env node
/**
 * MCP协议兼容性检查工具
 * 检查代码中是否包含可能干扰JSON-RPC协议的emoji字符
 */

const fs = require('fs');
const path = require('path');

// emoji和特殊字符正则表达式
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
const PROBLEMATIC_CHARS = ['✅', '❌', '📊', '📝', '🔧', '⚠️', '🚨', '💀', '🌟', '📡', '💥', '🔍', '🎯', '⏰', '🛑', '👋', '💰', '🔄', '🏥', '🔥', '💾', '📋', '🗑️', '🌐', '📤', '📥', '🔤'];

// 需要检查的文件模式
const CHECK_PATTERNS = [
  'src/**/*.js'
];

// 排除的文件
const EXCLUDE_PATTERNS = [
  'node_modules',
  'test-*.js',
  'scripts',
  'tests'
];

/**
 * 递归查找匹配的文件
 */
function findFiles(dir, patterns, excludes) {
  const files = [];
  
  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 检查是否在排除列表中
        if (!excludes.some(exclude => fullPath.includes(exclude))) {
          walkDir(fullPath);
        }
      } else if (stat.isFile()) {
        // 检查文件扩展名
        if (fullPath.endsWith('.js') && !excludes.some(exclude => fullPath.includes(exclude))) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walkDir(dir);
  return files;
}

/**
 * 检查文件中的emoji字符
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    // 检查console.log（MCP服务器中绝对禁止）
    if (line.includes('console.log(')) {
      issues.push({
        line: index + 1,
        content: line.trim(),
        type: 'console_log',
        chars: ['console.log']
      });
    }
    
    // 检查console.log/console.error中的emoji
    if (line.includes('console.') && (line.includes('log') || line.includes('error'))) {
      // 检查emoji正则
      const emojiMatches = line.match(EMOJI_REGEX);
      if (emojiMatches) {
        issues.push({
          line: index + 1,
          content: line.trim(),
          type: 'emoji',
          chars: emojiMatches
        });
      }
      
      // 检查特定问题字符
      const problemChars = PROBLEMATIC_CHARS.filter(char => line.includes(char));
      if (problemChars.length > 0) {
        issues.push({
          line: index + 1,
          content: line.trim(),
          type: 'problematic_chars',
          chars: problemChars
        });
      }
    }
  });
  
  return issues;
}

/**
 * 主检查函数
 */
function checkMcpCompatibility() {
  console.log('开始MCP协议兼容性检查...\n');
  
  const files = findFiles('.', CHECK_PATTERNS, EXCLUDE_PATTERNS);
  let totalIssues = 0;
  let filesWithIssues = 0;
  
  files.forEach(filePath => {
    const issues = checkFile(filePath);
    
    if (issues.length > 0) {
      filesWithIssues++;
      totalIssues += issues.length;
      
      console.log(`❌ ${filePath}:`);
      issues.forEach(issue => {
        let typeDesc = '问题字符';
        if (issue.type === 'emoji') typeDesc = 'Emoji字符';
        else if (issue.type === 'console_log') typeDesc = '⚠️ CRITICAL - console.log输出到STDOUT';
        else if (issue.type === 'problematic_chars') typeDesc = '问题字符';
        
        console.log(`   第${issue.line}行: ${typeDesc}: ${issue.chars.join(', ')}`);
        console.log(`   内容: ${issue.content}`);
        console.log('');
      });
    }
  });
  
  console.log('\n检查结果总结:');
  console.log(`   检查文件数: ${files.length}`);
  console.log(`   有问题的文件: ${filesWithIssues}`);
  console.log(`   问题总数: ${totalIssues}`);
  
  if (totalIssues === 0) {
    console.log('\n通过！没有发现MCP协议兼容性问题。');
    return true;
  } else {
    console.log('\n发现MCP协议兼容性问题，请修复后重新检查。');
    console.log('\n修复建议:');
    console.log('   1. 🚨 将所有console.log改为console.error（避免污染STDOUT）');
    console.log('   2. 移除console.log/console.error中的所有emoji字符');
    console.log('   3. 使用纯文本替代emoji字符');
    console.log('   4. 确保STDOUT只输出JSON-RPC消息');
    console.log('   5. 参考docs/CODING_STANDARDS.md中的MCP协议兼容性规范');
    
    return false;
  }
}

// 如果直接运行脚本
if (require.main === module) {
  const success = checkMcpCompatibility();
  process.exit(success ? 0 : 1);
}

module.exports = {
  checkMcpCompatibility,
  checkFile,
  findFiles
}; 