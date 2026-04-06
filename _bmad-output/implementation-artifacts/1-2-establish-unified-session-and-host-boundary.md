# Story 1.2: 建立统一会话与宿主接入边界

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 玩家，
I want 无论从网页端还是微信小程序壳进入都能建立统一会话，
so that 我可以以一致方式进入游戏而不受宿主差异影响。

## Acceptance Criteria

1. **Given** 玩家从网页端进入共享 H5  
   **When** 客户端请求建立游戏会话  
   **Then** 系统通过网页宿主适配层接入身份信息  
   **And** 后端返回统一玩家会话结果

2. **Given** 玩家从微信小程序壳进入共享 H5  
   **When** 客户端请求建立游戏会话  
   **Then** 系统通过微信宿主适配层接入身份信息  
   **And** 后端返回与网页端一致语义的统一玩家会话结果

3. **Given** 宿主能力存在差异  
   **When** 共享 H5 调用宿主桥接  
   **Then** 业务页面只通过 `platform-bridge` 访问宿主能力  
   **And** 不在页面逻辑中直接写平台专属分支规则

## Tasks / Subtasks

- [x] 定义统一会话契约与宿主输入标准化模型
  - [x] 在 `libs/shared/types` 中定义最小统一会话领域类型，例如 `hostPlatform`、`normalizedHostIdentity`、`sessionToken`、`accountId`、`needsPlayerInitialization`
  - [x] 在 `libs/shared/contracts` 中定义 `POST /api/v1/session/auth` 的请求/响应契约，确保网页端与微信端共享同一语义结果结构
  - [x] 在 `libs/shared/schemas` 中使用正式 schema 边界定义请求/响应校验；如当前根依赖尚未引入 `zod`，在本故事中显式添加，而不是临时手写松散校验
  - [x] 契约只覆盖“统一会话建立”所需最小字段，不提前混入角色初始化、奖励、支付、分享等后续能力

- [x] 落地平台桥与宿主适配层最小实现
  - [x] 在 `libs/platform/bridge` 定义共享 H5 唯一可见的宿主访问接口，例如“识别宿主平台”“提取宿主身份输入”“暴露最小宿主能力”
  - [x] 在 `libs/platform/web-adapter` 与 `libs/platform/wechat-adapter` 实现同一接口，并输出统一 `normalizedHostIdentity`
  - [x] 开发期必须支持 mock / fallback 行为，避免本地开发阻塞在真实微信壳环境
  - [x] 业务页面、`apps/game-h5/src/bootstrap`、`libs/client/*` 不得直接调用浏览器宿主私有实现或微信专属全局 API

- [x] 落地服务端统一会话入口与最小会话服务
  - [x] 将 `apps/game-server/src/main.ts` 的全局 API 前缀对齐到 `/api/v1`，因为本故事开始交付第一条正式玩家主链路接口
  - [x] 在 `apps/game-server/src/modules/account` 下创建最小会话模块、控制器、服务与必要 DTO/mapper，暴露 `POST /api/v1/session/auth`
  - [x] 服务端统一接收宿主标准化输入，并返回一致语义的统一会话结果；网页端与微信端可以来源不同，但不得返回两套不同意义的 payload
  - [x] 若当前故事暂不引入正式数据库持久化，实现必须把临时会话存储隔离在清晰的 account/session 边界后，标注为可替换实现，不得把临时状态散落在控制器或前端

- [x] 接通 H5 bootstrap 的统一会话恢复入口
  - [x] 在 `apps/game-h5/src/bootstrap` 下创建 `restore-session.ts`，必要时补充 `init-app.ts` 之类的最小启动编排文件
  - [x] 在 `libs/client/data-access` 中封装统一会话请求函数，供 bootstrap 调用，不在页面组件里直接拼接 `fetch` 与宿主输入
  - [x] 如需要在客户端保留最小会话结果，只允许放在 `libs/client/state` 的窄边界中；不得在本故事里创建泛化玩家全局状态或本地假玩家数据
  - [x] 本故事不要求完成主界面跳转、加载视觉反馈或首屏错误文案，这些留给后续入口故事处理

