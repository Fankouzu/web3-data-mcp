/**
 * RootData API TypeScript Definitions
 * 为RootData提供商定义完整的类型系统
 */

// ========== 基础类型定义 ==========

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  credits_used?: number;
  remaining_credits?: number;
}

export interface ApiError {
  message: string;
  code: string | number;
  status?: number;
}

// ========== 配置类型 ==========

export interface RootDataConfig {
  apiKey: string;
  timeout?: number;
  retries?: number;
  baseUrl?: string;
}

export interface ProviderConfig extends RootDataConfig {
  userLevel?: 'basic' | 'plus' | 'pro';
  credits?: number;
}

// ========== API请求参数类型 ==========

export interface SearchParams {
  query: string;
  precise_x_search?: boolean;
}

export interface ProjectParams {
  project_id?: number;
  contract_address?: string;
  include_team?: boolean;
  include_investors?: boolean;
}

export interface OrganizationParams {
  org_id: number;
  include_team?: boolean;
  include_investments?: boolean;
}

export interface PeopleParams {
  people_id: number;
}

export interface IdMapParams {
  type: 1 | 2 | 3; // 1=项目, 2=机构, 3=人物
}

export interface FundingParams {
  page?: number;
  page_size?: number;
  start_time?: string;
  end_time?: string;
  min_amount?: number;
  max_amount?: number;
  rounds?: string[];
}

export interface InvestorParams {
  page?: number;
  page_size?: number;
}

export interface TwitterParams {
  type: 1 | 2 | 3; // 1=项目, 2=机构, 3=人物
}

export interface EcosystemProjectsParams {
  ecosystem_ids: string;
}

export interface TagProjectsParams {
  tag_ids: string;
}

// ========== 响应数据类型 ==========

export interface CreditsInfo {
  apikey: string;
  level: 'basic' | 'plus' | 'pro';
  credits: number;
  total_credits: number;
  last_mo_credits: number;
  start: number;
  end: number;
}

export interface SearchEntity {
  id: number;
  type: number;
  name: string;
  logo: string;
  introduce: string;
  active: boolean;
  rootdataurl: string;
}

export interface SocialMedia {
  website?: string;
  X?: string;
  linkedin?: string;
  telegram?: string;
  discord?: string;
  medium?: string;
}

export interface TeamMember {
  people_id: number;
  people_name: string;
  head_img: string;
  introduce: string;
  position: string;
  X?: string;
  linkedin?: string;
}

export interface Investment {
  org_id: number;
  org_name: string;
  logo: string;
  round: string;
  amount: number;
  published_time: string;
  valuation?: number;
}

export interface Contract {
  chain: string;
  contract_address: string;
  contract_name?: string;
  is_verified: boolean;
}

export interface ProjectData {
  project_id: number;
  project_name: string;
  logo: string;
  one_liner: string;
  description: string;
  active: boolean;
  total_funding: number;
  tags: string[];
  category: string;
  social_media: SocialMedia[];
  team_members?: TeamMember[];
  investors?: Investment[];
  contracts?: Contract[];
  heat?: number;
  heat_rank?: number;
  influence?: number;
  influence_rank?: number;
  followers?: number;
  following?: number;
}

export interface OrganizationData {
  org_id: number;
  org_name: string;
  logo: string;
  description: string;
  category: string;
  establishment_date: string;
  social_media: SocialMedia;
  team_members?: TeamMember[];
  investments?: Investment[];
}

export interface PeopleData {
  people_id: number;
  people_name: string;
  introduce: string;
  head_img: string;
  position?: string;
  social_media?: SocialMedia;
}

export interface IdMapItem {
  id: number;
  name: string;
  logo?: string;
}

export interface FundingRound {
  amount: number;
  valuation?: number;
  published_time: string;
  name: string;
  logo: string;
  rounds: string;
  project_id?: number;
  org_id?: number;
}

export interface FundingData {
  total: number;
  items: FundingRound[];
}

export interface InvestorData {
  invest_id: number;
  invest_name: string;
  type: number;
  logo: string;
  invest_num: number;
}

export interface InvestorsResponse {
  items: InvestorData[];
  total: number;
}

export interface TwitterData {
  id: number;
  name: string;
  X: string;
  followers: number;
  following: number;
  heat: string;
  influence: string;
  logo?: string;
}

export interface EcosystemMap {
  ecosystem_id: number;
  ecosystem_name: string;
  project_num: number;
}

export interface TagMap {
  tag_id: number;
  tag_name: string;
  project_num: number;
}

