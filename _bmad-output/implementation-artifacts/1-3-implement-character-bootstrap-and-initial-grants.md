# Story 1.3: 实现角色初始化与初始发放主链路

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 新玩家，
I want 第一次进入时自动完成角色初始化并获得初始资源与初始幻兽，
so that 我可以立即开始一期核心玩法。

## Acceptance Criteria

1. **Given** 账号首次进入且尚未完成初始化  
   **When** 后端执行初始化流程  
   **Then** 系统一次性创建角色、初始资源、初始幻兽与默认队伍  
   **And** 初始化结果由服务端权威落账

2. **Given** 同一账号重复进入或网络重试  
   **When** 再次触发初始化流程  
   **Then** 系统不会重复发放初始收益  
   **And** 返回同一个已存在角色的当前状态

3. **Given** 初始化成功  
   **When** 客户端请求初始化结果快照  
   **Then** 返回进入主界面所需的最小玩家态数据  
   **And** 不要求客户端自行拼装权威默认状态

## Tasks / Subtasks

- [x] 定义角色初始化与最小玩家快照契约
  - [x] 在 `libs/shared/types` 中补充 `player/init` 所需领域类型，例如 `playerId`、`playerProfile`、`starterResources`、`starterBeast`、`defaultTeam`、`playerInitSnapshot`
  - [x] 在 `libs/shared/contracts` 中定义 `POST /api/v1/player/init` 的请求/响应契约，明确其职责是“校验统一会话并执行幂等初始化”，而不是承载主界面全量数据
  - [x] 在 `libs/shared/schemas` 中为初始化请求/响应增加正式 schema 校验，并补充稳定错误码边界，例如无效会话、初始化请求无效
  - [x] 契约必须复用 Story 1.2 已交付的统一会话语义，不重新发明第二套登录/鉴权输入

- [x] 落地服务端权威初始化用例与临时持久化边界
  - [x] 在 `apps/game-server/src/modules/player` 下创建最小初始化模块、控制器、服务与必要 mapper，暴露 `POST /api/v1/player/init`
  - [x] 在 `apps/game-server/src/modules/account` 现有会话边界上增加最小会话解析能力，使 `player/init` 能基于 Story 1.2 的 `sessionToken -> accountId` 继续推进
  - [x] 优先在 `libs/server/application`、`libs/server/domain`、`libs/server/db` 中建立最小初始化用例、初始化规则与临时仓储边界，而不是把角色创建、初始发放、默认队伍逻辑继续堆在控制器
  - [x] 若本故事仍不引入正式数据库，初始化状态、角色、资源、幻兽与默认队伍的临时存储必须集中在清晰可替换的仓储/存储边界中，不得散落在 controller、H5 或多个无主对象里

- [x] 实现幂等的初始角色、资源、幻兽与默认队伍创建
  - [x] 首次初始化必须由服务端一次性创建唯一角色身份，并返回同一账号对应的唯一 `playerId`
  - [x] 服务端必须一次性落账初始资源、初始幻兽与默认队伍，并把这些结果纳入同一个初始化快照
  - [x] 重复调用或网络重试不得重复生成角色、重复发放初始收益或覆盖已存在状态
  - [x] 如当前业务资料尚未沉淀成正式 starter 配置表，必须将“一期最小 starter package”集中到单一配置/fixture 边界中，并在实现记录中注明来源与待校准项，不得散落硬编码

- [x] 接通 H5 端的初始化快照获取
  - [x] 在 `libs/client/data-access` 中封装 `player/init` 请求函数，输入为当前有效会话，输出为共享初始化快照
  - [x] 在 `apps/game-h5/src/bootstrap` 中补充最小初始化编排，例如 `initialize-player.ts` 或扩展现有 `init-app.ts`，使入口流程变为“恢复会话 -> 请求初始化快照”
  - [x] 如客户端需要缓存初始化结果，只允许在 `libs/client/state` 扩展窄边界快照存储；不得在本故事里创建泛化玩家大 store 或本地假角色
  - [x] 本故事只负责拿到权威初始化快照，不负责主界面渲染、加载态文案、失败反馈视觉或正式页面跳转