- [x] 守住一期范围与平台边界
  - [x] 不在本故事里实现角色初始化、初始发放、主界面导航、背包读取、幻兽读取、战斗结算
  - [x] 不接入聊天、交易、联盟、VIP、商城等延期系统
  - [x] 不实现真实微信登录闭环、支付、分享或复杂宿主生命周期，只建立后续可扩展的正式边界

- [x] 完成最小可验证检查
  - [x] 为 `libs/shared/contracts`、`libs/shared/schemas`、`libs/shared/types` 增加统一会话相关测试，验证请求/响应结构与字段语义
  - [x] 为 `libs/platform/bridge`、`libs/platform/web-adapter`、`libs/platform/wechat-adapter` 增加测试，验证两端最终都能产出统一 `normalizedHostIdentity`
  - [x] 为 `apps/game-server` 增加会话接口测试，验证网页端与微信端在同一契约下返回一致语义结果
  - [x] 为 `apps/game-h5` 或 `libs/client/*` 增加最小测试，证明 bootstrap 是通过 `platform-bridge` + `data-access` 建立会话，而不是页面直接写平台分支

## Dev Notes

### Technical Requirements

- 本故事覆盖 PRD 中的 `FR1`、`FR41`、`FR42`、`FR43`，是“一期统一入口主链路”的第一段，只负责建立统一会话，不负责角色初始化与后续玩法数据。  
  [Source: _bmad-output/planning-artifacts/prd.md#账号与角色起步]  
  [Source: _bmad-output/planning-artifacts/prd.md#跨端接入与宿主边界]
- 一期必须维持“共享 H5 是唯一核心客户端，网页端与微信小程序壳只是宿主容器”的边界；宿主差异只能影响接入方式，不得影响返回语义和后续主链路。  
  [Source: _bmad-output/planning-artifacts/prd.md#跨端接入与宿主边界]
- 会话只是主链路第一步。本故事产物必须为 Story 1.3 的角色初始化与 Story 1.4 的入口加载反馈提供稳定输入，不要在本故事里提前拼接玩家初始资源或主界面快照。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3: 实现角色初始化与初始发放主链路]  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4: 搭建 H5 入口页与初始化加载反馈]

### Architecture Compliance

- 认证与接入模型已明确为“宿主身份输入 + 后端统一会话令牌”，领域层最终只识别统一 `accountId/playerId` 语义，不感知网页端或微信端差异。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- `Platform Boundary Strategy` 已明确要求共享 H5 只能通过 `platform-bridge` 访问宿主能力，网页容器和微信小程序壳差异都必须封装在适配器后。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- 正式玩家主链路接口边界包含 `session/auth`，且所有对外接口都应进入 `/api/v1/...` 命名空间；本故事是第一条正式玩家主链路接口，因此需要把 server global prefix 从当前样板的 `/api` 对齐到 `/api/v1`。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- 数据流必须遵循：`宿主身份 -> 平台桥接 -> 会话换取 -> 后续初始化/主界面快照`。不要让 `apps/game-h5` 页面直接读取宿主私有对象，也不要让 server 控制器直接耦合宿主细节。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]

### Library / Framework Requirements

- 当前工作区已实际安装并在用的基线版本是：`Nx 22.6.4`、`NestJS 11`、`React 19`、`react-router-dom 6.30.3`、`Vitest 4.1.0`、`Jest 30`。本故事默认沿用当前已安装版本，不在本故事里额外做框架升级。  
  [Source: package.json]
- 架构要求 API 边界用正式 schema 管理；当前根依赖尚未包含 `zod`，如果本故事要在 `libs/shared/schemas` 实现正式请求/响应 schema，应在本故事里显式添加 `zod@4`，而不是使用匿名对象校验或散落校验函数。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- 架构长期目标包含 `TanStack Query` 与 `Zustand`，但当前根依赖尚未安装这两个包。本故事不得顺手把 H5 全量状态层一起改造；只有在会话恢复的最小实现明确需要时，才可引入最小依赖，并把范围限制在会话边界内。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]  
  [Source: package.json]

