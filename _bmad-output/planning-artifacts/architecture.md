---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/project-context.md'
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-04-05'
project_name: '召唤之王'
user_name: 'wlf'
date: '2026-04-05'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
当前 PRD 共定义 45 条功能需求，覆盖 8 个能力域：账号与角色起步、主界面与成长引导、背包与资源管理、幻兽养成与队伍、战斗与关卡推进、基础成长与节奏反馈、运营配置与问题处理、跨端接入与宿主边界。  
从架构视角看，这些需求共同指向一个严格收敛的一期可玩版核心闭环：服务端完成角色初始化与默认状态创建，共享 H5 承载主界面、背包、幻兽和战斗交互，服务端负责结算、奖励和成长推进，同时保留最小配置与排障能力。  
这些功能需求还明确要求架构支持延期系统隔离，避免聊天、交易、联盟、VIP、商城等非一期能力渗入一期主链路。

**Non-Functional Requirements:**
当前 PRD 共定义 26 条非功能需求，覆盖性能、可靠性与数据一致性、安全与权威性、跨端集成与兼容性、可运维性与可配置性、扩展性与容量规划 6 个质量域。  
其中最强的架构驱动项包括：服务端权威结算、初始化幂等、统一服务端时间模型、跨宿主一致性、最小日志与追踪能力、配置化初始化与奖励节奏，以及后续系统扩展时不推翻一期骨架。  
这些 NFR 表明本项目的架构首先要保证规则正确性、边界稳定性和可运维性，其次才是单点技术选型。

**Scale & Complexity:**
本项目属于高复杂度的游戏产品架构问题，不是因为一期系统数量多，而是因为它同时包含共享 H5 客户端、平台壳适配、服务端权威规则、规则文档映射、旧原型迁移边界和后续扩展兼容要求。  
项目当前没有独立 UX 规格与 epics/stories，因此 PRD 与 project-context 将成为当前架构阶段的唯一硬输入，架构文档必须把产品边界和技术边界定义得足够清楚，供后续实现拆解直接使用。

- Primary domain: 共享 H5 游戏客户端 + 后端游戏服务 + 平台宿主适配
- Complexity level: High
- Estimated architectural components: 8-12

### Technical Constraints & Dependencies

- 架构必须以 `prd.md` 和 `project-context.md` 为当前正式输入，不得回退到以旧 `htmlgame` 代码结构驱动决策。
- 旧 `htmlgame`、规则文档、布局图和素材目录是有效参考来源，但只能作为行为、术语、素材和映射输入。
- 一期核心域必须围绕账号与角色初始化、主界面导航、背包、幻兽、基础战斗循环和基础资源成长展开。
- 聊天、交易、联盟、VIP、商城和其他完整首发系统必须被隔离为延期能力，不得在一期核心模块中耦合实现。
- 初始化、战斗结算、奖励发放、养成消耗、容量校验和时间规则必须由服务端权威控制。
- 网页端与微信小程序壳必须通过宿主适配层接入，不得在宿主层复制或分叉核心玩法逻辑。
- 当前没有可直接继承的生产级后端契约、前端模块骨架和自动化测试基线，架构需要补齐这些正式边界。
- 中文业务术语、物品/幻兽/素材标识和规则文档映射必须在架构中保留清晰追溯关系。

### Cross-Cutting Concerns Identified

- 账号会话、角色初始化与默认状态幂等控制
- 服务端权威结算、奖励发放与成长推进
- 服务端统一时间模型与重置规则
- 背包、幻兽栏与容量阻断处理
- 规则文档、旧素材与 ID 映射的配置化管理
- 最小配置能力、日志追踪与排障查询能力
- 共享 H5 与平台壳之间的宿主适配边界
- 一期核心域与延期系统之间的模块隔离与扩展兼容

## Starter Template Evaluation

### Primary Technology Domain

全栈 monorepo / workspace 更符合本项目要求，因为一期虽范围收敛，但从一开始就同时需要共享 H5 主客户端、服务端权威规则层、平台壳适配边界，以及可共享的领域模型、契约定义和配置映射。  
如果直接选单应用 starter，后续仍需补工作区结构、共享包与服务边界，返工概率较高。

### Starter Options Considered

**Option 1: `create-vite@9.0.3`**

- 优点：轻量、启动快，适合共享 H5 客户端；`react-ts` 模板成熟，WebView/H5 场景友好。
- 局限：只解决前端应用起步，不解决后端服务、共享契约和工作区边界，后续仍需补 monorepo 结构。

**Option 2: `create-next-app@16.2.2`**

- 优点：React 生态成熟，CLI 维护活跃，自带较完整工程化约定。
- 局限：默认偏 App Router / SSR / 全栈站点思路，对“共享 H5 游戏 + 小程序壳 WebView”目标并不天然占优，会引入当前一期不需要的 SSR 复杂度。

**Option 3: `create-turbo@2.9.3`**

- 优点：提供现代 monorepo 编排能力，适合多应用、多包协作。
- 局限：更偏仓库编排底座，React/Vite、服务框架、测试和目录边界仍需自行补充较多决策，对当前项目约束不够强。

**Option 4: `create-nx-workspace@22.6.4`**

