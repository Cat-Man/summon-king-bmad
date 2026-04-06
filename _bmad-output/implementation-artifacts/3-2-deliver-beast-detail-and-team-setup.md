# Story 3.2: 交付幻兽详情页与出战队伍配置能力

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 玩家，
I want 查看单个幻兽详情并把它配置到当前出战队伍中，
so that 我可以围绕幻兽来准备后续战斗。

## Acceptance Criteria

1. **Given** 玩家打开幻兽入口  
   **When** 进入某个幻兽详情页  
   **Then** 页面展示该幻兽的一期基础信息、当前状态和队伍相关信息  
   **And** 信息来源于服务端权威数据

2. **Given** 玩家拥有可出战幻兽  
   **When** 调整默认队伍或当前出战队伍  
   **Then** 系统完成队伍配置更新  
   **And** 更新结果对后续战斗读取立即生效

3. **Given** 玩家尝试进行不合法的队伍配置  
   **When** 提交队伍调整请求  
   **Then** 系统返回明确失败结果  
   **And** 不写入不一致或半完成的队伍状态

## Tasks / Subtasks

- [x] 建立共享幻兽详情与队伍配置契约
  - [x] 在 `libs/shared/contracts` 增加正式幻兽详情读取 contract 与默认队伍配置 contract，继续沿用现有 `beast` 领域边界
  - [x] 在 `libs/shared/types` 增加一期最小幻兽详情类型、默认队伍配置请求/响应与稳定错误码
  - [x] 一期只支持“默认队伍 = 当前出战队伍”的单一权威语义，不同时引入第二套“当前队伍”独立模型

- [x] 建立服务端权威幻兽详情读取与默认队伍配置用例
  - [x] 在 `libs/server/application` 增加幻兽详情查询与默认队伍配置用例，优先复用现有初始化快照中的 `snapshot.beasts` 与 `snapshot.defaultTeam`
  - [x] 队伍配置成功后必须原子更新权威玩家态，后续幻兽详情读取与战斗前读取应立即可见
  - [x] 非法配置必须稳定失败，例如会话无效、目标幻兽不存在、目标幻兽不属于当前玩家、超出一期允许队伍容量、重复配置同一实例

- [x] 暴露正式 beast 详情与默认队伍配置接口
  - [x] 在 `apps/game-server/src/modules/beast` 扩展 controller/service/module，保持 `beast` 作为独立业务域
  - [x] 详情接口只返回一期基础展示字段与队伍关系字段，不提前暴露养成分支数据
  - [x] 配置接口只处理一期默认队伍写入，不在本故事中提前加入养成写入、深层编队或战斗结算逻辑

- [x] 交付共享 H5 幻兽详情页与最小队伍配置交互
  - [x] 在 `apps/game-h5/src/features/beast` 增加正式幻兽详情页，并从现有 `/beasts` 列表页进入
  - [x] 详情页进入时通过 shared data-access 请求正式 beast detail，而不是依赖列表页本地拼装
  - [x] 页面应清晰展示：幻兽名、等级、定位、是否在默认队伍中、当前默认队伍摘要，以及“设为出战/已在队伍中”等明确动作反馈

- [x] 完成最小可验证检查
  - [x] 为 shared contracts/types/schemas 增加 beast detail 与 team setup 契约测试
  - [x] 为 application 增加详情成功读取、默认队伍配置成功、非法配置失败与重复读取一致性测试
  - [x] 为 game-server 增加 beast detail 与 team setup 接口测试
  - [x] 为 game-h5 增加幻兽详情页与队伍配置测试，验证正式拉取、成功切换与失败提示

## Dev Notes

### Technical Requirements

- 本故事主要覆盖 PRD 中的 `FR19`、`FR20`、`FR24`、`NFR2`、`NFR10`、`NFR16`，目标是在已完成的幻兽列表正式链路之上，补齐“单体详情 + 最小队伍配置”的一期核心闭环。  
  [Source: _bmad-output/planning-artifacts/prd.md#幻兽养成与队伍]  
  [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- 一期这里不扩展“多队伍、多编组、多阵位规则”；应把“默认队伍”视为当前权威出战队伍，避免 3.2 提前引入双模型分叉。  
  [Source: _bmad-output/planning-artifacts/prd.md#幻兽养成与队伍]  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2: 交付幻兽详情页与出战队伍配置能力]
- 本故事只建立详情读取与最小默认队伍配置，不负责幻兽成长结算、资源扣减或深层养成分支开放。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2: 交付幻兽详情页与出战队伍配置能力]  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3: 实现基础幻兽养成动作与权威结算]

### Architecture Compliance

- `幻兽养成与队伍` 的正式落点仍是 `apps/game-h5/src/features/beast` 与 `apps/game-server/src/modules/beast`，不要把 3.2 逻辑散落到 `App`、`player` 或 `battle` 模块。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- `game-h5` 只能通过 `/api/v1` 访问后端，页面路由负责编排，领域规则和最终写入判定必须留在服务端。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- 当前正式 beast 域已经采用 `/api/v1/beast` 单数边界；3.2 应在现有正式边界上扩展，不要切换到另一套 plural 路径把 3.1 已落地接口打碎。  
  [Source: apps/game-server/src/modules/beast/beast.controller.ts]  
  [Source: libs/shared/contracts/src/lib/contracts.ts]
- 一期服务端权威模型继续生效；客户端不能以列表页缓存或本地状态直接决定“是否在队伍中”或“切换是否成功”。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]  
  [Source: _bmad-output/implementation-artifacts/3-1-build-beast-instance-model-and-list-query.md]

