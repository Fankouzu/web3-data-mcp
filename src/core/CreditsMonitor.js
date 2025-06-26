/**
 * Credits监控系统
 * 监控各供应商的credits状态，提供预警和限制功能
 */

/**
 * Credits状态枚举
 */
const CreditsStatus = {
  OK:        'ok',
  WARNING:   'warning',
  CRITICAL:  'critical',
  EXHAUSTED: 'exhausted'
};

/**
 * 监控事件类型
 */
const MonitorEvents = {
  CREDITS_WARNING:         'credits_warning',
  CREDITS_CRITICAL:        'credits_critical',
  CREDITS_EXHAUSTED:       'credits_exhausted',
  CREDITS_RESTORED:        'credits_restored',
  PROVIDER_STATUS_CHANGED: 'provider_status_changed'
};

class CreditsMonitor {
  constructor() {
    // 默认阈值配置
    this.thresholds = {
      warning:   100, // 警告阈值
      critical:  20, // 严重警告阈值
      exhausted: 0 // 耗尽阈值
    };

    // 提供商状态跟踪
    this.providerStatus = new Map();

    // 事件监听器
    this.eventListeners = new Map();

    // 使用统计
    this.usageStats = {
      totalCreditsConsumed:  0,
      consumptionByProvider: {},
      consumptionByHour:     {},
      dailyConsumption:      {}
    };

    // 自动刷新间隔（毫秒）
    this.autoRefreshInterval = 5 * 60 * 1000; // 5分钟
    this.autoRefreshTimer = null;
  }

  /**
   * 注册提供商
   * @param {string} providerName - 提供商名称
   * @param {Object} provider - 提供商实例
   * @param {Object} customThresholds - 自定义阈值
   */
  registerProvider(providerName, provider, customThresholds = {}) {
    const thresholds = { ...this.thresholds, ...customThresholds };

    this.providerStatus.set(providerName, {
      provider,
      credits:             provider.credits || 0,
      level:               provider.userLevel || 'unknown',
      status:              this._calculateStatus(provider.credits || 0, thresholds),
      thresholds,
      lastCheck:           new Date(),
      totalConsumed:       0,
      isActive:            true,
      consecutiveFailures: 0
    });

    console.error(`📊 Registered Credits monitoring: ${providerName} (Credits: ${provider.credits})`);
  }

  /**
   * 更新提供商Credits状态
   * @param {string} providerName - 提供商名称
   * @param {number} newCredits - 新的credits数量
   * @param {number} consumed - 本次消耗的credits
   */
  updateCredits(providerName, newCredits, consumed = 0) {
    const providerInfo = this.providerStatus.get(providerName);

    if (!providerInfo) {
      console.warn(`⚠️ Provider not found: ${providerName}`);
      return;
    }

    const oldStatus = providerInfo.status;
    const oldCredits = providerInfo.credits;

    // 更新状态
    providerInfo.credits = newCredits;
    providerInfo.status = this._calculateStatus(newCredits, providerInfo.thresholds);
    providerInfo.lastCheck = new Date();
    providerInfo.totalConsumed += consumed;

    // 更新统计信息
    this._updateUsageStats(providerName, consumed);

    // 检查状态变化并触发事件
    if (oldStatus !== providerInfo.status) {
      this._handleStatusChange(providerName, oldStatus, providerInfo.status, oldCredits, newCredits);
    }

    // 检查是否需要发出警告
    this._checkAndEmitWarnings(providerName, providerInfo);
  }

  /**
   * 检查所有提供商状态
   * @returns {Promise<Object>} 所有提供商的状态摘要
   */
  async checkAllProviders() {
    const statusSummary = {
      timestamp: new Date().toISOString(),
      total:     this.providerStatus.size,
      byStatus:  {
        [CreditsStatus.OK]:        0,
        [CreditsStatus.WARNING]:   0,
        [CreditsStatus.CRITICAL]:  0,
        [CreditsStatus.EXHAUSTED]: 0
      },
      providers: {}
    };

    for (const [providerName, providerInfo] of this.providerStatus) {
      try {
        // 尝试刷新提供商状态
        if (providerInfo.provider && typeof providerInfo.provider.checkCredits === 'function') {
          const result = await providerInfo.provider.checkCredits();
          if (result.success) {
            this.updateCredits(providerName, result.credits, 0);
          }
        }

        const currentStatus = this.getProviderStatus(providerName);
        statusSummary.providers[providerName] = currentStatus;
        statusSummary.byStatus[currentStatus.status]++;
      } catch (error) {
        console.error(`❌ Failed to check ${providerName} status:`, error.message);
        providerInfo.consecutiveFailures++;

        // 如果连续失败太多次，标记为不活跃
        if (providerInfo.consecutiveFailures >= 3) {
          providerInfo.isActive = false;
        }
      }
    }

    return statusSummary;
  }