- 优点：天然适合多应用、多库与共享领域包；能在一套正式工作区内容纳共享 H5、服务端、宿主适配层和共享 contracts/domain libs；对一期先做核心域、二期扩展延期域更友好。
- 局限：比 Vite 单应用更重，团队需要接受 workspace / project graph 的工程约束。

### Selected Starter: Nx Workspace + React/Vite H5 Baseline

**Rationale for Selection:**
建议选 `Nx` 作为正式骨架起点。原因不是“它最流行”，而是它最贴合当前项目的结构性问题：

- 项目目标不是单前端页面，而是“共享 H5 客户端 + 后端服务 + 平台壳边界 + 共享契约”
- 已明确不能再走旧 `htmlgame` 巨型单页路线
- 后续一定需要共享领域模型、接口契约、配置映射和模块隔离
- 一期与延期系统边界需要在目录和模块层级就被约束出来

因此，`Nx` 更适合作为正式工程骨架 starter，而不是单纯脚手架。

**Initialization Command:**

```bash
npx create-nx-workspace@latest summon-king \
  --preset=react-monorepo \
  --appName=game-h5 \
  --bundler=vite \
  --style=css \
  --unitTestRunner=vitest \
  --e2eTestRunner=playwright \
  --packageManager=pnpm \
  --nxCloud=skip \
  --skipGit
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- 以 TypeScript/Node 作为正式工程语言基线
- 比旧 demo 的 JavaScript/CommonJS 更适合后续共享契约与边界校验

**Styling Solution:**
- 先采用基础 CSS 起步
- 不在 starter 阶段强绑定 Tailwind 或 CSS-in-JS
- 更适合后续根据现有布局图和旧素材做移动端 H5 定制还原

**Build Tooling:**
- 前端由 Vite 路线支撑
- 比 SSR 型 starter 更贴合共享 H5 与 WebView 场景

**Testing Framework:**
- 单元测试基线采用 Vitest
- E2E 基线采用 Playwright
- 更适合验证一期初始化、背包、战斗和奖励主链路

**Code Organization:**
- 用 workspace/monorepo 结构承载多个应用和共享库
- 适合拆出 `game-h5`、`game-server`、`platform-adapters`、`shared-domain`、`shared-contracts`、`config-mappings`

**Development Experience:**
- 提供明确的项目图、任务编排和边界感
- 后续扩展二期系统时，不容易再次退化成单页堆功能

**Backend Companion Option:**
- `@nestjs/cli@11.0.17` 当前仍在维护
- 如果后续在 Nx 内补服务端应用，NestJS 是自然候选
- 但此处先锁定“工作区骨架”，后端框架在后续正式架构决策中再定

**Note:** 项目初始化与工作区生成应作为第一条实现故事，不建议在当前旧目录上直接边改边迁。

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- 正式后端架构采用 `Nx workspace` 内的 `NestJS 11` 模块化单体，而不是继续沿用旧 Express demo，也不是一期就拆微服务。
- 一期主数据库采用 `MySQL 8.4 LTS` 线，保持与现有 schema 参考、数值型游戏数据结构和事务一致性需求的兼容。
- 数据访问与迁移基线采用 `Prisma 7.6.0`，用于 schema 管理、迁移与类型化数据访问；性能热点允许后续补充显式 SQL。
- 一期 API 采用 `REST + JSON` 契约，不引入 GraphQL；服务端通过 OpenAPI 文档输出正式接口边界。
- 认证采用“宿主身份输入 + 后端统一会话令牌”的模型：网页端与微信小程序壳通过各自身份入口接入，但最终都换取服务端统一玩家会话。
- 共享 H5 客户端采用 `React 19 + React Router 7 + TanStack Query 5 + Zustand 5` 的组合：路由负责页面流转，Query 负责服务端状态，Zustand 负责本地会话与轻量交互状态。
- 一期部署采用“静态 H5 + 容器化 API + 托管 MySQL”的分层模型，不把共享 H5 与后端绑成同一部署单元。

**Important Decisions (Shape Architecture):**
- API 边界校验采用 `Zod 4` 统一请求/响应 schema，客户端与服务端共享契约定义。
- 领域模型采用按核心玩法域拆分的模块化设计，而不是按页面或接口堆叠。
- 一期只引入只读配置缓存和必要的服务端内存缓存，不把 Redis 作为实现阻断项。
- 权限模型分为“玩家资源所有权校验”与“运营/排障 RBAC”两层。
- 结构化日志、关键业务审计日志、初始化/奖励/容量阻断追踪能力在一期内就纳入正式架构。

**Deferred Decisions (Post-MVP):**
- 分布式缓存 Redis
- 消息队列与异步事件总线
- 微服务拆分
- GraphQL / BFF 专用层
- 云厂商锁定
- 商业化支付、VIP、商城安全补强
- 完整运营后台与复杂客服工作台

### Data Architecture

- **Primary Database:** `MySQL 8.4 LTS`
  选择理由：旧 schema 和既有资料本就围绕 MySQL 组织；一期需要可靠事务、一致性更新和清晰表结构，不需要为了“新”而更换数据库类型。

- **Data Modeling Approach:** 采用“领域模块 + 主数据/玩家态分离”的建模方式。
  主数据层负责物品、幻兽、关卡、奖励、配置、素材映射等静态或低频变更数据；
  玩家态负责账号、角色、资源、背包、幻兽实例、队伍、进度、战斗结果与日志。
  这样可以保证规则文档映射、旧素材映射和玩家数据增长彼此分离。

- **Persistence Strategy:** 一期后端保持模块化单体，但数据库模型按核心域拆分：
  `account/session`
  `player/profile`
  `inventory/storage`
  `pet/beast`
  `battle/pve-progression`
  `resource/currency`
  `config/reference-data`
  `audit/event-log`

- **Validation Strategy:** API 边界用 `Zod 4.3.6`，服务端领域层负责业务规则校验，数据库负责唯一性、外键与关键约束。
  这样能把“输入合法”和“业务允许”拆开，避免规则散落在前端或控制器里。

- **Migration Strategy:** 使用 `Prisma 7.6.0` migration 作为正式 schema 演进路径，旧 `htmlgame/db/schema.sql` 只作参考映射，不直接延用为生产基线。

- **Caching Strategy:** 一期不把 Redis 设为前置依赖。
  可先采用：
  - 只读配置与素材映射的进程内缓存
  - 显式失效的短生命周期缓存
  - 不缓存玩家关键资产写路径
  当并发与跨实例压力出现后，再引入分布式缓存。

### Authentication & Security

- **Authentication Method:** 采用“平台身份适配 + 服务端统一会话”的架构。
  网页端和微信小程序壳可以有不同的登录入口，但都必须在后端换取统一的玩家账号标识与会话令牌。
  领域层不感知宿主差异，只识别统一 `accountId/playerId`。

- **Authorization Pattern:** 玩家接口采用资源所有权校验；运营、配置、排障接口采用角色权限控制。
  不在一期把后台权限系统做复杂，但必须保留最小 RBAC 边界。

- **Security Middleware:** 强制 HTTPS、CORS 白名单、请求 schema 校验、认证中间件、关键接口限流。
  不允许客户端直接提交最终战斗结果或资源变更结果。

- **Data Protection:** 会话令牌、敏感配置、数据库连接信息必须由服务端保护；玩家敏感数据与关键资产日志不得在客户端或明文日志中泄露。

- **API Security Strategy:** 初始化、奖励领取、养成确认、战斗提交等关键写操作应具备幂等或重复提交保护，防止壳重试、网络重放和前端重复点击造成资产异常。

### API & Communication Patterns

- **Primary API Style:** 一期使用 `REST + JSON`。
  原因：契约清晰、对共享 H5 和小程序壳都直观、便于排障与日志追踪，也更适合一期模块化单体。

- **API Documentation:** 服务端输出 OpenAPI/Swagger 文档，作为客户端、测试和后续 AI 代理实现的一致契约来源。

- **Error Handling Standard:** 统一错误响应模型，至少包含：
  - 稳定错误码
  - 面向玩家的可显示信息或可映射提示
  - 追踪标识 `requestId/traceId`
  - 可区分“阻断”“重试”“排障”的错误语义

- **Service Communication:** 一期后端保持模块化单体，模块之间优先使用进程内服务调用和明确接口，不做网络化服务间通信。
  这能减少一期过度拆分带来的复杂性，同时保留未来拆服务的边界。

- **Rate Limiting Strategy:** 对登录、初始化、奖励领取、战斗结算提交等接口设置更严格限流；对只读查询接口采用较宽松策略。

- **Background Processing Strategy:** 一期优先采用单体内调度/任务机制处理必要的重置或延迟任务，不额外引入队列中间件作为前置依赖。

### Frontend Architecture

- **Client Stack:** `React 19.2.4` + `React Router 7.14.0` + `TanStack Query 5.96.2` + `Zustand 5.0.12`

- **State Management Strategy:**
  - Query 管理服务端状态：角色信息、背包、幻兽、关卡、奖励读取
  - Zustand 管理本地状态：登录态壳桥接、本地 UI 状态、临时战斗表现状态、导航状态
  - 不把服务端权威数据长期复制到本地全局 store 中作为真实来源

- **Component Architecture:** 按一期核心域组织前端模块：
  `bootstrap/init`
  `main-hub`
  `inventory`
  `pet`
  `battle`
  `growth`
  `platform-bridge`
  `shared-ui`
  `asset-mapping`
  不再沿用旧 `htmlgame` 的“页面 + 全局脚本 + DOM 指令”结构。

- **Routing Strategy:** 使用正式路由管理主界面、背包、幻兽、战斗和成长页面流转；延期系统入口只保留显式占位或关闭态，不挂半逻辑。

- **Performance Strategy:** 首屏核心目标是初始化后尽快进入主界面与首场战斗，因此采用路由级拆包、关键资源预加载、非关键延期模块不进首包的策略。

- **Platform Boundary Strategy:** 共享 H5 只通过 `platform-bridge` 访问宿主能力，网页容器和微信小程序壳差异都封装在适配器后，不进入业务页面逻辑。

### Infrastructure & Deployment

- **Hosting Strategy:** 共享 H5 作为静态前端应用独立部署，后端 API 作为容器化服务部署，数据库使用托管 MySQL。
  这样最符合“一个共享游戏应用 + 多宿主壳 + 一个权威后端”的结构。

- **Environment Configuration:** 配置分层为：
  - 应用运行配置
  - 游戏数值与玩法配置
  - 平台适配配置
  - 敏感密钥配置
  后两者不得混入前端包体。

- **Monitoring & Logging:** 一期必须落地：
  - 服务健康检查
  - 结构化日志
  - 关键业务事件日志
  - 初始化/奖励/容量阻断/结算追踪
  完整 APM 和高级观测平台可后续补充。

- **Scaling Strategy:** API 服务保持无状态，可水平扩展；数据库先垂直扩展为主；缓存、队列和读写分离在数据量与并发压力真实出现后再引入。

- **CI/CD Approach:** 采用 workspace 任务驱动的构建与测试流水线，但具体 CI 平台暂不锁定。
  当前工作区不是 git 仓库，因此此阶段只定义流水线能力要求，不绑定某个托管平台。

### Decision Impact Analysis

**Implementation Sequence:**
1. 初始化 Nx 工作区与 `game-h5` 应用
2. 在工作区中创建 `game-server` 与共享库边界
3. 定义共享 contracts、domain 模型和配置映射层
4. 建立账号/角色初始化主链路
5. 建立背包、幻兽、战斗、奖励、成长核心域
6. 补平台壳适配层与最小排障/配置能力

**Cross-Component Dependencies:**
- 统一账号会话模型会直接影响客户端启动流程、服务端鉴权和宿主适配层
- MySQL + Prisma 选择会直接影响领域模型、迁移方式和审计日志结构
- REST + Zod + OpenAPI 契约会同时影响前端数据层、测试基线和后续 Story 拆解
- React Query + Zustand 的状态边界，会决定前端哪些数据可以缓存、哪些必须每次以服务端为准
- 模块化单体决定一期先把核心域做完整，再为二期系统保留拆分边界，而不是先做分布式复杂度

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
当前识别出 7 类高风险冲突点：数据库命名、API 契约命名、前后端字段格式、模块归属、状态管理边界、错误与加载处理方式、平台壳桥接方式。  
这些模式如果不提前统一，不同 AI 代理会很容易在相同功能域里写出彼此不兼容的代码。

### Naming Patterns

**Database Naming Conventions:**

- 数据库表名统一使用 `snake_case` 复数形式，例如 `players`、`player_inventory_slots`、`battle_results`
- 字段名统一使用 `snake_case`
- 主键统一为 `id`
- 外键统一为 `{entity}_id`，例如 `player_id`、`beast_id`
- 时间字段统一使用 `created_at`、`updated_at`；业务发生时间使用具语义字段，例如 `resolved_at`、`granted_at`
- 索引命名统一为 `idx_{table}_{column}`，唯一索引统一为 `uq_{table}_{column}`

**API Naming Conventions:**

- 对外 HTTP 路径统一使用 `/api/v1/...`
- 路径资源名统一使用 `kebab-case` 或常规 REST 片段，不使用驼峰，例如 `/api/v1/players/me`、`/api/v1/beasts/active-team`
- 集合资源使用复数名词，例如 `/players`、`/battles`、`/rewards`
- 路由参数统一使用 `:playerId` 这种 lowerCamel 形式
- Query 参数统一使用 `camelCase`
- 不允许出现旧 demo 风格的动词型接口命名，例如 `/getPlayerInfo`、`/doBattle`

**Code Naming Conventions:**

- TypeScript 代码中的变量、函数、DTO 字段统一使用 `camelCase`
- React 组件、Nest 类、类型、接口统一使用 `PascalCase`
- 文件名统一使用 `kebab-case`
- 功能目录按领域使用 `kebab-case`
- 枚举值统一使用稳定英文标识，不直接把中文文案当作代码值
- 中文业务术语保留在文档、配置映射、展示文案层，不直接作为代码标识符

### Structure Patterns

**Project Organization:**

- 整体结构按“应用 + 共享库 + 领域模块”组织，而不是按页面拼盘组织
- 共享 H5、后端服务、平台壳桥接、共享契约、共享领域类型、配置映射必须分层放置
- 前端模块按一期核心域组织：`init`、`main-hub`、`inventory`、`pet`、`battle`、`growth`
- 后端模块按业务域组织：`account`、`player`、`inventory`、`beast`、`battle`、`resource`、`config`、`audit`
- 测试优先与源代码共置，单元测试统一使用 `*.spec.ts` / `*.spec.tsx`
- E2E 与跨模块验收测试保持独立，不混入业务源码目录

**File Structure Patterns:**

- 契约定义统一进入共享 contracts 库，不允许控制器和页面私自各写一套接口类型
- Zod schema、DTO、响应类型必须放在同一能力边界下维护，不能分散到各处
- 配置映射与旧素材映射统一进入独立 `config/reference` 或 `asset-mapping` 位置
- 静态素材路径不允许直接硬编码在业务服务与领域规则中
- 平台桥接代码只能放在 `platform-bridge` 或宿主适配层，不进入业务页面和领域服务

### Format Patterns

**API Response Formats:**

- 成功响应统一采用 `{ data, meta? }` 结构
- 错误响应统一采用 `{ error: { code, message, details? }, requestId }` 结构
- 关键写操作响应必须返回足够的结果对象，不能只回裸 `true`
- 同一类接口不得一部分返回裸对象、一部分返回包装对象

**Data Exchange Formats:**

- API JSON 字段统一使用 `camelCase`
- 数据库层使用 `snake_case`，通过映射层或 ORM 边界完成转换
- 日期时间统一使用 UTC ISO 8601 字符串
- 布尔值统一使用 `true/false`，不使用 `0/1` 代替
- `null` 只用于语义上确实为空的字段；未返回字段表示当前契约未提供，不混用
- 数值资源字段保持数值类型，不在 API 中字符串化规避类型问题

### Communication Patterns

**Event System Patterns:**

- 一期后端内部事件命名统一使用 `domain.aggregate.event` 的 lower-dot-case
- 示例：`player.initialized`、`battle.resolved`、`reward.granted`
- 事件 payload 必须包含稳定主键、事件时间和必要上下文
- 一期事件主要用于模块内解耦与审计，不作为前期复杂异步平台
- 如事件语义升级，优先新增事件名，不静默改旧 payload 结构

**State Management Patterns:**

- 服务端权威状态统一由 `TanStack Query` 管理
- `Zustand` 只管理本地 UI 状态、宿主桥状态、临时交互状态
- 不允许把角色、背包、奖励、战斗结果等权威数据长期复制到 Zustand 作为真实来源
- Query key 统一使用数组形式，并以领域名开头，例如 `['player', 'profile']`、`['inventory', 'bag']`
- Store 命名按领域拆分，不创建巨型全局 store
- 状态更新统一走显式 action，不在组件中散落无主的状态拼接逻辑

### Process Patterns

**Error Handling Patterns:**

- 服务端错误必须区分：业务阻断、鉴权失败、输入非法、系统异常
- 客户端不得直接把服务端原始错误文本透传给玩家
- 玩家可见文案由前端映射稳定错误码生成
- 关键链路错误必须带 `requestId/traceId`
- 写操作失败后优先保证“资产状态可解释”，再考虑自动恢复

**Loading State Patterns:**

- 读取型加载状态优先依赖 Query 内建状态
- 写操作型加载状态使用明确 mutation 状态，不自造多套命名
- 页面级加载只用于首屏或强依赖加载；局部操作优先使用局部 loading
- 不允许全局 loading 遮罩吞掉具体阻断信息
- 首次引导、奖励领取、战斗结算等关键动作必须有可感知反馈，不允许静默处理中断

**Retry & Idempotency Patterns:**

- 查询请求可按默认策略有限重试
- 写请求默认不自动重试，除非接口具备明确幂等保障
- 初始化、奖励领取、战斗结算、养成确认等关键操作必须在服务端具备幂等设计
- 前端重复点击保护不能替代服务端幂等

### Enforcement Guidelines

**All AI Agents MUST:**

- 所有新增能力都必须先判断属于一期核心域、延期域、平台壳层、配置映射层中的哪一类，再决定归属位置。
- 所有 API 契约、Zod schema、DTO 和前端消费类型必须围绕共享 contracts 统一维护，不允许一端私自定义。
- 所有权威规则必须落在服务端领域层，前端只做展示、输入收集和结果反馈。
- 所有旧 `htmlgame` 参考内容只能通过映射或素材复用进入新系统，不允许直接复制旧页面脚本结构。
- 所有时间、奖励、容量、成长、初始化逻辑必须默认以服务端为准，不得依赖客户端本地判断。

**Pattern Enforcement:**

- 新模块评审时，先检查命名、归属层级、契约位置和状态边界是否符合本节规则
- 如发现模式冲突，应先修正结构和契约，再继续加功能
- 如确需更新模式，应先更新架构文档本节，再执行实现

### Pattern Examples

**Good Examples:**

- 数据库表：`player_beasts`
- API 路径：`POST /api/v1/players/me/initialization`
- API 成功响应：
  ```json
  {
    "data": {
      "playerId": 10001,
      "nickname": "召唤者",
      "initializationStatus": "completed"
    }
  }
  ```
- API 错误响应：
  ```json
  {
    "error": {
      "code": "BAG_CAPACITY_FULL",
      "message": "背包容量不足",
      "details": {
        "storageType": "bag"
      }
    },
    "requestId": "req_01"
  }
  ```
- 前端文件：`inventory-page.tsx`
- React 组件：`InventoryPage`
- 后端事件：`reward.granted`

**Anti-Patterns:**

- 继续新增 `game.html + game.js` 式入口文件
- 控制器返回裸 `true` 或裸字符串
- API 同时混用 `snake_case` 和 `camelCase`
- 页面组件直接调用宿主 API，而不经过 `platform-bridge`
- 把角色、背包等权威状态长期存进 Zustand 并绕过 Query
- 直接用 `Date.now()` 决定每日重置或奖励可领状态
- 直接在业务代码中硬编码旧素材 ID、旧图标路径或旧原型 DOM 逻辑

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
summon-king/
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── nx.json
├── tsconfig.base.json
├── eslint.config.mjs
├── .env.example
├── .env.local.example
├── vitest.workspace.ts
├── playwright.config.ts
├── apps/
│   ├── game-h5/
│   │   ├── project.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── public/
│   │   │   └── assets/
│   │   │       ├── ui/
│   │   │       ├── beasts/
│   │   │       ├── items/
│   │   │       └── scenes/
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── app/
│   │       │   ├── app.tsx
│   │       │   ├── providers.tsx
│   │       │   └── router.tsx
│   │       ├── bootstrap/
│   │       │   ├── init-app.ts
│   │       │   ├── restore-session.ts
│   │       │   └── preload-critical-assets.ts
│   │       ├── routes/
│   │       │   ├── entry-route.tsx
│   │       │   ├── main-hub-route.tsx
│   │       │   ├── inventory-route.tsx
│   │       │   ├── beasts-route.tsx
│   │       │   ├── battle-route.tsx
│   │       │   └── growth-route.tsx
│   │       ├── features/
│   │       │   ├── init/
│   │       │   ├── main-hub/
│   │       │   ├── inventory/
│   │       │   ├── beast/
│   │       │   ├── battle/
│   │       │   └── growth/
│   │       ├── shared/
│   │       │   ├── components/
│   │       │   ├── layouts/
│   │       │   ├── feedback/
│   │       │   └── formatters/
│   │       └── styles/
│   └── game-server/
│       ├── project.json
│       ├── nest-cli.json
│       ├── tsconfig.app.json
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── common/
│       │   │   ├── auth/
│       │   │   ├── guards/
│       │   │   ├── pipes/
│       │   │   ├── interceptors/
│       │   │   ├── filters/
│       │   │   ├── errors/
│       │   │   └── logging/
│       │   └── modules/
│       │       ├── account/
│       │       ├── player/
│       │       ├── inventory/
│       │       ├── beast/
│       │       ├── battle/
│       │       ├── resource/
│       │       ├── config/
│       │       ├── audit/
│       │       └── ops/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seeds/
│       └── test/
│           ├── integration/
│           └── e2e/
├── libs/
│   ├── shared/
│   │   ├── contracts/
│   │   │   └── src/
│   │   │       ├── common/
│   │   │       ├── auth/
│   │   │       ├── player/
│   │   │       ├── inventory/
│   │   │       ├── beast/
│   │   │       ├── battle/
│   │   │       └── resource/
│   │   ├── schemas/
│   │   │   └── src/
│   │   │       ├── common/
│   │   │       ├── requests/
│   │   │       └── responses/
│   │   ├── types/
│   │   │   └── src/
│   │   │       ├── ids/
│   │   │       ├── enums/
│   │   │       └── view-models/
│   │   └── reference-data/
│   │       └── src/
│   │           ├── asset-registry/
│   │           ├── legacy-id-maps/
│   │           └── rule-snapshots/
│   ├── platform/
│   │   ├── bridge/
│   │   │   └── src/
│   │   ├── web-adapter/
│   │   │   └── src/
│   │   └── wechat-adapter/
│   │       └── src/
│   ├── client/
│   │   ├── data-access/
│   │   │   └── src/
│   │   ├── state/
│   │   │   └── src/
│   │   ├── ui-kit/
│   │   │   └── src/
│   │   ├── game-shell/
│   │   │   └── src/
│   │   └── asset-loader/
│   │       └── src/
│   └── server/
│       ├── db/
│       │   └── src/
│       ├── domain/
│       │   └── src/
│       │       ├── account/
│       │       ├── player/
│       │       ├── inventory/
│       │       ├── beast/
│       │       ├── battle/
│       │       ├── resource/
│       │       └── common/
│       ├── application/
│       │   └── src/
│       │       ├── initialization/
│       │       ├── rewards/
│       │       ├── progression/
│       │       └── audit/
│       └── config/
│           └── src/
├── tools/
│   ├── scripts/
│   ├── generators/
│   └── fixtures/
├── docs/
│   ├── source-mapping/
│   │   ├── requirement-docs/
│   │   ├── layout-references/
│   │   └── legacy-htmlgame/
│   └── api/
├── infra/
│   ├── docker/
│   │   ├── game-server.Dockerfile
│   │   └── game-h5.Dockerfile
│   └── local/
│       └── docker-compose.mysql.yml
└── _bmad-output/
    ├── project-context.md
    └── planning-artifacts/
```