### File Structure Requirements

- 允许优先修改或新增的文件/目录应集中在：
  - `apps/game-server/src/main.ts`
  - `apps/game-server/src/app/app.module.ts`
  - `apps/game-server/src/modules/account/**`
  - `apps/game-h5/src/bootstrap/**`
  - `libs/platform/bridge/src/**`
  - `libs/platform/web-adapter/src/**`
  - `libs/platform/wechat-adapter/src/**`
  - `libs/client/data-access/src/**`
  - `libs/client/state/src/**`（仅限最小会话边界）
  - `libs/shared/contracts/src/**`
  - `libs/shared/schemas/src/**`
  - `libs/shared/types/src/**`
  - `package.json`（仅当显式补 `zod` 或本故事确需的最小依赖）
- 当前这些库还是 Nx 生成的占位实现，典型文件如 `libs/platform/bridge/src/lib/bridge.ts`、`libs/platform/web-adapter/src/lib/web-adapter.ts`、`libs/client/data-access/src/lib/data-access.ts`、`libs/shared/contracts/src/lib/contracts.ts` 都只是字符串 stub；本故事应优先替换这些最小 stub，而不是平行创建另一套重复库。  
  [Source: libs/platform/bridge/src/lib/bridge.ts]  
  [Source: libs/platform/web-adapter/src/lib/web-adapter.ts]  
  [Source: libs/client/data-access/src/lib/data-access.ts]  
  [Source: libs/shared/contracts/src/lib/contracts.ts]
- `apps/game-h5/src/main.tsx` 目前只包了 `BrowserRouter`，`apps/game-h5/src/app/app.tsx` 仍是 Nx 模板路由。本故事如果需要接通 bootstrap，只允许做最小入口编排，不要在这一条 story 里展开完整 UI 重构。  
  [Source: apps/game-h5/src/main.tsx]  
  [Source: apps/game-h5/src/app/app.tsx]

### Testing Requirements

- 前端共享库测试继续使用 `Vitest`；`game-server` 继续使用当前 Nest/Jest 路径，不要为本故事混入另一套测试栈。  
  [Source: package.json]  
  [Source: apps/game-server/jest.config.cts]
- 最少应覆盖以下验证：
  - 宿主输入标准化测试：网页端与微信端适配器都能产出相同结构的 `normalizedHostIdentity`
  - 契约/schema 测试：会话请求/响应字段、错误码、必要字段都能被共享库稳定导出
  - 服务端测试：`POST /api/v1/session/auth` 对两类宿主输入返回一致语义结果
  - H5/bootstrap 测试：入口恢复函数只通过 `platform-bridge` 与 `data-access` 调会话，不写页面内平台分支
- 建议至少运行：
  - `pnpm nx test @workspace/bridge`
  - `pnpm nx test @workspace/web-adapter`
  - `pnpm nx test @workspace/wechat-adapter`
  - `pnpm nx test @workspace/contracts`
  - `pnpm nx test @workspace/schemas`
  - `pnpm nx test @workspace/types`
  - `pnpm nx test @workspace/data-access`
  - `pnpm nx test @workspace/game-server`

### Previous Story Intelligence

- Story 1.1 已在根目录建立 Nx 正式工作区，`apps/game-h5`、`apps/game-server`、`libs/shared/*`、`libs/platform/*`、`libs/client/*` 都已经落位。当前 story 的正确方向是“在既有骨架上填充统一会话能力”，不是再开第二套目录。  
  [Source: _bmad-output/implementation-artifacts/1-1-init-nx-workspace-and-shared-skeleton.md]