### Library / Framework Requirements

- 当前实际基线继续沿用 `NestJS 11`、`React 19`、`react-router-dom 6.30.3`、`Vitest`、`Jest`、`zod`，不新增新的服务端框架、状态库或请求库。  
  [Source: package.json]
- 共享请求/响应定义仍通过 `@workspace/contracts`、`@workspace/types`、`@workspace/schemas` 串联，幻兽详情与队伍配置不得绕开 shared contract。  
  [Source: libs/shared/contracts/src/lib/contracts.ts]  
  [Source: libs/shared/types/src/lib/types.ts]  
  [Source: libs/shared/schemas/src/lib/schemas.ts]
- 当前没有独立 UX 规划文档，3.2 的交互边界需以现有主界面、幻兽列表页和布局参考为准，不要发散成完整首发版复杂交互。  
  [Source: apps/game-h5/src/app/app.tsx]  
  [Source: apps/game-h5/src/features/beast/beast-list-page.tsx]

### File Structure Requirements

- 优先修改或新增的文件应集中在：
  - `libs/shared/contracts/src/lib/contracts.ts`
  - `libs/shared/contracts/src/lib/contracts.spec.ts`
  - `libs/shared/types/src/lib/types.ts`
  - `libs/shared/types/src/lib/types.spec.ts`
  - `libs/shared/schemas/src/lib/schemas.ts`
  - `libs/shared/schemas/src/lib/schemas.spec.ts`
  - `libs/server/application/src/lib/application.ts`
  - `libs/server/application/src/lib/application.spec.ts`
  - `apps/game-server/src/modules/beast/**`
  - `libs/client/data-access/src/lib/data-access.ts`
  - `libs/client/data-access/src/lib/data-access.spec.ts`
  - `apps/game-h5/src/features/beast/**`
  - `apps/game-h5/src/app/app.tsx`
  - `apps/game-h5/src/app/app.spec.tsx`
- 推荐新增的 H5 路由形态为 `/beasts/:beastInstanceId`，列表页负责导航到详情页，详情页负责正式读取和最小队伍配置交互。  
  [Source: apps/game-h5/src/app/app.tsx]  
  [Source: apps/game-h5/src/features/beast/beast-list-page.tsx]
- 推荐继续复用现有 `beast` 模块，不要为 3.2 临时拆出 `team` 子模块或把队伍写逻辑挪到 `player` 模块。  
  [Source: apps/game-server/src/modules/beast/beast.service.ts]  
  [Source: apps/game-server/src/modules/player/player.service.ts]

### Testing Requirements