### Architectural Boundaries

**API Boundaries:**
- `game-h5` 只能通过 `/api/v1` 调用后端，不直接接触数据库或宿主私有实现。
- 玩家主链路接口分为：`session/auth`、`player/init`、`player/profile`、`inventory`、`beast`、`battle`、`resource/reward`。
- `ops/config/audit` 为内部管理边界，不进入共享 H5 正常玩家路由。

**Component Boundaries:**
- 页面路由只负责编排，不承载领域规则。
- `features/*` 只处理本域 UI、交互和调用，不跨域直接读写其他 feature 内部状态。
- 共享 UI、格式化、反馈组件统一进入 `apps/game-h5/src/shared` 或 `libs/client/ui-kit`。

**Service Boundaries:**
- `apps/game-server/src/modules/*` 负责控制器、模块装配和边界暴露。
- `libs/server/application` 负责用例编排。
- `libs/server/domain` 负责核心规则。
- `libs/server/db` 负责 Prisma、仓储和持久化细节。
- 不允许控制器直接写规则，不允许前端复制服务端结算逻辑。

**Data Boundaries:**
- 数据库 schema 与迁移只在 `apps/game-server/prisma`。
- 共享契约类型只在 `libs/shared/contracts`、`libs/shared/schemas`、`libs/shared/types`。
- 旧素材 ID、规则快照、布局映射统一放在 `libs/shared/reference-data` 与 `docs/source-mapping`。
- 平台适配层不保存权威玩家数据，只传递宿主身份与能力。

