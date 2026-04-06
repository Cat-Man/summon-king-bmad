# Story 1.4: 搭建 H5 入口页与初始化加载反馈

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 玩家，
I want 进入游戏时能看到明确的加载、失败与重试反馈，
so that 我能顺利从入口进入主界面而不是卡在不透明状态。

## Acceptance Criteria

1. **Given** 玩家首次或再次进入 H5  
   **When** 客户端开始恢复会话并加载初始化/玩家快照  
   **Then** 入口页显示明确的加载状态  
   **And** 在可接受时间内进入下一步页面或返回失败结果

2. **Given** 会话建立失败、初始化失败或网络异常  
   **When** 系统无法完成入口链路  
   **Then** 页面展示明确失败原因或可映射提示  
   **And** 提供可执行的重试或恢复入口

3. **Given** 客户端展示初始化结果  
   **When** 进入主流程  
   **Then** 客户端使用服务端返回的状态作为真实来源  
   **And** 不使用本地时间或本地假数据决定初始化结果

## Tasks / Subtasks

- [x] 建立 H5 入口启动状态边界与启动编排
  - [x] 在 `libs/client/state` 增加最小启动状态边界，用于表达入口页的 `loading / ready / error` 状态，而不是创建泛化玩家大 store
  - [x] 在 `apps/game-h5/src/bootstrap/init-app.ts` 中显式编排“恢复会话 -> 初始化角色快照”的阶段状态，至少区分会话恢复中、初始化快照同步中、成功就绪、失败可恢复
  - [x] 失败路径必须统一回到可重试状态，并保留服务端或链路返回的错误语义映射，不得吞错或只在控制台静默失败

- [x] 交付入口页的加载、失败与就绪占位体验
  - [x] 替换 `apps/game-h5/src/app/app.tsx` 中当前 Nx 模板页面，渲染正式入口页骨架
  - [x] 加载态必须明确告诉玩家当前正在执行的动作，例如恢复账号会话、同步角色与开局数据
  - [x] 失败态必须显示可理解提示、可选的 `traceId` 或排障标识，并提供明确 `重试` 操作
  - [x] 成功态只提供“一期主流程已就绪”的最小占位或交接视图，不提前展开 Story 1.5 的完整主界面导航、推荐入口或延期入口治理

- [x] 守住共享 H5 与服务端权威边界
  - [x] 入口页展示的玩家信息与就绪态必须来自 Story 1.3 已交付的服务端初始化快照，不得在客户端本地拼装假角色、假资源或本地时间推断状态
  - [x] 宿主差异仍只能留在 `platform-bridge` / adapter 边界，本故事不得在页面组件里引入网页端或微信端分叉逻辑
  - [x] 不在本故事中引入完整 router/provider 重构、背包页、幻兽页、战斗页、聊天、交易、联盟、VIP、商城等一期外或后续故事内容

- [x] 完成最小可验证检查
  - [x] 为 `apps/game-h5/src/bootstrap/init-app.spec.ts` 增加阶段状态与失败映射测试，验证启动链路能产出明确加载与失败结果
  - [x] 为 `libs/client/state/src/lib/state.spec.ts` 增加入口启动状态测试，验证最小状态边界可被读取与订阅
  - [x] 为 `apps/game-h5/src/app/app.spec.tsx` 增加入口页渲染测试，验证加载文案、失败重试入口和权威快照驱动的就绪态

## Dev Notes

### Technical Requirements