  /**
   * 获取单个提供商状态
   * @param {string} providerName - 提供商名称
   * @returns {Object|null} 提供商状态信息
   */
  getProviderStatus(providerName) {
    const providerInfo = this.providerStatus.get(providerName);

    if (!providerInfo) {
      return null;
    }

    return {
      provider:            providerName,
      credits:             providerInfo.credits,
      level:               providerInfo.level,
      status:              providerInfo.status,
      thresholds:          providerInfo.thresholds,
      lastCheck:           providerInfo.lastCheck,
      totalConsumed:       providerInfo.totalConsumed,
      isActive:            providerInfo.isActive,
      consecutiveFailures: providerInfo.consecutiveFailures,
      message:             this._getStatusMessage(providerInfo.status, providerInfo.credits, providerInfo.thresholds),
      timeUntilCritical:   this._calculateTimeUntilCritical(providerName)
    };
  }

  /**
   * 获取所有提供商的概览
   * @returns {Object} 状态概览
   */
  getOverview() {
    const overview = {
      timestamp:       new Date().toISOString(),
      totalProviders:  this.providerStatus.size,
      activeProviders: 0,
      totalCredits:    0,
      statusBreakdown: {
        [CreditsStatus.OK]:        0,
        [CreditsStatus.WARNING]:   0,
        [CreditsStatus.CRITICAL]:  0,
        [CreditsStatus.EXHAUSTED]: 0
      },
      usageStats: this.usageStats,
      alerts:     []
    };

    for (const [providerName, providerInfo] of this.providerStatus) {
      if (providerInfo.isActive) {
        overview.activeProviders++;
        overview.totalCredits += providerInfo.credits;
      }

      overview.statusBreakdown[providerInfo.status]++;

      // 收集需要注意的警告
      if (providerInfo.status === CreditsStatus.CRITICAL || providerInfo.status === CreditsStatus.EXHAUSTED) {
        overview.alerts.push({
          provider: providerName,
          status:   providerInfo.status,
          credits:  providerInfo.credits,
          message:  this._getStatusMessage(providerInfo.status, providerInfo.credits, providerInfo.thresholds)
        });
      }
    }

    return overview;
  }

  /**
   * 预测Credits消耗
   * @param {string} providerName - 提供商名称
   * @param {number} hours - 预测小时数
   * @returns {Object} 消耗预测
   */
  predictConsumption(providerName, hours = 24) {
    const providerInfo = this.providerStatus.get(providerName);

    if (!providerInfo) {
      return null;
    }

    // 计算每小时平均消耗
    const hourlyConsumption = this._calculateHourlyAverage(providerName);
    const predictedConsumption = hourlyConsumption * hours;
    const currentCredits = providerInfo.credits;
    const remainingAfterPrediction = Math.max(0, currentCredits - predictedConsumption);

    return {
      provider:             providerName,
      currentCredits,
      hourlyAverage:        hourlyConsumption,
      predictedConsumption,
      remainingAfterPrediction,
      hoursUntilExhaustion: hourlyConsumption > 0 ? Math.floor(currentCredits / hourlyConsumption) : Infinity,
      warning:              remainingAfterPrediction <= providerInfo.thresholds.critical
    };
  }

  /**
   * 设置自定义阈值
   * @param {string} providerName - 提供商名称
   * @param {Object} thresholds - 新的阈值设置
   */
  setThresholds(providerName, thresholds) {
    const providerInfo = this.providerStatus.get(providerName);

    if (providerInfo) {
      providerInfo.thresholds = { ...providerInfo.thresholds, ...thresholds };

      // 重新计算状态
      const newStatus = this._calculateStatus(providerInfo.credits, providerInfo.thresholds);
      const oldStatus = providerInfo.status;

      if (newStatus !== oldStatus) {
        providerInfo.status = newStatus;
        this._handleStatusChange(providerName, oldStatus, newStatus, providerInfo.credits, providerInfo.credits);
      }
    }
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 启动自动监控
   * @param {number} intervalMs - 检查间隔（毫秒）
   */
  startAutoMonitoring(intervalMs = this.autoRefreshInterval) {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
    }

    this.autoRefreshTimer = setInterval(async () => {
      try {
        await this.checkAllProviders();
      } catch (error) {
        console.error('❌ Automatic monitoring check failed:', error.message);
      }
    }, intervalMs);

    console.error(`🔄 Started automatic Credits monitoring (interval: ${intervalMs / 1000} seconds)`);
  }