### Requirements to Structure Mapping

**Feature/Epic Mapping:**
- `账号与角色起步` -> `apps/game-h5/src/bootstrap`、`apps/game-h5/src/features/init`、`apps/game-server/src/modules/account`、`apps/game-server/src/modules/player`、`libs/server/application/src/initialization`
- `主界面与成长引导` -> `apps/game-h5/src/features/main-hub`、`libs/client/game-shell`、`apps/game-server/src/modules/player`
- `背包与资源管理` -> `apps/game-h5/src/features/inventory`、`apps/game-server/src/modules/inventory`、`apps/game-server/src/modules/resource`
- `幻兽养成与队伍` -> `apps/game-h5/src/features/beast`、`apps/game-server/src/modules/beast`
- `战斗与关卡推进` -> `apps/game-h5/src/features/battle`、`apps/game-server/src/modules/battle`、`libs/server/application/src/progression`
- `基础成长与节奏反馈` -> `apps/game-h5/src/features/growth`、`apps/game-server/src/modules/resource`、`apps/game-server/src/modules/config`
- `运营配置与问题处理` -> `apps/game-server/src/modules/config`、`apps/game-server/src/modules/audit`、`apps/game-server/src/modules/ops`
- `跨端接入与宿主边界` -> `libs/platform/bridge`、`libs/platform/web-adapter`、`libs/platform/wechat-adapter`

