/**
 * 语言检测工具
 * 用于自动检测用户查询的语言并返回合适的语言代码
 */

/**
 * 检测文本语言
 * @param {string} text - 要检测的文本
 * @returns {string} 语言代码 ('zh', 'en')
 */
function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return 'en'; // 默认英文
  }

  // 移除空白字符
  const cleanText = text.trim();

  if (cleanText.length === 0) {
    return 'en';
  }

  // 检测中文字符
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  const chineseMatches = cleanText.match(chineseRegex);

  if (chineseMatches) {
    // 计算中文字符比例
    const chineseCharCount = (cleanText.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
    const totalCharCount = cleanText.replace(/\s/g, '').length;

    // 如果中文字符占比超过30%，判定为中文
    if (chineseCharCount / totalCharCount > 0.3) {
      return 'zh';
    }
  }

  // 检测常见的中文词汇
  const chineseKeywords = [
    '比特币',
    '以太坊',
    '区块链',
    '加密货币',
    '数字货币',
    '代币',
    '项目',
    '投资',
    '融资',
    '交易所',
    '钱包',
    '智能合约',
    '去中心化',
    '中心化',
    '公链',
    '私链',
    '联盟链',
    '侧链',
    '挖矿',
    '矿池',
    '节点',
    '共识',
    '算法',
    '协议'
  ];

  for (const keyword of chineseKeywords) {
    if (cleanText.includes(keyword)) {
      return 'zh';
    }
  }

  // 检测英文特征
  const englishRegex = /^[a-zA-Z0-9\s\-_.,!?'"()]+$/;
  if (englishRegex.test(cleanText)) {
    return 'en';
  }

  // 检测常见的英文Web3关键词
  const englishKeywords = [
    'bitcoin',
    'ethereum',
    'blockchain',
    'cryptocurrency',
    'crypto',
    'token',
    'project',
    'investment',
    'funding',
    'exchange',
    'wallet',
    'smart contract',
    'defi',
    'nft',
    'dao',
    'decentralized',
    'centralized',
    'mining',
    'staking'
  ];

  const lowerText = cleanText.toLowerCase();
  for (const keyword of englishKeywords) {
    if (lowerText.includes(keyword)) {
      return 'en';
    }
  }

  // 默认返回英文
  return 'en';
}

/**
 * 获取语言的显示名称
 * @param {string} langCode - 语言代码
 * @returns {string} 语言显示名称
 */
function getLanguageName(langCode) {
  const languages = {
    zh: '中文',
    en: 'English'
  };

  return languages[langCode] || 'English';
}

/**
 * 检测是否为中文文本
 * @param {string} text - 要检测的文本
 * @returns {boolean} 是否为中文
 */
function isChinese(text) {
  return detectLanguage(text) === 'zh';
}

/**
 * 检测是否为英文文本
 * @param {string} text - 要检测的文本
 * @returns {boolean} 是否为英文
 */
function isEnglish(text) {
  return detectLanguage(text) === 'en';
}

module.exports = {
  detectLanguage,
  getLanguageName,
  isChinese,
  isEnglish
};