  /**
   * 停止自动监控
   */
  stopAutoMonitoring() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
      console.error('⏸️ Stopped automatic Credits monitoring');
    }
  }

  /**
   * 计算Credits状态
   * @private
   */
  _calculateStatus(credits, thresholds) {
    if (credits <= thresholds.exhausted) {
      return CreditsStatus.EXHAUSTED;
    } else if (credits <= thresholds.critical) {
      return CreditsStatus.CRITICAL;
    } else if (credits <= thresholds.warning) {
      return CreditsStatus.WARNING;
    } else {
      return CreditsStatus.OK;
    }
  }

  /**
   * 处理状态变化
   * @private
   */
  _handleStatusChange(providerName, oldStatus, newStatus, oldCredits, newCredits) {
    console.error(
      `📊 ${providerName} Credits status changed: ${oldStatus} -> ${newStatus} (${oldCredits} -> ${newCredits})`
    );

    this._emitEvent(MonitorEvents.PROVIDER_STATUS_CHANGED, {
      provider:  providerName,
      oldStatus,
      newStatus,
      oldCredits,
      newCredits,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 检查并发出警告
   * @private
   */
  _checkAndEmitWarnings(providerName, providerInfo) {
    const { status, credits } = providerInfo;

    switch (status) {
      case CreditsStatus.WARNING:
        this._emitEvent(MonitorEvents.CREDITS_WARNING, {
          provider:  providerName,
          credits,
          threshold: providerInfo.thresholds.warning,
          timestamp: new Date().toISOString()
        });
        break;

      case CreditsStatus.CRITICAL:
        this._emitEvent(MonitorEvents.CREDITS_CRITICAL, {
          provider:  providerName,
          credits,
          threshold: providerInfo.thresholds.critical,
          timestamp: new Date().toISOString()
        });
        break;

      case CreditsStatus.EXHAUSTED:
        this._emitEvent(MonitorEvents.CREDITS_EXHAUSTED, {
          provider:  providerName,
          credits,
          timestamp: new Date().toISOString()
        });
        break;
    }
  }

  /**
   * 发出事件
   * @private
   */
  _emitEvent(eventName, data) {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Event listener error (${eventName}):`, error.message);
        }
      });
    }
  }

  /**
   * 更新使用统计
   * @private
   */
  _updateUsageStats(providerName, consumed) {
    if (consumed <= 0) return;

    this.usageStats.totalCreditsConsumed += consumed;

    // 按提供商统计
    if (!this.usageStats.consumptionByProvider[providerName]) {
      this.usageStats.consumptionByProvider[providerName] = 0;
    }
    this.usageStats.consumptionByProvider[providerName] += consumed;

    // 按小时统计
    const currentHour = new Date().toISOString().substr(0, 13); // YYYY-MM-DDTHH
    if (!this.usageStats.consumptionByHour[currentHour]) {
      this.usageStats.consumptionByHour[currentHour] = 0;
    }
    this.usageStats.consumptionByHour[currentHour] += consumed;

    // 按天统计
    const currentDay = new Date().toISOString().substr(0, 10); // YYYY-MM-DD
    if (!this.usageStats.dailyConsumption[currentDay]) {
      this.usageStats.dailyConsumption[currentDay] = 0;
    }
    this.usageStats.dailyConsumption[currentDay] += consumed;
  }

  /**
   * 计算每小时平均消耗
   * @private
   */
  _calculateHourlyAverage(providerName) {
    const providerConsumption = this.usageStats.consumptionByProvider[providerName] || 0;
    const hoursOfData = Object.keys(this.usageStats.consumptionByHour).length;

    return hoursOfData > 0 ? providerConsumption / hoursOfData : 0;
  }

  /**
   * 计算到达临界状态的时间
   * @private
   */
  _calculateTimeUntilCritical(providerName) {
    const prediction = this.predictConsumption(providerName, 1);
    if (!prediction || prediction.hourlyAverage <= 0) {
      return null;
    }

    const providerInfo = this.providerStatus.get(providerName);
    const creditsUntilCritical = providerInfo.credits - providerInfo.thresholds.critical;

    if (creditsUntilCritical <= 0) {
      return 0;
    }

    return Math.floor(creditsUntilCritical / prediction.hourlyAverage);
  }

  /**
   * 获取状态消息
   * @private
   */
  _getStatusMessage(status, credits, thresholds) {
    switch (status) {
      case CreditsStatus.OK:
        return `Credits sufficient (${credits})`;
      case CreditsStatus.WARNING:
        return `Credits insufficient (${credits}), please recharge`;
      case CreditsStatus.CRITICAL:
        return `Critical credits shortage (${credits}), please recharge immediately`;
      case CreditsStatus.EXHAUSTED:
        return `Credits exhausted (${credits}), cannot continue using`;
      default:
        return `Unknown status`;
    }
  }
}

module.exports = { CreditsMonitor, CreditsStatus, MonitorEvents };