**Cross-Cutting Concerns:**
- 共享契约与 schema -> `libs/shared/contracts`、`libs/shared/schemas`
- 审计日志与关键链路追踪 -> `apps/game-server/src/modules/audit`、`libs/server/application/src/audit`
- 旧文档/旧原型映射 -> `libs/shared/reference-data`、`docs/source-mapping`
- 本地与跨端状态边界 -> `libs/client/data-access`、`libs/client/state`、`libs/platform/bridge`

### Integration Points

**Internal Communication:**
- `game-h5` -> `libs/client/data-access` -> `libs/shared/contracts/schemas` -> REST API
- `game-h5` -> `libs/platform/bridge` -> `web-adapter / wechat-adapter`
- `game-server modules` -> `libs/server/application` -> `libs/server/domain` -> `libs/server/db`

**External Integrations:**
- 浏览器宿主
- 微信小程序壳
- MySQL
- 后续可追加日志、监控、支付、分析，但不进入一期阻断结构

**Data Flow:**
- 宿主身份 -> 平台桥接 -> 会话换取 -> 初始化/主界面快照 -> 背包/幻兽/战斗动作 -> 服务端结算 -> 审计日志 -> 返回更新后的玩家态

### File Organization Patterns

**Configuration Files:**
- 根目录放 workspace 与通用构建配置
- 应用级配置放各 `apps/*`
- 敏感变量不进前端
- 数值/映射/素材参考不放 `.env`，统一走 `reference-data` 与服务端配置层