- 必须遵守 TDD，先让 beast detail / team setup 测试失败，再补实现。  
  [Source: _bmad-output/project-context.md#测试规则]
- 最少覆盖以下验证：
  - beast detail contract 与 schema 能稳定表达成功和失败
  - 默认队伍配置成功后，详情读取与列表读取都能立即反映新的权威状态
  - 非法配置不会产生部分写入或不一致状态
  - H5 从列表进入详情页后，必须通过正式接口读取详情并展示明确反馈
  - 失败提示来自服务端响应，而不是前端本地猜测
- 建议至少运行：
  - `pnpm nx test @workspace/contracts`
  - `pnpm nx test @workspace/types`
  - `pnpm nx test @workspace/schemas`
  - `pnpm nx test @workspace/application`
  - `pnpm nx test @workspace/data-access`
  - `pnpm nx test @workspace/game-server`
  - `pnpm nx test @workspace/game-h5`
  - `pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`

### Previous Story Intelligence

- Story 3.1 已完成正式 `GET /api/v1/beast` 幻兽列表链路，H5 `/beasts` 入口也已替换为正式列表页；3.2 必须在这个基础上扩展详情和最小配置，不要回退成占位页。  
  [Source: _bmad-output/implementation-artifacts/3-1-build-beast-instance-model-and-list-query.md]
- Story 3.1 当前把权威幻兽数据映射自初始化快照中的 `snapshot.beasts` 与 `snapshot.defaultTeam`；3.2 优先沿用这条数据源，而不是提前引入独立幻兽成长仓储。  
  [Source: libs/server/application/src/lib/application.ts]  
  [Source: apps/game-server/src/modules/beast/beast.service.ts]
- 当前初始化流程只稳定发放 1 只初始幻兽；3.2 不应为了“配置有变化”去扩大正式初始化奖励。需要多幻兽场景时，优先在测试夹具或受控仓储状态中构造。  
  [Source: libs/server/domain/src/lib/domain.ts]  
  [Source: _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md]
- Story 2.x 已建立 shared contract、data-access、server application/module 的稳定分层模式；3.2 继续沿用，不把详情或配置逻辑直接堆进 React 路由组件。  
  [Source: _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md]  
  [Source: _bmad-output/implementation-artifacts/2-4-support-consumables-and-resource-deduction-flow.md]

### Latest Tech Information

- 当前正式 beast 域已经存在：
  - 列表查询用例 `createBeastListQueryService`
  - Nest `beast` 模块
  - H5 `BeastListPage`
  3.2 应直接在这些正式代码上扩展 detail 和 setup，不要重起一套平行实现。  
  [Source: libs/server/application/src/lib/application.ts]  
  [Source: apps/game-server/src/modules/beast/beast.controller.ts]  
  [Source: apps/game-h5/src/features/beast/beast-list-page.tsx]
- 当前 `PlayerInitializationRepository` 已支持按账号读取和保存完整初始化态，因此 3.2 的最小默认队伍写入可以先基于整态更新完成，不必提前引入独立持久化层。  
  [Source: libs/server/db/src/lib/db.ts]
- 当前 H5 幻兽列表页已经能展示 `inDefaultTeam` 与 `availableForBattle`；3.2 的详情页和配置成功反馈应与这些字段保持一致，避免同一玩家态在列表与详情中表现冲突。  
  [Source: apps/game-h5/src/features/beast/beast-list-page.tsx]

### Project Context Reference

- 共享 H5 是唯一核心客户端，网页端与微信壳只是宿主；幻兽详情与队伍配置链路不得出现平台分叉。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]
- 中文业务术语、幻兽名称和默认队伍语义必须保留，不要在新实现中改写成泛化英文 RPG 词汇。  
  [Source: _bmad-output/project-context.md#语言与代码模式规则]
- 旧 `htmlgame` 只可参考布局、素材和术语，不可把旧单页里的幻兽详情脚本或前端本地编队逻辑直接搬进正式工程。  
  [Source: _bmad-output/project-context.md#新构建基线]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2: 交付幻兽详情页与出战队伍配置能力]
- [Source: _bmad-output/planning-artifacts/prd.md#幻兽养成与队伍]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- [Source: _bmad-output/project-context.md#测试规则]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#语言与代码模式规则]
- [Source: _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md]
- [Source: _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md]
- [Source: _bmad-output/implementation-artifacts/2-4-support-consumables-and-resource-deduction-flow.md]
- [Source: _bmad-output/implementation-artifacts/3-1-build-beast-instance-model-and-list-query.md]
- [Source: apps/game-h5/src/features/beast/beast-list-page.tsx]
- [Source: apps/game-server/src/modules/beast/beast.controller.ts]
- [Source: libs/server/application/src/lib/application.ts]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- `pnpm nx test @workspace/data-access`
- `pnpm nx test @workspace/game-h5`
- `pnpm nx run-many -t test -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`
- `pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`

### Completion Notes List

- 已补齐 `data-access` 的 `fetchBeastDetail` 与 `setupDefaultTeam`，共享 H5 不再依赖本地拼装详情或本地编队写入。
- 已新增 `/beasts/:beastInstanceId` 详情路由与 `BeastDetailPage`，支持权威详情读取、默认队伍切换与明确成功/失败反馈。
- 已在 `BeastListPage` 增加正式详情入口，并修复默认数组引用导致的重复渲染风险。
- 已完成 shared/application/game-server/game-h5 的回归测试与静态类型检查，Story 3.2 当前可进入代码评审。

### File List

- _bmad-output/implementation-artifacts/3-2-deliver-beast-detail-and-team-setup.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/game-h5/src/app/app.spec.tsx
- apps/game-h5/src/app/app.tsx
- apps/game-h5/src/features/beast/beast-detail-page.spec.tsx
- apps/game-h5/src/features/beast/beast-detail-page.tsx
- apps/game-h5/src/features/beast/beast-list-page.spec.tsx
- apps/game-h5/src/features/beast/beast-list-page.tsx
- apps/game-h5/src/features/inventory/inventory-page.spec.tsx
- apps/game-server/src/modules/beast/beast.controller.spec.ts
- apps/game-server/src/modules/beast/beast.controller.ts
- apps/game-server/src/modules/beast/beast.service.ts
- libs/client/data-access/src/lib/data-access.spec.ts
- libs/client/data-access/src/lib/data-access.ts
- libs/server/application/src/lib/application.spec.ts
- libs/server/application/src/lib/application.ts
- libs/shared/contracts/src/lib/contracts.spec.ts
- libs/shared/contracts/src/lib/contracts.ts
- libs/shared/schemas/src/lib/schemas.spec.ts
- libs/shared/schemas/src/lib/schemas.ts
- libs/shared/types/src/lib/types.spec.ts
- libs/shared/types/src/lib/types.ts

### Change Log

- 2026-04-06: 初始创建 Story 3.2，上下文已补齐，可直接进入开发
- 2026-04-06: 完成幻兽详情读取、默认队伍配置、共享 H5 详情页与全量验证，状态更新为 review
