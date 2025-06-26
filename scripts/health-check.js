#!/usr/bin/env node

/**
 * 项目健康检查脚本
 * 验证所有功能模块是否正常工作
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 Web3 Data MCP - 项目健康检查');
console.log('='.repeat(50));

class HealthChecker {
  constructor() {
    this.checks = [];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * 添加检查项
   */
  addCheck(name, checkFn) {
    this.checks.push({ name, checkFn });
  }

  /**
   * 检查文件是否存在
   */
  checkFileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * 检查模块是否可以导入
   */
  async checkModuleImport(modulePath) {
    try {
      require(modulePath);
      return true;
    } catch (error) {
      this.errors.push(`Module import failed: ${modulePath} - ${error.message}`);
      return false;
    }
  }

  /**
   * 运行所有检查
   */
  async runAllChecks() {
    console.log('🔍 开始健康检查...\n');

    // 1. 检查核心文件结构
    this.addCheck('📁 核心文件结构', () => {
      const coreFiles = [
        'src/index.js',
        'src/core/McpServer.js',
        'src/core/ConfigManager.js',
        'src/core/ErrorHandler.js',
        'src/core/CreditsMonitor.js',
        'src/core/ToolRouter.js',
        'src/providers/rootdata/RootDataProvider.js',
        'src/providers/rootdata/RootDataClient.js',
        'package.json',
        'README.md'
      ];

      const missing = coreFiles.filter(file => !this.checkFileExists(file));
      if (missing.length > 0) {
        this.errors.push(`Missing core files: ${missing.join(', ')}`);
        return false;
      }
      return true;
    });

    // 2. 检查新增的优化模块
    this.addCheck('⚡ 性能优化模块', () => {
      const optimizationFiles = [
        'src/utils/performanceOptimizer.js',
        'src/validators/responseValidator.js',
        'types/rootdata.d.ts'
      ];

      const missing = optimizationFiles.filter(file => !this.checkFileExists(file));
      if (missing.length > 0) {
        this.errors.push(`Missing optimization files: ${missing.join(', ')}`);
        return false;
      }
      return true;
    });

    // 3. 检查CI/CD配置
    this.addCheck('🏗️ CI/CD配置', () => {
      const ciFiles = [
        '.github/workflows/ci.yml',
        '.eslintrc.js',
        '.prettierrc',
        '.jsdoc.json'
      ];

      const missing = ciFiles.filter(file => !this.checkFileExists(file));
      if (missing.length > 0) {
        this.errors.push(`Missing CI/CD files: ${missing.join(', ')}`);
        return false;
      }
      return true;
    });

    // 4. 检查测试文件
    this.addCheck('🧪 测试套件', () => {
      const testFiles = [
        'tests/test-rootdata-provider.js',
        'tests/performance-test.js',
        'tests/memory-test.js',
        'tests/api-test.js'
      ];

      const missing = testFiles.filter(file => !this.checkFileExists(file));
      if (missing.length > 0) {
        this.warnings.push(`Missing test files: ${missing.join(', ')}`);
        return false;
      }
      return true;
    });

    // 5. 检查模块导入
    this.addCheck('📦 模块导入检查', async () => {
      const modules = [
        '../src/utils/performanceOptimizer',
        '../src/validators/responseValidator',
        '../src/providers/rootdata/RootDataProvider',
        '../src/core/McpServer'
      ];

      let allGood = true;
      for (const mod of modules) {
        const result = await this.checkModuleImport(mod);
        if (!result) allGood = false;
      }
      return allGood;
    });

    // 6. 检查package.json配置
    this.addCheck('📋 Package.json配置', () => {
      try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        const requiredScripts = [
          'test:performance',
          'test:memory',
          'test:coverage',
          'lint',
          'format:check',
          'docs:generate'
        ];

        const missingScripts = requiredScripts.filter(script => !pkg.scripts[script]);
        if (missingScripts.length > 0) {
          this.warnings.push(`Missing scripts: ${missingScripts.join(', ')}`);
        }

        const requiredDevDeps = ['eslint', 'prettier', 'jest'];
        const missingDeps = requiredDevDeps.filter(dep => !pkg.devDependencies[dep]);
        if (missingDeps.length > 0) {
          this.warnings.push(`Missing dev dependencies: ${missingDeps.join(', ')}`);
        }

        return missingScripts.length === 0 && missingDeps.length === 0;
      } catch (error) {
        this.errors.push(`Package.json parse error: ${error.message}`);
        return false;
      }
    });

    // 7. 检查TypeScript定义
    this.addCheck('🔤 TypeScript定义', () => {
      if (!this.checkFileExists('types/rootdata.d.ts')) {
        this.errors.push('TypeScript definition file missing');
        return false;
      }

      try {
        const content = fs.readFileSync('types/rootdata.d.ts', 'utf8');
        const hasInterfaces = content.includes('interface') && content.includes('ApiResponse');
        if (!hasInterfaces) {
          this.errors.push('TypeScript definitions incomplete');
          return false;
        }
        return true;
      } catch (error) {
        this.errors.push(`TypeScript definition check failed: ${error.message}`);
        return false;
      }
    });

    // 8. 功能完整性检查
    this.addCheck('⚙️ 功能完整性', async () => {
      try {
        // 检查性能优化器
        const { PerformanceOptimizer } = require('../src/utils/performanceOptimizer');
        const optimizer = new PerformanceOptimizer();
        const stats = optimizer.getStats();
        
        if (!stats || typeof stats.cache === 'undefined') {
          this.errors.push('Performance optimizer not functioning correctly');
          return false;
        }

        // 检查响应验证器
        const { validateResponse } = require('../src/validators/responseValidator');
        if (typeof validateResponse !== 'function') {
          this.errors.push('Response validator not functioning correctly');
          return false;
        }

        return true;
      } catch (error) {
        this.errors.push(`Functionality check failed: ${error.message}`);
        return false;
      }
    });

    // 执行所有检查
    let passedChecks = 0;
    let totalChecks = this.checks.length;

    for (const check of this.checks) {
      try {
        const result = await check.checkFn();
        const status = result ? '✅' : '❌';
        console.log(`${status} ${check.name}`);
        if (result) passedChecks++;
      } catch (error) {
        console.log(`❌ ${check.name} - Error: ${error.message}`);
        this.errors.push(`${check.name}: ${error.message}`);
      }
    }

    // 生成报告
    console.log('\n' + '='.repeat(50));
    console.log('📊 健康检查报告');
    console.log('='.repeat(50));
    console.log(`✅ 通过检查: ${passedChecks}/${totalChecks}`);
    console.log(`❌ 错误数量: ${this.errors.length}`);
    console.log(`⚠️ 警告数量: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ 警告详情:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    const healthScore = (passedChecks / totalChecks) * 100;
    console.log(`\n🏥 项目健康度: ${healthScore.toFixed(1)}%`);

    if (healthScore >= 90) {
      console.log('🎉 项目状态优秀！');
    } else if (healthScore >= 70) {
      console.log('👍 项目状态良好');
    } else if (healthScore >= 50) {
      console.log('⚠️ 项目需要注意');
    } else {
      console.log('🚨 项目需要修复');
      process.exit(1);
    }

    return {
      passed: passedChecks,
      total: totalChecks,
      errors: this.errors,
      warnings: this.warnings,
      healthScore
    };
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const checker = new HealthChecker();
  checker.runAllChecks().catch(console.error);
}

module.exports = { HealthChecker }; 