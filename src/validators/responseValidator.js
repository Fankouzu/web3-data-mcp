/**
 * 响应数据验证器
 * 验证RootData API响应数据的结构和类型
 */

class ValidationError extends Error {
  constructor(message, field = null, value = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

/**
 * 基础验证函数
 */
const validators = {
  isString: (value) => typeof value === 'string',
  isNumber: (value) => typeof value === 'number' && !isNaN(value),
  isBoolean: (value) => typeof value === 'boolean',
  isArray: (value) => Array.isArray(value),
  isObject: (value) => value !== null && typeof value === 'object' && !Array.isArray(value),
  isUrl: (value) => typeof value === 'string' && /^https?:\/\//.test(value),
  isDate: (value) => typeof value === 'string' && !isNaN(Date.parse(value)),
  isOptional: (validator) => (value) => value === undefined || value === null || validator(value)
};

/**
 * 验证字段
 * @param {any} data - 要验证的数据
 * @param {string} field - 字段名
 * @param {Function} validator - 验证函数
 * @param {boolean} required - 是否必需
 */
function validateField(data, field, validator, required = true) {
  const value = data[field];
  
  if (required && (value === undefined || value === null)) {
    throw new ValidationError(`Required field '${field}' is missing`, field, value);
  }
  
  if (!required && (value === undefined || value === null)) {
    return; // 可选字段为空，跳过验证
  }
  
  if (!validator(value)) {
    throw new ValidationError(`Field '${field}' validation failed`, field, value);
  }
}

/**
 * 验证数组中的每个元素
 * @param {Array} array - 要验证的数组
 * @param {Function} validator - 验证函数
 * @param {string} context - 上下文描述
 */
function validateArrayElements(array, validator, context = 'array') {
  if (!Array.isArray(array)) {
    throw new ValidationError(`Expected array but got ${typeof array}`, context, array);
  }
  
  array.forEach((item, index) => {
    try {
      validator(item);
    } catch (error) {
      throw new ValidationError(`${context}[${index}]: ${error.message}`, `${context}[${index}]`, item);
    }
  });
}

/**
 * Credits信息验证器
 */
function validateCreditsInfo(data) {
  validateField(data, 'apikey', validators.isString);
  validateField(data, 'level', (value) => ['basic', 'plus', 'pro'].includes(value));
  validateField(data, 'credits', validators.isNumber);
  validateField(data, 'total_credits', validators.isNumber);
  validateField(data, 'last_mo_credits', validators.isNumber);
  validateField(data, 'start', validators.isNumber);
  validateField(data, 'end', validators.isNumber);
  
  return data;
}

/**
 * 搜索实体验证器
 */
function validateSearchEntity(data) {
  validateField(data, 'id', validators.isNumber);
  validateField(data, 'type', validators.isNumber);
  validateField(data, 'name', validators.isString);
  validateField(data, 'logo', validators.isUrl, false);
  validateField(data, 'introduce', validators.isString, false);
  validateField(data, 'active', validators.isBoolean);
  validateField(data, 'rootdataurl', validators.isUrl, false);
  
  return data;
}

/**
 * 社交媒体验证器
 */
function validateSocialMedia(data) {
  validateField(data, 'website', validators.isUrl, false);
  validateField(data, 'X', validators.isString, false);
  validateField(data, 'linkedin', validators.isUrl, false);
  validateField(data, 'telegram', validators.isString, false);
  validateField(data, 'discord', validators.isString, false);
  validateField(data, 'medium', validators.isUrl, false);
  
  return data;
}

/**
 * 团队成员验证器
 */
function validateTeamMember(data) {
  validateField(data, 'people_id', validators.isNumber);
  validateField(data, 'people_name', validators.isString);
  validateField(data, 'head_img', validators.isUrl, false);
  validateField(data, 'introduce', validators.isString, false);
  validateField(data, 'position', validators.isString, false);
  validateField(data, 'X', validators.isString, false);
  validateField(data, 'linkedin', validators.isUrl, false);
  
  return data;
}

/**
 * 投资验证器
 */
function validateInvestment(data) {
  validateField(data, 'org_id', validators.isNumber);
  validateField(data, 'org_name', validators.isString);
  validateField(data, 'logo', validators.isUrl, false);
  validateField(data, 'round', validators.isString);
  validateField(data, 'amount', validators.isNumber);
  validateField(data, 'published_time', validators.isString);
  validateField(data, 'valuation', validators.isNumber, false);
  
  return data;
}

/**
 * 合约验证器
 */
function validateContract(data) {
  validateField(data, 'chain', validators.isString);
  validateField(data, 'contract_address', validators.isString);
  validateField(data, 'contract_name', validators.isString, false);
  validateField(data, 'is_verified', validators.isBoolean);
  
  return data;
}

/**
 * 项目数据验证器
 */
function validateProjectData(data) {
  validateField(data, 'project_id', validators.isNumber);
  validateField(data, 'project_name', validators.isString);
  validateField(data, 'logo', validators.isUrl, false);
  validateField(data, 'one_liner', validators.isString, false);
  validateField(data, 'description', validators.isString, false);
  validateField(data, 'active', validators.isBoolean);
  validateField(data, 'total_funding', validators.isNumber, false);
  validateField(data, 'tags', validators.isArray, false);
  validateField(data, 'category', validators.isString, false);
  
  // 验证数组字段
  if (data.social_media) {
    validateArrayElements(data.social_media, validateSocialMedia, 'social_media');
  }
  
  if (data.team_members) {
    validateArrayElements(data.team_members, validateTeamMember, 'team_members');
  }
  
  if (data.investors) {
    validateArrayElements(data.investors, validateInvestment, 'investors');
  }
  
  if (data.contracts) {
    validateArrayElements(data.contracts, validateContract, 'contracts');
  }
  
  // 验证可选数值字段
  ['heat', 'heat_rank', 'influence', 'influence_rank', 'followers', 'following'].forEach(field => {
    validateField(data, field, validators.isNumber, false);
  });
  
  return data;
}

/**
 * 机构数据验证器
 */
function validateOrganizationData(data) {
  validateField(data, 'org_id', validators.isNumber);
  validateField(data, 'org_name', validators.isString);
  validateField(data, 'logo', validators.isUrl, false);
  validateField(data, 'description', validators.isString, false);
  validateField(data, 'category', validators.isString, false);
  validateField(data, 'establishment_date', validators.isString, false);
  
  if (data.social_media) {
    validateSocialMedia(data.social_media);
  }
  
  if (data.team_members) {
    validateArrayElements(data.team_members, validateTeamMember, 'team_members');
  }
  
  if (data.investments) {
    validateArrayElements(data.investments, validateInvestment, 'investments');
  }
  
  return data;
}

/**
 * 人物数据验证器
 */
function validatePeopleData(data) {
  validateField(data, 'people_id', validators.isNumber);
  validateField(data, 'people_name', validators.isString);
  validateField(data, 'introduce', validators.isString, false);
  validateField(data, 'head_img', validators.isUrl, false);
  validateField(data, 'position', validators.isString, false);
  
  if (data.social_media) {
    validateSocialMedia(data.social_media);
  }
  
  return data;
}

/**
 * 融资轮次验证器
 */
function validateFundingRound(data) {
  validateField(data, 'amount', validators.isNumber);
  validateField(data, 'valuation', validators.isNumber, false);
  validateField(data, 'published_time', validators.isString);
  validateField(data, 'name', validators.isString);
  validateField(data, 'logo', validators.isUrl, false);
  validateField(data, 'rounds', validators.isString);
  validateField(data, 'project_id', validators.isNumber, false);
  validateField(data, 'org_id', validators.isNumber, false);
  
  return data;
}

/**
 * 融资数据验证器
 */
function validateFundingData(data) {
  validateField(data, 'total', validators.isNumber);
  validateField(data, 'items', validators.isArray);
  
  if (data.items) {
    validateArrayElements(data.items, validateFundingRound, 'funding.items');
  }
  
  return data;
}

/**
 * 投资者数据验证器
 */
function validateInvestorData(data) {
  validateField(data, 'invest_id', validators.isNumber);
  validateField(data, 'invest_name', validators.isString);
  validateField(data, 'type', validators.isNumber);
  validateField(data, 'logo', validators.isUrl, false);
  validateField(data, 'invest_num', validators.isNumber);
  
  return data;
}

/**
 * Twitter数据验证器
 */
function validateTwitterData(data) {
  validateField(data, 'id', validators.isNumber);
  validateField(data, 'name', validators.isString);
  validateField(data, 'X', validators.isString);
  validateField(data, 'followers', validators.isNumber);
  validateField(data, 'following', validators.isNumber);
  validateField(data, 'heat', validators.isString);
  validateField(data, 'influence', validators.isString);
  validateField(data, 'logo', validators.isUrl, false);
  
  return data;
}

/**
 * 主要的响应验证器
 */
const responseValidators = {
  credits_check: validateCreditsInfo,
  
  search_entities: (data) => {
    if (Array.isArray(data)) {
      validateArrayElements(data, validateSearchEntity, 'search_entities');
    }
    return data;
  },
  
  get_project: validateProjectData,
  get_organization: validateOrganizationData,
  get_people: validatePeopleData,
  
  get_id_map: (data) => {
    if (Array.isArray(data)) {
      validateArrayElements(data, (item) => {
        validateField(item, 'id', validators.isNumber);
        validateField(item, 'name', validators.isString);
        validateField(item, 'logo', validators.isUrl, false);
      }, 'id_map');
    }
    return data;
  },
  
  get_funding_rounds: validateFundingData,
  
  get_investors: (data) => {
    validateField(data, 'items', validators.isArray);
    validateField(data, 'total', validators.isNumber);
    
    if (data.items) {
      validateArrayElements(data.items, validateInvestorData, 'investors.items');
    }
    return data;
  },
  
  get_twitter_map: (data) => {
    if (Array.isArray(data)) {
      validateArrayElements(data, validateTwitterData, 'twitter_map');
    }
    return data;
  },
  
  ecosystem_map: (data) => {
    if (Array.isArray(data)) {
      validateArrayElements(data, (item) => {
        validateField(item, 'ecosystem_id', validators.isNumber);
        validateField(item, 'ecosystem_name', validators.isString);
        validateField(item, 'project_num', validators.isNumber);
      }, 'ecosystem_map');
    }
    return data;
  },
  
  tag_map: (data) => {
    if (Array.isArray(data)) {
      validateArrayElements(data, (item) => {
        validateField(item, 'tag_id', validators.isNumber);
        validateField(item, 'tag_name', validators.isString);
        validateField(item, 'project_num', validators.isNumber);
      }, 'tag_map');
    }
    return data;
  },
  
  projects_by_ecosystems: (data) => {
    if (Array.isArray(data)) {
      validateArrayElements(data, (item) => {
        validateField(item, 'project_id', validators.isNumber);
        validateField(item, 'project_name', validators.isString);
        validateField(item, 'logo', validators.isUrl, false);
        validateField(item, 'one_liner', validators.isString, false);
        validateField(item, 'ecosystem_names', validators.isArray, false);
      }, 'ecosystem_projects');
    }
    return data;
  },
  
  projects_by_tags: (data) => {
    if (Array.isArray(data)) {
      validateArrayElements(data, (item) => {
        validateField(item, 'project_id', validators.isNumber);
        validateField(item, 'project_name', validators.isString);
        validateField(item, 'logo', validators.isUrl, false);
        validateField(item, 'one_liner', validators.isString, false);
        validateField(item, 'tag_names', validators.isArray, false);
      }, 'tag_projects');
    }
    return data;
  }
};

/**
 * 验证API响应数据
 * @param {string} endpointId - 端点ID
 * @param {any} data - 响应数据
 * @param {Object} options - 验证选项
 * @returns {any} 验证后的数据
 */
function validateResponse(endpointId, data, options = {}) {
  const { strict = false, skipValidation = false } = options;
  
  if (skipValidation) {
    return data;
  }
  
  const validator = responseValidators[endpointId];
  
  if (!validator) {
    if (strict) {
      throw new ValidationError(`No validator found for endpoint '${endpointId}'`);
    }
    console.warn(`⚠️  No validator available for endpoint: ${endpointId}`);
    return data;
  }
  
  try {
    return validator(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`❌ Validation failed for ${endpointId}:`, error.message);
      if (error.field) {
        console.error(`   Field: ${error.field}, Value:`, error.value);
      }
    }
    
    if (strict) {
      throw error;
    }
    
    console.warn(`⚠️  Validation warning for ${endpointId}, proceeding with unvalidated data`);
    return data;
  }
}

/**
 * 验证API响应的基本结构
 * @param {any} response - API响应
 * @returns {boolean} 是否有效
 */
function validateApiResponse(response) {
  try {
    validateField(response, 'success', validators.isBoolean);
    validateField(response, 'data', (value) => value !== undefined);
    validateField(response, 'error', validators.isString, false);
    validateField(response, 'credits_used', validators.isNumber, false);
    validateField(response, 'remaining_credits', validators.isNumber, false);
    return true;
  } catch (error) {
    console.error('❌ Invalid API response structure:', error.message);
    return false;
  }
}

module.exports = {
  validateResponse,
  validateApiResponse,
  ValidationError,
  validators,
  responseValidators
}; 