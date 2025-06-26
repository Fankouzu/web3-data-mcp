# RootData API Reference

## Overview

RootData provides comprehensive Web3 data through RESTful APIs with three subscription tiers: Basic, Plus, and Pro. All API endpoints use POST method and require authentication via API key.

## Base URL
```
https://api.rootdata.com/open
```

## Authentication
All requests must include the following header:
```
apikey: Your_API_Key
```

## Common Response Format
All responses follow this structure:
```json
{
  "data": {}, // Response data
  "result": 200, // Status code (200 for success, 404 for error)
  "message": "error message" // Error message (only in failure cases)
}
```

## API Endpoints

### 1. Search Projects/Organizations/People

**URL:** `https://api.rootdata.com/open/ser_inv`  
**Method:** POST  
**Description:** Search for projects/VCs/people by keywords. Unlimited calls.  
**Supported Versions:** Basic, Plus, Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | true | Search keyword, can be project/organization name, token or other related terms |
| precise_x_search | boolean | false | Precise search based on X Handle (@...) |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| id | int | Unique identifier |
| type | int | 1: Project, 2: Organization, 3: People |
| name | string | Name |
| logo | string | Logo URL |
| introduce | string | Introduction |
| active | boolean | true: Active, false: Inactive |
| rootdataurl | string | Corresponding RootData link |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"query": "ETH" }' https://api.rootdata.com/open/ser_inv
```

#### Success Response Example
```json
{
  "data": [
    {
      "introduce": "Ethereum is the first decentralized...",
      "name": "Ethereum",
      "logo": "https://api.rootdata.com/uploads/public/b15/1666341829033.jpg",
      "rootdataurl": "https://api.rootdata.com/Projects/detail/Ethereum?k=MTI=",
      "id": 12,
      "type": 1
    }
  ],
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 2. Check API Key Balance

**URL:** `https://api.rootdata.com/open/quotacredits`  
**Method:** POST  
**Description:** Query remaining credits for API key, free.  
**Supported Versions:** Basic, Plus, Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
No parameters required.

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| apikey | string | API key |
| start | long | Valid from (timestamp) |
| end | long | Valid until (timestamp) |
| level | string | Subscription level |
| total_credits | int | Total credits |
| credits | int | Current remaining credits |
| last_mo_credits | int | Last month's remaining credits |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json"  https://api.rootdata.com/open/quotacredits
```

#### Success Response Example
```json
{
  "data": {
    "last_mo_credits": 60000,
    "apikey": "XXX",
    "level": "pro",
    "credits": 59688,
    "total_credits": 60000,
    "start": 1721750400000,
    "end": 1787846399000
  },
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 3. Get ID List

**URL:** `https://api.rootdata.com/open/id_map`  
**Method:** POST  
**Description:** Get ID list of all projects, people, and VCs, 20 credits per request.  
**Supported Versions:** Plus, Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | int | true | Type: 1=Project, 2=Organization, 3=People |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| id | long | ID |
| name | string | Entity name |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json"  -d '{"type": 1 }'  https://api.rootdata.com/open/id_map
```

#### Success Response Example
```json
{
  "data": [
    {
      "id": 600,
      "name": "XXX"
    }
  ],
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 4. Get Project Details

**URL:** `https://api.rootdata.com/open/get_item`  
**Method:** POST  
**Description:** Get detailed project information by project ID, 2 credits per request.  
**Supported Versions:** Basic, Plus, Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| project_id | int | false | Project unique identifier. If both `project_id` and `contract_address` are provided, `project_id` takes priority |
| contract_address | string | false | Project contract address. If both `project_id` and `contract_address` are provided, `project_id` takes priority |
| include_team | boolean | false | Whether to include team member information, default is false |
| include_investors | boolean | false | Whether to include investor information, default is false |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| project_id | int | Project ID |
| project_name | string | Project name |
| logo | string | Project logo URL |
| token_symbol | string | Token symbol |
| establishment_date | string | Establishment date |
| one_liner | string | Brief description |
| description | string | Detailed description |
| active | boolean | true: Active, false: Inactive |
| total_funding | decimal | Total funding |
| tags | array | Project tags (array of tag names) |
| rootdataurl | string | Corresponding RootData link |
| investors | array | Investor information |
|   └─ type | int | Type: 1=Project, 2=Organization, 3=People |
|   └─ invest_id | int | Investor ID |
|   └─ name | string | Investor name |
|   └─ logo | string | Investor logo |
|   └─ lead_investor | int | Whether lead investor, 1=Yes, 0=No |
| social_media | array | Social media links |
|   └─ website | string | Official website |
|   └─ X | string | X (Twitter) link |
|   └─ discord | string | Discord link |
|   └─ linkedin | string | LinkedIn link **PRO** |
|   └─ gitbook | string | Gitbook link |
|   └─ cmc | string | CMC ID **PRO** |
|   └─ coingecko | string | CoinGecko ID **PRO** |
|   └─ medium | string | Medium link |
|   └─ defillama | string | DeFiLlama link **PRO** |
|   └─ github | string | GitHub link **PRO** |
| similar_project | array | Similar projects |
|   └─ project_id | int | Project ID |
|   └─ logo | string | Project logo URI |
|   └─ project_name | string | Project name |
|   └─ brief_description | string | Project brief description |
| ecosystem | array | Project ecosystems (array, ecosystem names, no distinction between testnet and mainnet) **PRO** |
| on_main_net | array | Live mainnets (array, ecosystem names) **PRO** |
| plan_to_launch | array | Planned ecosystems (array, ecosystem names) **PRO** |
| on_test_net | array | Live testnets (array, ecosystem names) **PRO** |
| fully_diluted_market_cap | string | Fully diluted market cap **PRO** |
| market_cap | string | Circulating market cap **PRO** |
| price | string | Price **PRO** |
| event | array | Major project events **PRO** |
|   └─ hap_date | string | Event occurrence time |
|   └─ event | string | Event content |
| reports | array | News data **PRO** |
|   └─ title | string | News title |
|   └─ url | string | News link |
|   └─ site | string | News source |
|   └─ time_east | string | News publish time (UTC+8) |
| team_members | array | Team member information **PRO** |
|   └─ head_img | string | Avatar |
|   └─ name | string | Member name |
|   └─ position | string | Position |
|   └─ X | string | X link |
|   └─ linkedin | string | LinkedIn link |
| token_launch_time | string | Token launch time yyyy-MM **PRO** |
| contracts | array | Contracts **PRO** |
|   └─ contract_platform | string | Platform |
|   └─ contract_address | string | Address |
| support_exchanges | array | Supported exchanges (includes exchange name, exchange logo) **PRO** |
| heat | string | X heat value **PRO** |
| heat_rank | int | X heat ranking **PRO** |
| influence | string | X influence **PRO** |
| influence_rank | int | X influence ranking **PRO** |
| followers | int | X followers count **PRO** |
| following | int | Following count **PRO** |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"project_id":8719, "include_team":true,"include_investors":true }' https://api.rootdata.com/open/get_item
```

#### Success Response Example
```json
{
  "data": {
    "ecosystem": [],
    "one_liner": "Building hardware for cryptography",
    "description": "Fabric Cryptography is a start-up company focusing on developing advanced crypto algorithm hardware, especially building special computer chips for Zero-knowledge proof technology.",
    "rootdataurl": "https://api.rootdata.com/Projects/detail/Fabric Cryptography?k=ODcxOQ==",
    "total_funding": 87033106304,
    "project_name": "Fabric Cryptography",
    "investors": [
      {
        "name": "Inflection",
        "logo": "https://api.rootdata.com/uploads/public/b17/1666870085112.jpg"
      }
    ],
    "establishment_date": "2022",
    "tags": [
      "Infra",
      "zk"
    ],
    "project_id": 8719,
    "team_members": [
      {
        "medium": "",
        "website": "https://www.fabriccryptography.com/",
        "twitter": "",
        "discord": "",
        "linkedin": "https://www.linkedin.com/company/fabriccryptography/"
      }
    ],
    "logo": "https://api.rootdata.com/uploads/public/b6/1690306559722.jpg",
    "social_media": {
      "medium": "",
      "website": "https://llama.xyz/",
      "twitter": "https://twitter.com/llama",
      "discord": "",
      "linkedin": ""
    },
    "contract_address": "0x00aU9GoIGOKahBostrD",
    "fully_diluted_market_cap": "1000000",
    "market_cap": "1000000",
    "price": "1000000",
    "reports": []
  },
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 5. Get Organization Details

**URL:** `https://api.rootdata.com/open/get_org`  
**Method:** POST  
**Description:** Get detailed VC information by VC ID, 2 credits per request.  
**Supported Versions:** Basic, Plus, Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| org_id | int | true | Organization ID |
| include_team | boolean | false | Whether to include team member information, default is false |
| include_investments | boolean | false | Whether to include investment project information, default is false |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| org_id | int | Organization ID |
| org_name | string | Organization name |
| logo | string | Organization logo URL |
| establishment_date | string | Establishment date |
| description | string | Detailed description |
| active | boolean | true: Active, false: Inactive |
| category | string | Investor type |
| social_media | array | Social media links (website, X, LinkedIn) |
| investments | array | Investment projects (includes name, logo) |
|   └─ name | string | Project name |
|   └─ logo | string | Project logo |
| rootdataurl | string | Corresponding RootData link |
| team_members | array | Team member information (includes name, position) **PRO** |
|   └─ name | string | Member name |
|   └─ position | string | Position |
| heat | string | X heat value **PRO** |
| heat_rank | int | X heat ranking **PRO** |
| influence | string | X influence **PRO** |
| influence_rank | int | X influence ranking **PRO** |
| followers | int | X followers count **PRO** |
| following | int | Following count **PRO** |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"org_id":219, "include_team":true,"include_investments":true }' https://api.rootdata.com/open/get_org
```

#### Success Response Example
```json
{
  "data": {
    "org_id": 219,
    "team_members": [
      {
        "name": "Shan Aggarwal",
        "position": "Head"
      },
      {
        "name": "Jonathan King",
        "position": "Principal"
      }
    ],
    "logo": "https://rdbk.rootdata.com/uploads/public/b17/1666777683240.jpg",
    "description": "Coinbase Ventures is an investment arm of Coinbase that aims to invest in early-stage cryptocurrency and blockchain startups.",
    "rootdataurl": "https://api.rootdata.com/Investors/detail/Coinbase Ventures?k=MjE5",
    "org_name": "Coinbase Ventures",
    "category": [
      "Seed Plus"
    ],
    "investments": [
      {
        "name": "zkSync / Matter Labs",
        "logo": "https://public.rootdata.com/uploads/public/b16/1666624791085.jpg"
      }
    ],
    "establishment_date": "2018",
    "social_media": {
      "website": "https://www.coinbase.com/ventures",
      "twitter": "https://twitter.com/cbventures",
      "linkedin": ""
    }
  },
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 6. Get People Details (Pro Only)

**URL:** `https://api.rootdata.com/open/get_people`  
**Method:** POST  
**Description:** Get detailed people information by people ID, 2 credits per request.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| people_id | long | true | People ID |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| people_id | long | ID |
| introduce | string | Person introduction |
| head_img | string | Avatar |
| one_liner | string | Brief description |
| X | string | X link |
| people_name | string | Person name |
| linkedin | string | LinkedIn link |
| heat | string | X heat value |
| heat_rank | int | X heat ranking |
| influence | string | X influence |
| influence_rank | int | X influence ranking |
| followers | int | X followers count |
| following | int | Following count |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"people_id":12972 }' https://api.rootdata.com/open/get_people
```

#### Success Response Example
```json
{
  "data": {
    "people_id": 12972,
    "introduce": "Cai Wensheng, also known as Mike Cai, is the founder and chairman of Meitu.",
    "head_img": "https://public.rootdata.com/images/b30/1687197351918.jpg",
    "one_liner": "",
    "X": "",
    "people_name": "Cai Wensheng",
    "linkedin": ""
  },
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 7. Batch Get Investor Information

**URL:** `https://api.rootdata.com/open/get_invest`  
**Method:** POST  
**Description:** Batch get detailed investor information (investment portfolio, data analysis, etc.), 2 credits per record.  
**Supported Versions:** Plus, Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | false | Page number, default 1 |
| page_size | int | false | Records per page, default 10, maximum 100 |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| invest_name | string | Investor name |
| type | int | Type: 1=Project, 2=Organization, 3=People |
| invest_id | int | Investor ID |
| logo | string | Investor logo |
| area | array | Region list |
| last_fac_date | string | Last investment date |
| last_invest_num | int | Investment count in the past year |
| invest_range | array | Investment range |
|   └─ lead_invest_num | int | Lead investment count |
|   └─ amount_range | string | Amount range |
|   └─ lead_not_invest_num | int | Non-lead investment count |
|   └─ invest_num | int | Investment count |
| description | string | Investor description |
| invest_overview | object | Investment overview |
|   └─ lead_invest_num | int | Lead investment count |
|   └─ last_invest_round | int | Recent year investment rounds |
|   └─ his_invest_round | int | Historical investment rounds |
|   └─ invest_num | int | Investment portfolio count |
| investments | array | External investment projects |
|   └─ name | string | Project name |
|   └─ logo | string | Project logo |
| establishment_date | string | Establishment date |
| invest_num | int | Investment count |
| invest_stics | array | Investment landscape |
|   └─ track | string | Track tag |
|   └─ invest_num | int | Investment count |
| team_members | array | Team member information |
|   └─ head_img | string | Avatar |
|   └─ name | string | Member name |
|   └─ position | string | Position |
|   └─ X | string | X homepage |
|   └─ linkedin | string | LinkedIn link |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"page":1,"page_size":10}' https://api.rootdata.com/open/get_invest
```

#### Success Response Example
```json
{
  "data": {
    "items": [
      {
        "area": [
          "Singapore",
          "United Arab Emirates"
        ],
        "last_fac_date": "2023-10-12 00:00:00",
        "last_invest_num": 25,
        "description": "Binance Labs is the...",
        "invest_overview": {
          "lead_invest_num": 38,
          "last_invest_round": 25,
          "his_invest_round": 141,
          "invest_num": 171
        },
        "type": 2,
        "investments": [
          {
            "name": "zkSync / Matter Labs",
            "logo": "https://public.rootdata.com/uploads/public/b16/1666624791085.jpg"
          }
        ],
        "establishment_date": "2017",
        "invest_num": 171,
        "invest_stics": [
          {
            "track": "Infrastructure",
            "invest_num": 69
          }
        ],
        "invest_id": 229,
        "invest_range": [
          {
            "lead_invest_num": 11,
            "amount_range": "1-3M",
            "lead_not_invest_num": 17,
            "invest_num": 28
          }
        ],
        "team_members": [
          {
            "head_img": "https://public.rootdata.com/uploads/public/b12/1669630219503.jpg",
            "name": "Yi He",
            "X": "https://twitter.com/heyibinance",
            "position": "Head"
          }
        ],
        "logo": "https://public.rootdata.com/uploads/public/b11/1666594924745.jpg",
        "invest_name": "Binance Labs"
      }
    ],
    "total": 1
  },
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 8. Batch Export X Data

**URL:** `https://api.rootdata.com/open/twitter_map`  
**Method:** POST  
**Description:** Batch export X data (get X account mapping for projects/organizations/people), 50 credits per request.  
**Supported Versions:** Plus, Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | int | true | Type: 1=Project, 2=Organization, 3=People |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| id | long | ID |
| name | string | Entity name |
| X | string | X |
| followers | int | X followers count |
| following | int | Following count |
| heat | string | X heat value |
| influence | string | X influence |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json"  -d '{"type": 1 }'  https://api.rootdata.com/open/twitter_map
```

#### Success Response Example
```json
{
  "data": [
    {
      "id": 600,
      "name": "XXX",
      "X": "XXX"
    }
  ],
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 9. Batch Get Funding Rounds Information

**URL:** `https://api.rootdata.com/open/get_fac`  
**Method:** POST  
**Description:** Batch get funding rounds information (limited to 2018 onwards), 2 credits per record.  
**Supported Versions:** Plus, Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | false | Page number, default 1 |
| page_size | int | false | Records per page, default 10, maximum 200 |
| start_time | string | false | Funding announcement date (start) yyyy-MM |
| end_time | string | false | Funding announcement date (end) yyyy-MM |
| min_amount | int | false | Minimum funding amount (USD) |
| max_amount | int | false | Maximum funding amount (USD) |
| project_id | int | false | Project ID |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| logo | string | Project logo URL |
| name | string | Project name |
| rounds | string | Round name |
| published_time | string | Funding announcement date |
| amount | long | Funding amount (USD) |
| project_id | int | Project ID |
| valuation | long | Valuation (USD) |
| invests | array | Investor information array, includes logo and name |
|   └─ type | int | Type: 1=Project, 2=Organization, 3=People |
|   └─ invest_id | int | Investor ID |
|   └─ name | string | Investor name |
|   └─ logo | string | Investor logo |
|   └─ lead_investor | int | Whether lead investor, 1=Yes, 0=No |
|   └─ rootdataurl | string | RootData link |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{ }' https://api.rootdata.com/open/get_fac
```

#### Success Response Example
```json
{
  "data": {
    "total": 2870,
    "items": [
      {
        "amount": 2500000,
        "valuation": 30000000,
        "published_time": "2023-10",
        "name": "Convergence",
        "logo": "https://public.rootdata.com/uploads/public/b6/1671983908027.jpg",
        "rounds": "Pre-Seed",
        "invests": [
          {
            "name": "C² Ventures",
            "logo": "https://public.rootdata.com/uploads/public/b17/1666777874118.jpg"
          }
        ]
      }
    ]
  },
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 10. Sync Updates (Pro Only)

**URL:** `https://api.rootdata.com/open/ser_change`  
**Method:** POST  
**Description:** Get list of projects with data updates within a time period, 1 credit per record.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| begin_time | long | true | Start time, timestamp |
| end_time | long | false | End time, timestamp |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| id | int | ID |
| type | int | 1: Project; 2: Organization |
| name | string | Project/Organization name |
| update_time | long | Update time, timestamp |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"begin_time":1693974909261,"end_time":1694476800000,}' https://api.rootdata.com/open/ser_change
```

#### Success Response Example
```json
{
  "data": [
    {
      "update_time": 1693974909261,
      "name": "Ethereum",
      "id": 12,
      "type": 1
    }
  ],
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 11. Hot Projects Top 100 (Pro Only)

**URL:** `https://api.rootdata.com/open/hot_index`  
**Method:** POST  
**Description:** Get Top 100 projects list and basic information, 10 credits per request.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | int | true | Only supports querying recent 1 day/7 days data, 1 or 7 |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| project_id | long | Project ID |
| eval | double | Heat value |
| rank | int | Ranking |
| logo | string | Project logo |
| one_liner | string | Brief description |
| token_symbol | string | Token |
| project_name | string | Project name |
| tags | array | Project tags (array of tag names) |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"days":1}' https://api.rootdata.com/open/hot_index
```

#### Success Response Example
```json
{
  "data": [
    {
      "eval": 907.936508,
      "project_id": 13671,
      "one_liner": "Hemi Network is a modular Layer...",
      "logo": "https://public.rootdata.com/images/b6/1721840384466.png",
      "rank": 1,
      "token_symbol": "",
      "project_name": "Hemi Network",
      "tags": ["Infrastructure", "Layer 2"]
    }
  ],
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 12. X Hot Projects (Pro Only)

**URL:** `https://api.rootdata.com/open/hot_project_on_x`  
**Method:** POST  
**Description:** Get X hot projects list, 10 credits per request.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| heat | boolean | true | X heat ranking |
| influence | boolean | true | X influence ranking |
| followers | boolean | true | X followers ranking |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| heat | array | Heat ranking |
|   └─ score | string | Heat value/influence/followers count |
|   └─ project_id | long | Project ID |
|   └─ logo | string | Project logo |
|   └─ one_liner | string | Brief description |
|   └─ project_name | string | Project name |
|   └─ token_symbol | string | Token symbol |
| influence | array | Influence ranking |
|   └─ score | string | Heat value/influence/followers count |
|   └─ project_id | long | Project ID |
|   └─ logo | string | Project logo |
|   └─ one_liner | string | Brief description |
|   └─ project_name | string | Project name |
|   └─ token_symbol | string | Token symbol |
| followers | array | Followers count ranking |
|   └─ score | string | Heat value/influence/followers count |
|   └─ project_id | long | Project ID |
|   └─ logo | string | Project logo |
|   └─ one_liner | string | Brief description |
|   └─ project_name | string | Project name |
|   └─ token_symbol | string | Token symbol |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"heat":false,"influence":true,"followers":false}' https://api.rootdata.com/open/hot_project_on_x
```

#### Success Response Example
```json
{
  "data": {
    "influence": [
      {
        "score": "5615",
        "project_id": 3875,
        "one_liner": "Cryptocurrency exchange",
        "logo": "https://public.rootdata.com/images/b16/1666878846006.jpg",
        "project_name": "Coinbase"
      }
    ]
  },
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 13. X Hot People (Pro Only)

**URL:** `https://api.rootdata.com/open/leading_figures_on_crypto_x`  
**Method:** POST  
**Description:** Get current X hot people list, 10 credits per request.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | false | Page number, default 1 |
| page_size | int | false | Records per page, default 10, maximum 100 |
| rank_type | string | true | Ranking type "heat" or "influence" |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| people_id | long | ID |
| score | string | Heat value/influence index |
| head_img | string | Avatar |
| one_liner | string | Brief description |
| people_name | string | People name |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"page":1, "page_size":100,"rank_type":"heat" }' https://api.rootdata.com/open/leading_figures_on_crypto_x
```

#### Success Response Example
```json
{
  "data": {
    "total": 1000,
    "items": [
      {
        "people_id": 13994,
        "score": "86",
        "head_img": "https://public.rootdata.com/images/b12/1676887718722.jpg",
        "one_liner": "",
        "people_name": "Jieyi Long"
      },
      {
        "people_id": 13185,
        "score": "66",
        "head_img": "https://public.rootdata.com/images/b12/1669175527817.jpg",
        "one_liner": "",
        "people_name": "Katie Biber"
      }
    ]
  },
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 14. Job Changes (Pro Only)

**URL:** `https://api.rootdata.com/open/job_changes`  
**Method:** POST  
**Description:** Get job changes data, 10 credits per request.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recent_joinees | boolean | true | Recent hires |
| recent_resignations | boolean | true | Recent resignations |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| recent_joinees | array | Recent hires |
|   └─ people_id | long | People ID |
|   └─ head_img | string | Avatar |
|   └─ people_name | string | People name |
|   └─ company | string | Company |
|   └─ position | string | Position |
| recent_resignations | array | Recent resignations |
|   └─ people_id | long | People ID |
|   └─ head_img | string | Avatar |
|   └─ people_name | string | People name |
|   └─ company | string | Company |
|   └─ position | string | Position |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"recent_joinees":true, "recent_resignations":true }' https://api.rootdata.com/open/job_changes
```

#### Success Response Example
```json
{
  "data": {
    "recent_resignations": [
      {
        "people_id": 17262,
        "head_img": "https://public.rootdata.com/images/b6/1702801244037.jpg",
        "company": "Kraken",
        "people_name": "Curtis Ting",
        "position": "VP & Head of Global Operations"
      }
    ],
    "recent_joinees": [
      {
        "people_id": 17316,
        "head_img": "https://public.rootdata.xyz/images/b35/1717668332921.jpg",
        "company": "HTX",
        "people_name": "Test",
        "position": "CTO"
      }
    ]
  },
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 15. New Tokens (Pro Only)

**URL:** `https://api.rootdata.com/open/new_tokens`  
**Method:** POST  
**Description:** Get recently launched tokens list (last 3 months), 10 credits per request.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
None required.

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| project_id | long | Project ID |
| project_name | string | Project name |
| logo | string | Project logo |
| one_liner | string | Brief description |
| token_symbol | string | Token symbol |
| hap_date | string | Event occurrence time |
| market_cap | string | Circulating market cap |
| fully_diluted_market_cap | string | Fully diluted market cap |
| exchanges | string | Exchanges |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json"  https://api.rootdata.com/open/new_tokens
```

#### Success Response Example
```json
{
  "data": [
    {
      "fully_diluted_market_cap": "23372320.99",
      "market_cap": "0",
      "project_id": 12062,
      "one_liner": "Decentralized AI Agent Public Chain",
      "exchanges": "Gate.io,KCEX",
      "logo": "https://public.rootdata.com/images/b12/1711444046699.jpg",
      "hap_date": "2024-09-18",
      "token_symbol": "AGENT",
      "project_name": "AgentLayer"
    }
  ],
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 16. Ecosystem Map (Pro Only)

**URL:** `https://api.rootdata.com/open/ecosystem_map`  
**Method:** POST  
**Description:** Get ecosystem map list, 50 credits per request.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
None required.

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| ecosystem_id | long | Ecosystem ID |
| ecosystem_name | string | Ecosystem name |
| project_num | int | Project count |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json"  https://api.rootdata.com/open/ecosystem_map
```

#### Success Response Example
```json
{
  "data": [
    {
      "ecosystem_name": "Ethereum",
      "ecosystem_id": 52,
      "project_num": 2158
    }
  ],
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 17. Tag Map (Pro Only)

**URL:** `https://api.rootdata.com/open/tag_map`  
**Method:** POST  
**Description:** Get tag map list, 50 credits per request.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
None required.

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| tag_id | long | Tag ID |
| tag_name | string | Tag name |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json"  https://api.rootdata.com/open/tag_map
```

#### Success Response Example
```json
{
  "data": [
    {
      "tag_name": "Bug Bounty",
      "tag_id": 52
    }
  ],
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 18. Projects by Ecosystems (Pro Only)

**URL:** `https://api.rootdata.com/open/projects_by_ecosystems`  
**Method:** POST  
**Description:** Get projects by ecosystem IDs, 20 credits per request.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| ecosystem_ids | string | true | Ecosystem IDs, multiple ecosystems separated by commas |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| project_id | long | Project ID |
| project_name | string | Project name |
| logo | string | Project logo |
| one_liner | string | Brief description |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"ecosystem_ids":"52,54"}'  https://api.rootdata.com/open/projects_by_ecosystems
```

#### Success Response Example
```json
{
  "data": [
    {
      "project_id": 2297,
      "one_liner": "Crypto bug bounty platform",
      "logo": "https://public.rootdata.com/images/b26/1666654548967.jpg",
      "project_name": "Immunefi"
    }
  ],
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

### 19. Projects by Tags (Pro Only)

**URL:** `https://api.rootdata.com/open/projects_by_tags`  
**Method:** POST  
**Description:** Get projects by tag IDs, 20 credits per request.  
**Supported Versions:** Pro

#### Request Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| apikey | string | true | Your applied API key |
| language | string | false | Required language version (e.g., 'en' for English, 'cn' for Chinese, default: 'en') |

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tag_ids | string | true | Tag IDs, multiple tags separated by commas |

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| project_id | long | Project ID |
| project_name | string | Project name |
| logo | string | Project logo |
| one_liner | string | Brief description |

#### Request Example
```bash
curl -X POST -H "apikey: Your APIKEY" -H "language: en" -H "Content-Type: application/json" -d '{"tag_ids":"100,101"}'  https://api.rootdata.com/open/projects_by_tags
```

#### Success Response Example
```json
{
  "data": [
    {
      "project_id": 2297,
      "one_liner": "Crypto bug bounty platform",
      "logo": "https://public.rootdata.com/images/b26/1666654548967.jpg",
      "project_name": "Immunefi"
    }
  ],
  "result": 200
}
```

#### Error Response Example
```json
{
  "data": {},
  "result": 404,
  "message": "error message"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Rate Limit Exceeded - Too many requests |
| 500 | Internal Server Error |

## Best Practices

1. **Rate Limiting**: Respect the API rate limits for your subscription tier
2. **Error Handling**: Always implement proper error handling in your applications
3. **Credits Management**: Monitor your credits usage to avoid service interruption
4. **Data Caching**: Cache frequently used data to reduce API calls
5. **Pagination**: Use pagination for large datasets to improve performance
6. **Language Parameter**: Use the language parameter to get data in your preferred language
7. **Version Control**: Different subscription tiers have access to different endpoints - check your tier

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tag_ids | string | true | Tag IDs (comma-separated) |

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200  | Success | Request successful |
| 404  | Not Found | Resource not found or invalid request |

## Rate Limits

Rate limits are based on your subscription tier and credit allocation. Monitor your credit usage with the `/quotacredits` endpoint.

## Best Practices

1. **Cache responses** when possible to reduce API calls
2. **Monitor credit usage** regularly using the balance endpoint
3. **Use batch endpoints** for multiple records to optimize credit usage
4. **Implement error handling** for 404 responses
5. **Use pagination** for large datasets
6. **Include language parameter** for localized responses

## Support

For API support and questions, please refer to the RootData documentation or contact their support team. 