**Source Organization:**
- 应用入口在 `apps`
- 可复用能力在 `libs`
- 文档映射在 `docs/source-mapping`
- 工具脚本与生成器在 `tools`

**Test Organization:**
- 单元测试与源码共置
- 集成/E2E 测试放 `apps/game-server/test` 和后续前端 E2E 目录
- 契约测试围绕 `libs/shared/contracts` 与服务端接口输出组织

**Asset Organization:**
- 真正交付到 H5 的静态资源放 `apps/game-h5/public/assets`
- 旧原型素材映射、ID 对照、规则快照放 `libs/shared/reference-data`
- 不允许业务代码直接引用 `htmlgame` 原路径作为正式依赖

### Development Workflow Integration

**Development Server Structure:**
- 本地开发同时运行 `game-h5`、`game-server`、本地 MySQL
- 平台桥接默认支持 mock，避免开发期依赖真实微信壳

**Build Process Structure:**
- `game-h5` 构建为静态前端产物
- `game-server` 构建为独立 Node 服务
- 共享库先编译/校验，再进入应用构建

**Deployment Structure:**
- H5 与 API 独立发布
- DB migration 由服务端发布流程控制
- 宿主壳只消费 H5 产物与桥接契约，不拥有业务实现

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
当前技术决策之间兼容性良好。工作区骨架采用 `Nx`，共享 H5 客户端采用 `React + Vite`，后端采用 `NestJS` 模块化单体，数据库采用 `MySQL + Prisma`，接口契约采用 `REST + Zod + OpenAPI`。  
这组决策与项目的核心目标一致：共享 H5 负责统一客户端体验，服务端负责权威规则，平台壳适配层被物理隔离，延期系统不侵入一期主循环。