- 本故事覆盖 PRD 中的 `FR5`、`FR6`、`FR10`、`FR41`、`FR42`、`FR43`，重点是把 Story 1.2 的统一会话与 Story 1.3 的初始化快照接成“玩家可感知”的正式入口体验。  
  [Source: _bmad-output/planning-artifacts/prd.md#账号与角色起步]  
  [Source: _bmad-output/planning-artifacts/prd.md#跨端接入与宿主边界]
- 首屏链路必须满足“一期进入游戏到主界面可交互的首屏加载在常见移动网络环境下控制在 5 秒内，弱网环境下给出明确加载状态与重试反馈”的要求。  
  [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- 本故事只交付入口链路可见性与失败恢复，不负责完整主界面引导、核心入口导航与延期入口治理；这些属于 Story 1.5。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5: 交付主界面首轮引导与延期入口治理]

### Architecture Compliance

- 共享 H5 只能通过 `platform-bridge` 访问宿主能力，页面层不直接识别网页端或微信端差异。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- 数据流必须保持为“宿主身份 -> 平台桥接 -> 会话换取 -> 初始化/主界面快照 -> 页面展示”，入口页只能消费会话恢复结果与初始化快照，不得自行推导权威状态。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]
- `账号与角色起步` 的前端落点仍在 `apps/game-h5/src/bootstrap` 与后续 `features/init`，当前故事应以最小增量补齐入口页，不另起第二套启动入口。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]

### Library / Framework Requirements

- 当前实际工作区基线仍以 `React 19`、`react-router-dom 6.30.3`、`Vitest` 为准，本故事继续沿用，不引入新状态框架。  
  [Source: package.json]
- 架构长期目标虽然包含 `TanStack Query` 与 `Zustand`，但当前依赖尚未正式接入；本故事只允许在 `libs/client/state` 扩展窄边界入口状态，不得顺手做全局状态升级。  
  [Source: package.json]  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]

### File Structure Requirements

- 优先修改或新增的文件应集中在：
  - `apps/game-h5/src/main.tsx`
  - `apps/game-h5/src/app/app.tsx`
  - `apps/game-h5/src/app/app.spec.tsx`
  - `apps/game-h5/src/app/app.module.css`
  - `apps/game-h5/src/styles.css`
  - `apps/game-h5/src/bootstrap/init-app.ts`
  - `apps/game-h5/src/bootstrap/init-app.spec.ts`
  - `libs/client/state/src/lib/state.ts`
  - `libs/client/state/src/lib/state.spec.ts`
- 当前 `main.tsx` 会在渲染前执行 `initializeAppSession()`，`app.tsx` 仍是 Nx 样板页；本故事的正确方向是让已有入口链路产出正式入口页状态，而不是绕开现有入口重新建第二个应用外壳。  
  [Source: apps/game-h5/src/main.tsx]  
  [Source: apps/game-h5/src/app/app.tsx]

### Testing Requirements