export interface EcosystemProject {
  project_id: number;
  project_name: string;
  logo: string;
  one_liner: string;
  ecosystem_names: string[];
}

export interface TagProject {
  project_id: number;
  project_name: string;
  logo: string;
  one_liner: string;
  tag_names: string[];
}

// ========== 端点定义类型 ==========

export interface EndpointDefinition {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requiredLevel: 'basic' | 'plus' | 'pro';
  creditsPerCall: number;
  category: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  outputDescription: string;
}

// ========== 提供商状态类型 ==========

export interface ProviderStatus {
  provider: string;
  isInitialized: boolean;
  userLevel: 'basic' | 'plus' | 'pro' | 'unknown';
  credits: number;
  lastCreditsCheck: Date | null;
  availableEndpoints: number;
  totalEndpoints: number;
}

export interface DetailedStatus extends ProviderStatus {
  endpoints: EndpointDefinition[];
  creditsHistory: Array<{
    timestamp: Date;
    credits: number;
    operation: string;
  }>;
  errorLog: Array<{
    timestamp: Date;
    error: string;
    endpoint?: string;
  }>;
}

// ========== 客户端和提供商接口 ==========

export interface IRootDataClient {
  checkCredits(): Promise<ApiResponse<CreditsInfo>>;
  searchEntities(query: string, language?: string, preciseXSearch?: boolean): Promise<ApiResponse<SearchEntity[]>>;
  getProject(projectId?: number, contractAddress?: string, includeTeam?: boolean, includeInvestors?: boolean): Promise<ApiResponse<ProjectData>>;
  getOrganization(orgId: number, includeTeam?: boolean, includeInvestments?: boolean): Promise<ApiResponse<OrganizationData>>;
  getPeople(peopleId: number, language?: string): Promise<ApiResponse<PeopleData>>;
  getIdMap(type: number, language?: string): Promise<ApiResponse<IdMapItem[]>>;
  getFundingRounds(params: FundingParams, language?: string): Promise<ApiResponse<FundingData>>;
  getInvestors(page?: number, pageSize?: number, language?: string): Promise<ApiResponse<InvestorsResponse>>;
  getTwitterMap(type: number, language?: string): Promise<ApiResponse<TwitterData[]>>;
  getProjectsByEcosystems(ecosystemIds: string, language?: string): Promise<ApiResponse<EcosystemProject[]>>;
  getProjectsByTags(tagIds: string, language?: string): Promise<ApiResponse<TagProject[]>>;
}

export interface IRootDataProvider {
  configure(config: RootDataConfig): void;
  initialize(): Promise<boolean>;
  checkCredits(): Promise<ApiResponse<CreditsInfo>>;
  executeApiCall(endpointId: string, params: any): Promise<ApiResponse<any>>;
  
  // 公共API方法
  searchWeb3Entities(query: string, options?: { preciseXSearch?: boolean }): Promise<ApiResponse<SearchEntity[]>>;
  getProjectDetails(projectId: string | number, options?: { includeTeam?: boolean; includeInvestors?: boolean }): Promise<ApiResponse<ProjectData>>;
  getProjectByContract(contractAddress: string, options?: { includeTeam?: boolean; includeInvestors?: boolean }): Promise<ApiResponse<ProjectData>>;
  getOrganizationDetails(orgId: number, options?: { includeTeam?: boolean; includeInvestments?: boolean }): Promise<ApiResponse<OrganizationData>>;
  getPeopleDetails(peopleId: number): Promise<ApiResponse<PeopleData>>;
  getIdMapping(type: 1 | 2 | 3): Promise<ApiResponse<IdMapItem[]>>;
  getFundingInformation(params?: FundingParams): Promise<ApiResponse<FundingData>>;
  getInvestorDetails(page?: number, pageSize?: number): Promise<ApiResponse<InvestorsResponse>>;
  getTwitterData(type: 1 | 2 | 3): Promise<ApiResponse<TwitterData[]>>;
  getProjectsByEcosystems(ecosystemIds: string): Promise<ApiResponse<EcosystemProject[]>>;
  getProjectsByTags(tagIds: string): Promise<ApiResponse<TagProject[]>>;
  getEcosystemMap(): Promise<ApiResponse<EcosystemMap[]>>;
  getTagMap(): Promise<ApiResponse<TagMap[]>>;
  
  // 状态管理
  getStatus(): ProviderStatus;
  getDetailedStatus(): DetailedStatus;
  refreshStatus(): Promise<boolean>;
} 