**Pattern Consistency:**
实现模式与技术决策一致。命名规则、状态边界、契约位置、事件命名、错误结构、加载与重试策略，都服务于“多个 AI 代理能够写出可拼接代码”的目标。  
尤其是数据库 `snake_case`、API `camelCase`、共享 contracts/schema、Query 与 Zustand 的职责分离，已经足以避免后续最常见的实现分叉。

**Structure Alignment:**
当前项目结构能够承载前述架构决策。`apps` 负责应用入口，`libs` 负责共享能力与领域层，`platform`、`shared contracts`、`reference-data`、`server domain/application/db` 的分离符合服务端权威、平台适配隔离和旧原型映射隔离的要求。  
结构没有把旧 `htmlgame` 的单页模式带入正式骨架，方向正确。

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
当前尚未创建 epics/stories，因此本轮按 FR 类别验证。架构已为 8 个功能域提供明确落点：账号与角色起步、主界面与成长引导、背包与资源管理、幻兽养成与队伍、战斗与关卡推进、基础成长与节奏反馈、运营配置与问题处理、跨端接入与宿主边界。  
这意味着后续 story 拆解可以直接映射到既定模块，不需要重新发明系统边界。

**Functional Requirements Coverage:**
45 条 FR 均有明确架构承接路径：
- 玩家初始化、默认资源、默认队伍 -> `account/player/initialization`
- 背包、资源、容量阻断 -> `inventory/resource`
- 幻兽、队伍、养成 -> `beast`
- 战斗、关卡、奖励 -> `battle/progression/rewards`
- 配置、日志、排障 -> `config/audit/ops`
- 跨端一致性 -> `platform bridge + shared contracts`
当前未发现“PRD 写了，但架构里没有落点”的能力。