- [x] 守住一期初始化范围
  - [x] 不在本故事中展开主界面入口、背包页面、幻兽详情页、战斗页或成长面板 UI
  - [x] 不引入角色命名输入、剧情教程、支付、分享、聊天、交易、联盟、VIP、商城等延期能力
  - [x] 不把旧 `htmlgame` 的本地假用户、假库存或前端生成角色逻辑带入正式初始化主链路

- [x] 完成最小可验证检查
  - [x] 为 `libs/shared/types`、`libs/shared/contracts`、`libs/shared/schemas` 增加 `player/init` 相关测试，验证初始化请求/响应字段和语义
  - [x] 为 `libs/server/application` / `libs/server/domain` / `apps/game-server` 增加初始化幂等测试，验证首次初始化与重复初始化返回一致结果且不重复发放
  - [x] 为 `apps/game-server` 增加接口测试，验证 `POST /api/v1/player/init` 能基于有效 `sessionToken` 返回权威初始化快照，并对无效会话返回稳定错误结果
  - [x] 为 `apps/game-h5` 或 `libs/client/*` 增加最小测试，证明 bootstrap 是消费服务端初始化快照，而不是客户端自行拼装初始资源或默认幻兽

### Review Findings

- [x] [Review][Patch] 统一会话 token 可预测且可枚举，当前 `sess_<accountId>_<sequence>` 方案会让任意客户端伪造其他账号会话 [apps/game-server/src/modules/account/session.store.ts:39]
- [x] [Review][Patch] H5 bootstrap 在鉴权或初始化失败时不会清空旧状态，可能保留上一账号的快照并静默继续启动 [apps/game-h5/src/bootstrap/restore-session.ts:23]

## Dev Notes

### Technical Requirements