- Story 1.1 已通过 `.nxignore` 将 `htmlgame/**` 排除出正式 Nx scope。Story 1.2 不得回退到旧 `htmlgame` 页面或旧 Express demo 登录链路，只能把旧原型当参考。  
  [Source: _bmad-output/implementation-artifacts/1-1-init-nx-workspace-and-shared-skeleton.md]  
  [Source: _bmad-output/project-context.md#新构建基线]
- 当前 repo 不是 git 仓库，因此实施记录、测试命令和文件改动必须直接回写 story 与 `_bmad-output` 产物，不要把 branch/commit 当默认流程前提。  
  [Source: _bmad-output/project-context.md#开发流程规则]

### Latest Tech Information

- 当前 `game-server` 的实际 global prefix 仍是样板值 `/api`；本故事开始落第一条正式玩家主链路接口时，需要把它收敛到 `/api/v1`，否则后续 contract 与 architecture 会持续偏离。  
  [Source: apps/game-server/src/main.ts]  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- 当前 `game-h5` 使用的是 `react-router-dom 6.30.3` 的 `BrowserRouter` 入口，而不是架构示例中已经抽出的 providers/router 文件。本故事实现必须跟随当前代码基线，不要假设 `providers.tsx`、`router.tsx` 已存在。  
  [Source: apps/game-h5/src/main.tsx]  
  [Source: package.json]
- 当前共享库与平台库的测试文件都是默认 stub 断言字符串返回值。本故事应把这些 stub 测试替换为真实的会话/适配器边界测试，而不是再额外创建一套无关 smoke test。  
  [Source: libs/platform/bridge/src/lib/bridge.spec.ts]  
  [Source: libs/platform/web-adapter/src/lib/web-adapter.spec.ts]  
  [Source: libs/platform/wechat-adapter/src/lib/wechat-adapter.spec.ts]

### Project Context Reference

- 平台壳只是交付外壳，可以提供登录桥、存储桥、分享桥和生命周期钩子，但不能承载游戏规则或特性专属 UI 逻辑。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]
- 任何 demo 级行为都不得直接继承进正式规则，包括仅用户名登录、浏览器端假数据捷径、内嵌本地凭据等；如果开发期必须有 mock，会话 mock 也必须隔离在宿主适配层或 account/session 边界后。  
  [Source: _bmad-output/project-context.md#语言与代码模式规则]
- 一期账号与角色初始化必须由服务端权威完成；因此本故事里的 H5 只能做会话建立与后续初始化请求准备，不能在浏览器侧自行生成账号、角色或初始化结果。  
  [Source: _bmad-output/project-context.md#关键红线规则]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2: 建立统一会话与宿主接入边界]
- [Source: _bmad-output/planning-artifacts/prd.md#账号与角色起步]
- [Source: _bmad-output/planning-artifacts/prd.md#跨端接入与宿主边界]
- [Source: _bmad-output/planning-artifacts/prd.md#Functional Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#开发流程规则]
- [Source: _bmad-output/project-context.md#关键红线规则]
- [Source: package.json]
- [Source: apps/game-h5/src/main.tsx]
- [Source: apps/game-h5/src/app/app.tsx]
- [Source: apps/game-server/src/main.ts]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Implementation Plan

- 先以 TDD 方式冻结统一会话的 shared types、contracts、schemas 边界，再让平台层、服务端和 H5 bootstrap 全部围绕同一语义实现。
- 平台侧采用 `platform-bridge -> web/wechat adapter` 单向依赖，确保共享 H5 只感知桥接接口，不直接读取宿主私有对象。
- 服务端把临时会话状态隔离在 `modules/account/session.store.ts`，用最小可替换内存实现承接首条正式 `/api/v1/session/auth` 主链路。
- H5 入口以 `restore-session.ts` 和 `init-app.ts` 完成最小启动编排，只做会话恢复，不提前扩张到角色初始化或主界面逻辑。

### Debug Log References

- Story 1.2 已按 `bmad-dev-story` + `test-driven-development` 顺序执行
- 已补装 `zod@^4`，并同步 workspace package / tsconfig project references
- 已完成统一会话主链路的共享层、平台层、服务端和 H5 bootstrap 回归测试

### Completion Notes List

- 已定义统一会话领域类型、`POST /api/v1/session/auth` 契约和 Zod schema，确保网页端与微信壳返回统一语义。
- 已实现 `platform-bridge`、`web-adapter`、`wechat-adapter`，支持统一 `normalizedHostIdentity` 输出与开发期 mock/fallback。
- 已在 `apps/game-server/src/modules/account` 落地最小会话模块，并把正式 API 前缀对齐到 `/api/v1`。
- 已在 H5 侧接通 `restore-session.ts`、`init-app.ts`、`data-access`、`state` 的最小会话恢复链路。
- 已运行本故事涉及的 10 个 Nx 项目测试与 lint；现有警告仅剩 React Router v7 future flag 提示，不影响本故事通过。

### File List

- package.json
- pnpm-lock.yaml
- apps/game-server/src/main.ts
- apps/game-server/src/app/app.module.ts
- apps/game-server/src/app/configure-app.ts
- apps/game-server/src/app/configure-app.spec.ts
- apps/game-server/src/modules/account/account.module.ts
- apps/game-server/src/modules/account/session.controller.ts
- apps/game-server/src/modules/account/session.controller.spec.ts
- apps/game-server/src/modules/account/session.service.ts
- apps/game-server/src/modules/account/session.store.ts
- apps/game-server/tsconfig.app.json
- apps/game-server/tsconfig.spec.json
- apps/game-h5/src/main.tsx
- apps/game-h5/src/bootstrap/init-app.ts
- apps/game-h5/src/bootstrap/init-app.spec.ts
- apps/game-h5/src/bootstrap/restore-session.ts
- apps/game-h5/src/bootstrap/restore-session.spec.ts
- apps/game-h5/tsconfig.app.json
- apps/game-h5/tsconfig.spec.json
- apps/game-h5/vite.config.mts
- libs/shared/types/src/lib/types.ts
- libs/shared/types/src/lib/types.spec.ts
- libs/shared/contracts/src/lib/contracts.ts
- libs/shared/contracts/src/lib/contracts.spec.ts
- libs/shared/schemas/src/lib/schemas.ts
- libs/shared/schemas/src/lib/schemas.spec.ts
- libs/shared/schemas/package.json
- libs/shared/schemas/tsconfig.spec.json
- libs/platform/bridge/src/lib/bridge.ts
- libs/platform/bridge/src/lib/bridge.spec.ts
- libs/platform/bridge/package.json
- libs/platform/bridge/tsconfig.spec.json
- libs/platform/web-adapter/src/lib/web-adapter.ts
- libs/platform/web-adapter/src/lib/web-adapter.spec.ts
- libs/platform/web-adapter/package.json
- libs/platform/web-adapter/tsconfig.spec.json
- libs/platform/wechat-adapter/src/lib/wechat-adapter.ts
- libs/platform/wechat-adapter/src/lib/wechat-adapter.spec.ts
- libs/platform/wechat-adapter/package.json
- libs/platform/wechat-adapter/tsconfig.spec.json
- libs/client/state/src/lib/state.ts
- libs/client/state/src/lib/state.spec.ts
- libs/client/state/package.json
- libs/client/state/tsconfig.lib.json
- libs/client/state/tsconfig.spec.json
- libs/client/data-access/src/lib/data-access.ts
- libs/client/data-access/src/lib/data-access.spec.ts
- libs/client/data-access/package.json
- libs/client/data-access/tsconfig.lib.json
- libs/client/data-access/tsconfig.spec.json
- _bmad-output/implementation-artifacts/1-2-establish-unified-session-and-host-boundary.md

## Change Log

- 2026-04-05: 完成 Story 1.2 实现，新增统一会话契约/schema、平台桥接与适配器、`/api/v1/session/auth`、H5 bootstrap 会话恢复链路，并补齐测试与 lint 验证。