**Non-Functional Requirements Coverage:**
26 条 NFR 已被架构覆盖：
- 性能：通过 Vite H5、路由级拆包、静态前端独立部署、API 分层支撑
- 可靠性与一致性：通过服务端权威、幂等、统一时间模型、事务与审计支撑
- 安全与权威性：通过统一会话、写接口保护、RBAC、服务端裁定支撑
- 跨端兼容：通过平台桥接边界和共享 H5 单应用模型支撑
- 可运维性与可配置性：通过 `config/audit/ops` 模块与结构化日志支撑
- 扩展性：通过模块化单体、共享契约、延期系统隔离支撑

### Implementation Readiness Validation ✅

**Decision Completeness:**
关键决策已经具备实现可用性：后端形态、数据库、ORM、前端状态管理、契约方式、部署形态、平台边界都已明确，且关键版本已核对。  
后续实现阶段不需要再为这些核心基础问题反复摇摆。

**Structure Completeness:**
项目结构已经具体到应用、共享库、领域模块、平台桥接、契约层、映射层、测试层和部署层。  
这对 AI 代理足够具体，可以直接据此生成 story、脚手架和后续代码目录。

**Pattern Completeness:**
当前实现模式已经覆盖最容易造成冲突的区域：命名、状态、契约、错误、加载、幂等、桥接和旧原型映射。  
对于一期可玩版，这套规则已经足够作为“统一写法约束”。

### Gap Analysis Results

**Critical Gaps:**
- 未发现阻断实现的关键缺口。

**Important Gaps:**
- 尚未把一期 API 清单细化到 endpoint 级别；这更适合放在后续 epics/stories 或首批 story 里处理。
- 尚未单独产出 UX 规格文档；这不阻挡架构成立，但会影响页面级交互细节统一度。
- `ops` 目前是架构边界定义，不是完整后台产品定义；一期先满足最小排障/配置即可。

**Nice-to-Have Gaps:**
- 可在后续补一份接口目录或 Mermaid 架构图
- 可在后续补一份“旧 `htmlgame` -> 新骨架”映射索引
- 可在后续补 `bmad-create-ux-design`，把竖屏页面流转和反馈节奏单独固化

### Validation Issues Addressed

- 已避免把旧 `htmlgame` 结构误当成正式工程基础
- 已把共享 H5 与微信小程序壳边界从产品要求转为正式架构边界
- 已把一期范围和延期系统隔离写进模块结构与实现规则
- 已把服务端权威、幂等、容量阻断、日志追踪从“原则”落实到架构组件层

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- 一期目标收敛明确，没有被完整首发版需求拖宽
- 共享 H5、平台壳适配、服务端权威三层边界清楚
- 旧原型被降级为参考输入，没有绑架正式骨架
- 结构、模式、契约、状态边界已经足够支持多代理一致实现
- 为后续二期系统保留了扩展边界，但不影响一期落地

**Areas for Future Enhancement:**
- 后续补充 UX 规格，进一步统一竖屏交互和反馈节奏
- 后续补充接口清单与契约示例，降低 story 执行歧义
- 后续在实现前补充 epics/stories，把模块边界进一步分配到开发单元

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**
先初始化 `Nx` 工作区、创建 `game-h5` 与 `game-server`，并落地共享 contracts、platform bridge 和 initialization 主链路骨架。