- 本故事承接 PRD 中的 `FR2`、`FR3`、`FR4`、`FR5`、`FR6`，是“一期统一入口主链路”的第二段：基于统一会话完成角色初始化、初始发放与最小玩家快照返回。  
  [Source: _bmad-output/planning-artifacts/prd.md#账号与角色起步]
- 一期要求新玩家在首次进入后快速完成角色初始化、获得初始幻兽、进入主界面并开始核心循环，因此本故事返回的初始化快照只应覆盖“可进入主界面与后续核心玩法”的最小状态。  
  [Source: _bmad-output/planning-artifacts/prd.md#Goals and Background Context]  
  [Source: _bmad-output/planning-artifacts/prd.md#账号与角色起步]
- 初始化、初始资源发放、初始幻兽生成与默认队伍创建必须由服务端一次性完成，并保证幂等；重复进入或壳重试不得产生重复收益。  
  [Source: _bmad-output/planning-artifacts/prd.md#账号与角色起步]  
  [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- 本故事需要为 Story 1.4 的入口加载反馈和 Story 1.5 的主界面首轮引导提供稳定输入，因此应优先交付权威初始化快照，不提前展开 UI 页面。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4: 搭建 H5 入口页与初始化加载反馈]  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5: 交付主界面首轮引导与延期入口治理]

### Architecture Compliance

- 架构已经明确一期核心闭环要求“服务端完成角色初始化与默认状态创建，共享 H5 承载交互与展示”，因此本故事必须把初始化和初始发放保持在服务端权威边界内。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- API 边界已定义玩家主链路接口包含 `player/init`；Story 1.3 应围绕 `POST /api/v1/player/init` 交付，不要跳过到背包、幻兽或战斗接口。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- 结构映射已为“账号与角色起步”指定 `apps/game-h5/src/bootstrap`、`apps/game-server/src/modules/account`、`apps/game-server/src/modules/player`、`libs/server/application/src/initialization`，开发时应沿用该边界，不在控制器里堆完整规则。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- 服务边界要求控制器只暴露边界与装配，核心规则进入 `libs/server/application` / `libs/server/domain` / `libs/server/db`；本故事应把这些当前 stub 库开始用于初始化主链路，而不是继续闲置。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]

### Library / Framework Requirements

- 当前工作区实际基线为 `Nx 22.6.4`、`NestJS 11`、`React 19`、`react-router-dom 6.30.3`、`Vitest 4.1.x`、`Jest 30`，本故事应继续沿用，不引入新的状态管理或后端框架。  
  [Source: package.json]
- Story 1.2 已在 `libs/shared/schemas` 正式引入 `zod@^4`；Story 1.3 应复用现有 schema 边界，不再退回匿名对象或松散校验。  
  [Source: _bmad-output/implementation-artifacts/1-2-establish-unified-session-and-host-boundary.md#Completion Notes List]  
  [Source: package.json]
- 当前根依赖仍未引入 `TanStack Query` 与 `Zustand`。Story 1.3 只允许在 `libs/client/state` 维持窄边界快照状态，不得顺手把 H5 全量状态架构提前改造。  
  [Source: package.json]  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]

### File Structure Requirements

- 本故事允许优先修改或新增的目录应集中在：
  - `apps/game-server/src/modules/account/**`
  - `apps/game-server/src/modules/player/**`
  - `apps/game-h5/src/bootstrap/**`
  - `libs/client/data-access/src/**`
  - `libs/client/state/src/**`
  - `libs/shared/types/src/**`
  - `libs/shared/contracts/src/**`
  - `libs/shared/schemas/src/**`
  - `libs/server/application/src/**`
  - `libs/server/domain/src/**`
  - `libs/server/db/src/**`
- Story 1.2 已在 `apps/game-server/src/modules/account` 中交付最小会话入口与 `session.store.ts`。Story 1.3 必须复用这条 `sessionToken -> accountId` 的现有入口，而不是重新建第二套会话模型。  
  [Source: _bmad-output/implementation-artifacts/1-2-establish-unified-session-and-host-boundary.md#File List]
- 当前 `libs/server/application`、`libs/server/domain`、`libs/server/db` 仍是 Nx 占位 stub；Story 1.3 是第一次真正把初始化用例、领域规则和临时仓储边界放进这些库的正确时机。  
  [Source: libs/server/application/src/lib/application.ts]  
  [Source: libs/server/domain/src/lib/domain.ts]  
  [Source: libs/server/db/src/lib/db.ts]
- 当前 `apps/game-h5/src/main.tsx` 已调用 `initializeAppSession()`；Story 1.3 应基于这个已存在入口扩展初始化编排，而不是另起第二个客户端启动入口。  
  [Source: apps/game-h5/src/main.tsx]

### Testing Requirements

- 服务端初始化链路必须优先验证“首次初始化成功”和“重复初始化不重复发放”两条核心场景；手工验证不能替代自动化幂等测试。  
  [Source: _bmad-output/project-context.md#测试规则]  
  [Source: _bmad-output/project-context.md#关键红线规则]
- 初始化主链路测试最少应覆盖：
  - 有效会话下首次初始化返回角色、初始资源、初始幻兽与默认队伍
  - 相同账号二次调用返回同一 `playerId` 与同一份权威状态
  - 无效或缺失会话返回稳定错误结构
  - H5 bootstrap 使用服务端初始化快照，不使用本地假数据拼装结果
- 建议至少运行：
  - `pnpm nx test @workspace/types`
  - `pnpm nx test @workspace/contracts`
  - `pnpm nx test @workspace/schemas`
  - `pnpm nx test @workspace/application`
  - `pnpm nx test @workspace/domain`
  - `pnpm nx test @workspace/db`
  - `pnpm nx test @workspace/data-access`
  - `pnpm nx test @workspace/state`
  - `pnpm nx test @workspace/game-server`
  - `pnpm nx test @workspace/game-h5`

### Previous Story Intelligence

- Story 1.2 已完成统一会话主链路，并把 server 正式前缀切到 `/api/v1`；本故事不应再修改回 `/api` 或绕过现有 `session/auth` 契约。  
  [Source: _bmad-output/implementation-artifacts/1-2-establish-unified-session-and-host-boundary.md#Completion Notes List]
- Story 1.2 已在 `apps/game-server/src/modules/account/session.store.ts` 以临时存储维护 `sessionToken` 与 `accountId` 关系；Story 1.3 应在此基础上承接初始化，而不是在前端自行创造账号。  
  [Source: _bmad-output/implementation-artifacts/1-2-establish-unified-session-and-host-boundary.md#File List]
- Story 1.2 已在 H5 入口形成“恢复会话 -> data-access -> state”最小链路。Story 1.3 应将“请求初始化快照”接在这条链后，而不是在页面组件内部直接 `fetch /player/init`。  
  [Source: _bmad-output/implementation-artifacts/1-2-establish-unified-session-and-host-boundary.md#Completion Notes List]
- Story 1.2 为 `game-h5` 补了 `@workspace/*` alias 与 tsconfig project references；Story 1.3 新增跨库依赖时应沿用同样方式同步 package 与 tsconfig，避免再次触发 workspace out-of-sync。  
  [Source: _bmad-output/implementation-artifacts/1-2-establish-unified-session-and-host-boundary.md#Completion Notes List]

### Latest Tech Information

- 当前 `react-router-dom` 实际使用版本为 `6.30.3`，而不是架构示意中的 v7；Story 1.3 不要预设 v7 路由 API 或 future flags 已启用。  
  [Source: package.json]
- 当前 `game-server` 测试栈仍是 Jest，`game-h5` 与共享库测试栈仍是 Vitest；Story 1.3 不要混入第三套测试框架。  
  [Source: package.json]  
  [Source: apps/game-server/jest.config.cts]  
  [Source: apps/game-h5/vite.config.mts]
- 当前 H5 入口已经在 `main.tsx` 无条件触发 `initializeAppSession()`；因此 Story 1.3 的初始化编排应保持“最小增量接入”，不要在本故事里展开复杂 provider/router 重构。  
  [Source: apps/game-h5/src/main.tsx]

### Project Context Reference

- 开始 Story 1.3 实现前，必须显式列出本故事的输入来源：根需求文档 `召唤之王详细需求文档.pdf`、系统规则目录 `召唤之王/`、移动端布局参考 `布局图/角色.png`，以及如有需要的旧原型 `htmlgame/` 映射参考。  
  [Source: _bmad-output/project-context.md#开发流程规则]
- 可优先作为初始化参考材料的现有资料包括：
  - `召唤之王/幻兽图鉴说明、.doc`
  - `召唤之王/战力数值说明.docx`
  - `布局图/角色.png`
  - `htmlgame/db/schema.sql`
  - `htmlgame/server/src/seed-demo.js`
- 这些资料只能作为 starter 内容、术语和素材映射参考，不得反向驱动继续沿用旧 `htmlgame` 工程结构或前端假数据逻辑。  
  [Source: _bmad-output/project-context.md#新构建基线]  
  [Source: _bmad-output/project-context.md#语言与代码模式规则]
- 角色初始化、初始发放与默认状态创建必须由服务端权威完成，且具备幂等性；浏览器或小程序端都不能自行生成角色、资源或默认队伍结果。  
  [Source: _bmad-output/project-context.md#关键红线规则]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3: 实现角色初始化与初始发放主链路]
- [Source: _bmad-output/planning-artifacts/prd.md#账号与角色起步]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/project-context.md#开发流程规则]
- [Source: _bmad-output/project-context.md#新构建基线]
- [Source: _bmad-output/project-context.md#语言与代码模式规则]
- [Source: _bmad-output/project-context.md#测试规则]
- [Source: _bmad-output/project-context.md#关键红线规则]
- [Source: _bmad-output/implementation-artifacts/1-2-establish-unified-session-and-host-boundary.md]
- [Source: package.json]
- [Source: apps/game-h5/src/main.tsx]
- [Source: apps/game-h5/vite.config.mts]
- [Source: apps/game-server/jest.config.cts]
- [Source: libs/server/application/src/lib/application.ts]
- [Source: libs/server/domain/src/lib/domain.ts]
- [Source: libs/server/db/src/lib/db.ts]
- [Source: 召唤之王/幻兽图鉴说明、.doc]
- [Source: 召唤之王/战力数值说明.docx]
- [Source: 布局图/角色.png]
- [Source: htmlgame/db/schema.sql]
- [Source: htmlgame/server/src/seed-demo.js]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Story context engine analysis for Story 1.3 completed
- `pnpm nx test @workspace/types`
- `pnpm nx test @workspace/contracts`
- `pnpm nx test @workspace/schemas`
- `pnpm nx test @workspace/domain`
- `pnpm nx test @workspace/db`
- `pnpm nx test @workspace/application`
- `pnpm nx test @workspace/state`
- `pnpm nx test @workspace/data-access`
- `pnpm nx test @workspace/game-server`
- `pnpm nx test @workspace/game-h5`
- `pnpm nx run-many -t typecheck -p @workspace/types,@workspace/contracts,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/state,@workspace/data-access,@workspace/game-server,@workspace/game-h5`
- `pnpm nx test @workspace/game-server` (post-review fixes)
- `pnpm nx test @workspace/game-h5` (post-review fixes)
- `pnpm nx run-many -t typecheck -p @workspace/game-server,@workspace/game-h5`

### Completion Notes List

- 已交付 `POST /api/v1/player/init`，由 `apps/game-server/src/modules/player` 暴露统一初始化入口，并通过 `libs/server/application`、`libs/server/domain`、`libs/server/db` 承接初始化规则与临时仓储边界
- 已将 Story 1.2 的统一会话边界扩展为“发放 sessionToken -> 按 token 解析账号 -> 初始化后回绑 playerId”，确保 `player/init` 复用同一套会话语义
- 已将“一期最小 starter package”集中在 `buildStarterPlayerState`，当前最小 starter 内容参考 `召唤之王/幻兽图鉴说明、.doc`、`召唤之王/战力数值说明.docx`、`htmlgame/db/schema.sql`、`htmlgame/server/src/seed-demo.js`，后续仍需与正式 starter 配置表校准
- 已将 H5 入口编排扩展为“恢复会话 -> 请求初始化快照”，并把最小玩家快照缓存限制在 `libs/client/state` 的窄边界中，未提前展开主界面或泛化大 store
- 已完成 Story 1.3 相关自动化测试与类型检查，首次初始化、重复初始化、无效会话与 H5 bootstrap 消费权威快照的路径均已验证
- 已根据 code review 修复两项实现风险：会话 token 改为 opaque UUID 形态，H5 在鉴权或初始化失败时会清理旧 session/snapshot 并将失败上抛到 `onError`

### File List

- _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md
- apps/game-h5/package.json
- apps/game-h5/src/bootstrap/init-app.spec.ts
- apps/game-h5/src/bootstrap/init-app.ts
- apps/game-h5/src/bootstrap/initialize-player.spec.ts
- apps/game-h5/src/bootstrap/initialize-player.ts
- apps/game-h5/src/bootstrap/restore-session.spec.ts
- apps/game-h5/src/bootstrap/restore-session.ts
- apps/game-server/package.json
- apps/game-server/src/app/app.module.ts
- apps/game-server/src/modules/account/account.module.ts
- apps/game-server/src/modules/account/session.service.ts
- apps/game-server/src/modules/account/session.store.ts
- apps/game-server/src/modules/player/player.controller.spec.ts
- apps/game-server/src/modules/player/player.controller.ts
- apps/game-server/src/modules/player/player.module.ts
- apps/game-server/src/modules/player/player.service.ts
- apps/game-server/tsconfig.app.json
- apps/game-server/tsconfig.spec.json
- libs/client/data-access/src/lib/data-access.spec.ts
- libs/client/data-access/src/lib/data-access.ts
- libs/client/state/src/lib/state.spec.ts
- libs/client/state/src/lib/state.ts
- libs/server/application/package.json
- libs/server/application/src/lib/application.spec.ts
- libs/server/application/src/lib/application.ts
- libs/server/application/tsconfig.spec.json
- libs/server/db/package.json
- libs/server/db/src/lib/db.spec.ts
- libs/server/db/src/lib/db.ts
- libs/server/domain/package.json
- libs/server/domain/src/lib/domain.spec.ts
- libs/server/domain/src/lib/domain.ts
- libs/shared/contracts/src/lib/contracts.spec.ts
- libs/shared/contracts/src/lib/contracts.ts
- libs/shared/schemas/src/lib/schemas.spec.ts
- libs/shared/schemas/src/lib/schemas.ts
- libs/shared/types/src/lib/types.spec.ts
- libs/shared/types/src/lib/types.ts