- 必须先用 TDD 冻结入口页行为，再补实现；不能先改 UI 再补测试。  
  [Source: _bmad-output/project-context.md#测试规则]
- 最少覆盖以下验证：
  - 启动状态能表达“恢复会话中 / 初始化中 / 失败 / 就绪”
  - 初始化失败与网络异常能映射到玩家可理解提示并保留重试入口
  - 就绪态渲染的数据来自服务端初始化快照，而不是客户端假数据
  - 重试操作重新触发同一条启动链路，而不是跳过会话恢复或本地伪造成功
- 建议至少运行：
  - `pnpm nx test @workspace/state`
  - `pnpm nx test @workspace/game-h5`
  - `pnpm nx run @workspace/game-h5:typecheck`

### Previous Story Intelligence

- Story 1.2 已完成统一会话恢复入口，`apps/game-h5/src/bootstrap/restore-session.ts` 已负责调用 `platform-bridge` 与 `data-access`，本故事不能在页面组件中重复拼接宿主输入或会话请求。  
  [Source: _bmad-output/implementation-artifacts/1-2-establish-unified-session-and-host-boundary.md#Completion Notes List]
- Story 1.3 已将客户端启动链路扩展为“恢复会话 -> 请求初始化快照”，并在失败时清理旧 `session/snapshot`；本故事应直接复用这条链路并把状态反馈显性化。  
  [Source: _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md#Completion Notes List]
- Story 1.3 已明确本故事负责“加载态文案、失败反馈视觉或正式页面交接”，因此 Story 1.4 不需要再改动初始化规则或 starter package。  
  [Source: _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md#Tasks / Subtasks]

### Latest Tech Information

- 当前 `apps/game-h5/src/main.tsx` 仍是渲染前直接 `void initializeAppSession()` 的简单入口，说明本故事应优先用最小状态同步方式完成入口体验，而不是引入复杂 provider。  
  [Source: apps/game-h5/src/main.tsx]
- 当前 `libs/client/state` 只缓存 `session + playerInitSnapshot`，尚无可订阅的启动状态边界；这是本故事最小且必要的补位点。  
  [Source: libs/client/state/src/lib/state.ts]
- 当前 `app.tsx` 仍是默认 `NxWelcome` 路由样板，属于应被本故事替换的非正式页面。  
  [Source: apps/game-h5/src/app/app.tsx]

### Project Context Reference

- 本故事输入来源明确为：根需求文档 `召唤之王详细需求文档.pdf`、系统规则目录 `召唤之王/`、移动端布局参考 `布局图/`，以及仅作行为/素材参考的旧原型 `htmlgame/`。  
  [Source: _bmad-output/project-context.md#开发流程规则]
- 旧 `htmlgame` 页面只可参考移动端竖屏入口视觉和术语，不可继续沿用旧单页结构、全局脚本逻辑或本地假数据流程。  
  [Source: _bmad-output/project-context.md#新构建基线]  
  [Source: _bmad-output/project-context.md#语言与代码模式规则]
- 共享 H5 是唯一核心客户端，网页端与微信小程序壳只是宿主外壳；任何平台差异都不得渗入入口页业务逻辑。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4: 搭建 H5 入口页与初始化加载反馈]
- [Source: _bmad-output/planning-artifacts/prd.md#账号与角色起步]
- [Source: _bmad-output/planning-artifacts/prd.md#跨端接入与宿主边界]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]
- [Source: _bmad-output/project-context.md#开发流程规则]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#关键红线规则]
- [Source: _bmad-output/implementation-artifacts/1-2-establish-unified-session-and-host-boundary.md]
- [Source: _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md]
- [Source: apps/game-h5/src/main.tsx]
- [Source: apps/game-h5/src/app/app.tsx]
- [Source: apps/game-h5/src/bootstrap/init-app.ts]
- [Source: apps/game-h5/src/bootstrap/restore-session.ts]
- [Source: apps/game-h5/src/bootstrap/initialize-player.ts]
- [Source: libs/client/state/src/lib/state.ts]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Story context engine analysis for Story 1.4 completed
- `pnpm nx test @workspace/state`
- `pnpm nx test @workspace/game-h5`
- `pnpm nx run-many -t typecheck -p @workspace/state,@workspace/game-h5`

### Completion Notes List

- 已在 `libs/client/state` 增加可订阅的最小启动状态边界，显式表达 `restoring-session / initializing-player / ready / error`
- 已在 `apps/game-h5/src/bootstrap/init-app.ts` 中补齐入口启动编排，按阶段推送状态，并把服务端错误与网络异常映射为可显示失败结果
- 已替换 `apps/game-h5/src/app/app.tsx` 的 Nx 模板，交付正式入口页，覆盖加载态、失败态和基于权威初始化快照的就绪交接态
- 已补入口页相关样式与移动端竖屏展示基线，未提前展开 Story 1.5 的主界面导航和延期系统治理
- 已通过 `@workspace/state`、`@workspace/game-h5` 测试与对应类型检查验证本故事改动
- 本次未运行单独的子代理 code review 流程；原因是当前工作区非 git 仓库，且本轮未额外申请并行评审

### File List

- _bmad-output/implementation-artifacts/1-4-build-h5-entry-and-init-loading-feedback.md
- apps/game-h5/src/app/app.module.css
- apps/game-h5/src/app/app.spec.tsx
- apps/game-h5/src/app/app.tsx
- apps/game-h5/src/bootstrap/init-app.spec.ts
- apps/game-h5/src/bootstrap/init-app.ts
- apps/game-h5/src/main.tsx
- apps/game-h5/src/styles.css
- libs/client/state/src/lib/state.spec.ts
- libs/client/state/src/lib/state.ts

### Change Log

- 2026-04-06: 初始创建 Story 1.4，上下文已补齐，可直接进入开发
- 2026-04-06: 完成 Story 1.4 实现与验证，入口页已具备加载、失败重试和权威快照交接能力
