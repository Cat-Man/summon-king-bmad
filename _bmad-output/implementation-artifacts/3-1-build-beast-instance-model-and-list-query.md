# Story 3.1: 建立幻兽实例模型与幻兽列表读取链路

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 玩家，
I want 查看自己已拥有的幻兽列表和基础状态，
so that 我能知道当前有哪些幻兽可培养和可上阵。

## Acceptance Criteria

1. **Given** 玩家已拥有初始化发放的幻兽  
   **When** 客户端请求幻兽列表与基础信息  
   **Then** 服务端返回当前玩家拥有的幻兽实例数据  
   **And** 返回结果包含一期所需的基础属性、状态与可用标识

2. **Given** 玩家重复进入游戏或刷新页面  
   **When** 再次读取幻兽信息  
   **Then** 返回当前权威幻兽状态  
   **And** 不依赖客户端本地缓存决定最终结果

3. **Given** 一期只开放基础幻兽能力  
   **When** 系统组织幻兽读取结果  
   **Then** 只返回一期开放所需字段  
   **And** 不暴露未开放深层养成分支的可操作状态

## Tasks / Subtasks

- [x] 建立共享幻兽列表契约与一期最小模型
  - [x] 在 `libs/shared/contracts` 增加正式幻兽列表 contract，使用 `beast` 领域边界而不是继续沿用主界面占位路由
  - [x] 在 `libs/shared/types` 增加一期最小幻兽实例类型、幻兽列表请求/响应与稳定错误码
  - [x] 响应字段只保留一期所需字段，例如实例 id、幻兽 id、名称、等级、角色定位、是否在默认队伍中，不暴露深层养成分支字段

- [x] 建立服务端权威幻兽列表读取能力
  - [x] 在 `libs/server/application` 增加幻兽列表查询用例，基于当前玩家权威状态返回当前幻兽实例列表
  - [x] 优先复用现有初始化后玩家态中的幻兽来源，不为 Story 3.1 提前引入完整幻兽成长仓储
  - [x] 无效会话或缺失玩家态时返回稳定失败，不允许客户端本地兜底为“有幻兽”或“无幻兽”

- [x] 暴露正式 beast 列表接口
  - [x] 在 `apps/game-server/src/modules/beast` 新增 controller/service/module，保持 `beast` 作为独立业务域
  - [x] 接口成功时返回权威幻兽列表；失败时返回稳定错误码与 traceId
  - [x] 不在本故事中提前加入详情、编队、养成写接口

- [x] 交付共享 H5 幻兽列表页
  - [x] 在 `apps/game-h5/src/features/beast` 增加正式幻兽列表页，替换当前 `/beasts` 占位入口
  - [x] 页面进入时通过 shared data-access 请求正式 beast list，而不是直接消费主界面占位文案
  - [x] 页面应展示一期最小信息：幻兽名、等级、定位、是否在默认队伍中，以及“后续可用于培养/上阵”的明确提示

- [x] 完成最小可验证检查
  - [x] 为 shared contracts/types/schemas 增加 beast list 契约测试
  - [x] 为 application 增加成功读取、重复读取一致性、无效会话失败测试
  - [x] 为 game-server 增加 beast 列表接口测试
  - [x] 为 game-h5 增加幻兽列表页测试，验证正式拉取、展示权威数据与失败提示

## Dev Notes

### Technical Requirements

- 本故事主要覆盖 PRD 中的 `FR19`、`FR24`、`NFR2`、`NFR10`、`NFR16`，目标是把“玩家拥有的幻兽实例数据”从初始化快照扩展为正式可读取能力。  
  [Source: _bmad-output/planning-artifacts/prd.md#幻兽养成与队伍]  
  [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- PRD 已明确一期的核心闭环包含“获得初始幻兽 -> 查看幻兽 -> 后续培养/上阵 -> 战斗推进”，因此 `/beasts` 不能继续只停留在占位壳。  
  [Source: _bmad-output/planning-artifacts/prd.md#目标与背景上下文]  
  [Source: _bmad-output/planning-artifacts/prd.md#游戏项目特有要求]
- 本故事只建立“列表读取与基础状态识别”，不负责幻兽详情、编队调整、养成写入或深层分支开放。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1: 建立幻兽实例模型与幻兽列表读取链路]  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2: 交付幻兽详情页与出战队伍配置能力]

### Architecture Compliance

- `幻兽养成与队伍` 的正式落点是 `apps/game-h5/src/features/beast` 与 `apps/game-server/src/modules/beast`，本故事应按该结构起步。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- 服务端权威模型必须继续生效，客户端只能通过 `/api/v1/beast` 读取，不得把初始化快照当成长期最终真相。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- 一期只开放基础幻兽能力，因此返回结构必须严格收敛，不暴露未开放深层成长字段。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1: 建立幻兽实例模型与幻兽列表读取链路]

### Library / Framework Requirements

- 当前实际基线继续沿用 `NestJS 11`、`React 19`、`react-router-dom 6.30.3`、`Vitest`、`Jest`、`zod`，不新增新的服务端框架、状态库或请求库。  
  [Source: package.json]
- 共享请求/响应定义仍通过 `@workspace/contracts`、`@workspace/types`、`@workspace/schemas` 串联，幻兽列表读取不得绕开 shared contract。  
  [Source: libs/shared/contracts/src/lib/contracts.ts]  
  [Source: libs/shared/types/src/lib/types.ts]  
  [Source: libs/shared/schemas/src/lib/schemas.ts]

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
- 当前代码库还不存在正式 `beast` 模块与 `features/beast` 目录；本故事允许建立最小只读骨架，但不要提前塞入 Story 3.2/3.3 的写逻辑。  
  [Source: apps/game-h5/src/app/app.tsx]

### Testing Requirements

- 必须遵守 TDD，先让 beast list 测试失败，再补实现。  
  [Source: _bmad-output/project-context.md#测试规则]
- 最少覆盖以下验证：
  - beast list contract 与 schema 能稳定表达成功和失败
  - 服务端重复读取返回相同权威幻兽实例数据
  - 返回字段只包含一期基础字段
  - H5 `/beasts` 页面通过正式接口读取并展示列表
  - 失败提示来自服务端响应，而不是占位页本地猜测
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

- Story 1.3 已在初始化权威快照中发放初始幻兽与默认队伍，本故事应以该现有玩家态为权威来源，而不是重新发明初始化逻辑。  
  [Source: _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md]
- Story 1.5 已把 `/beasts` 路由接入主界面，但当前仍是占位页；Story 3.1 的目标正是把这一入口升级为正式读取页。  
  [Source: _bmad-output/implementation-artifacts/1-5-deliver-home-guidance-and-deferred-entry-governance.md]
- Story 2.x 已建立 shared contract、data-access、server application/module 的稳定分层模式；Story 3.1 应沿用这一模式扩展 beast 域，而不是把逻辑直接堆进 `App`。  
  [Source: _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md]  
  [Source: _bmad-output/implementation-artifacts/2-4-support-consumables-and-resource-deduction-flow.md]

### Latest Tech Information

- 当前正式权威幻兽数据只存在于初始化快照与 `PlayerInitializationRepository` 中，还没有独立 `beast` 读接口；这正是 Story 3.1 需要补齐的缺口。  
  [Source: libs/server/application/src/lib/application.ts]  
  [Source: apps/game-server/src/modules/player/player.service.ts]
- 当前 `App` 对 `/beasts` 路由仍使用 `CoreEntryRoute` 占位；只要建立最小列表页，就可以无缝替换而不破坏主界面导航。  
  [Source: apps/game-h5/src/app/app.tsx]
- 当前代码库里还没有 `apps/game-server/src/modules/beast` 和 `apps/game-h5/src/features/beast` 目录，需要在本故事中新建正式只读骨架。  
  [Source: apps]  
  [Source: libs]

### Project Context Reference

- 共享 H5 是唯一核心客户端，网页端与微信壳只是宿主；幻兽读取链路不得出现平台分叉。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]
- 中文业务术语、幻兽名称和初始化发放语义必须保留，不要在新实现中改写成泛化英文 RPG 词汇。  
  [Source: _bmad-output/project-context.md#语言与代码模式规则]
- 旧 `htmlgame` 只可参考布局、素材和术语，不可把旧单页里的幻兽表现脚本直接搬进正式工程。  
  [Source: _bmad-output/project-context.md#新构建基线]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1: 建立幻兽实例模型与幻兽列表读取链路]
- [Source: _bmad-output/planning-artifacts/prd.md#幻兽养成与队伍]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- [Source: _bmad-output/project-context.md#测试规则]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#语言与代码模式规则]
- [Source: _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md]
- [Source: _bmad-output/implementation-artifacts/1-5-deliver-home-guidance-and-deferred-entry-governance.md]
- [Source: _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md]
- [Source: _bmad-output/implementation-artifacts/2-4-support-consumables-and-resource-deduction-flow.md]
- [Source: apps/game-h5/src/app/app.tsx]
- [Source: libs/server/application/src/lib/application.ts]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Story context engine analysis for Story 3.1 completed
- `pnpm nx test @workspace/contracts`
- `pnpm nx test @workspace/types`
- `pnpm nx test @workspace/schemas`
- `pnpm nx test @workspace/application`
- `pnpm nx test @workspace/game-server`
- `pnpm nx test @workspace/data-access`
- `pnpm nx test @workspace/game-h5`
- `pnpm nx run-many -t test -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`
- `pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`

### Completion Notes List

- 新增正式 `GET /api/v1/beast` 契约、类型与 schema，冻结一期最小幻兽列表字段。
- 新增 `createBeastListQueryService`，复用初始化快照中的 `snapshot.beasts` 与 `defaultTeam` 生成权威列表响应。
- 新增 game-server `beast` 模块与控制器，错误码边界稳定；未传 `x-request-id` 时使用基于 `sessionToken` 的确定性 `traceId`，保证重复读取 payload 稳定。
- 新增共享 H5 `BeastListPage`，主界面 `/beasts` 路由已切到正式页，并在有初始化快照时先显示首屏数据再刷新正式接口。
- 全量测试与 typecheck 已通过；仍存在既有非阻断警告：React Router future flag warning、Nx `MaxListenersExceededWarning`。

### File List

- _bmad-output/implementation-artifacts/3-1-build-beast-instance-model-and-list-query.md
- libs/shared/contracts/src/lib/contracts.ts
- libs/shared/types/src/lib/types.ts
- libs/shared/schemas/src/lib/schemas.ts
- libs/server/application/src/lib/application.ts
- apps/game-server/src/modules/beast/beast.controller.ts
- apps/game-server/src/modules/beast/beast.module.ts
- apps/game-server/src/modules/beast/beast.service.ts
- apps/game-server/src/modules/player/player.module.ts
- apps/game-server/src/app/app.module.ts
- libs/client/data-access/src/lib/data-access.ts
- apps/game-h5/src/features/beast/beast-list-page.tsx
- apps/game-h5/src/app/app.tsx

### Change Log

- 2026-04-06: 初始创建 Story 3.1，上下文已补齐，可直接进入开发
- 2026-04-06: 完成一期幻兽列表正式读取链路，补齐 shared/application/server/H5 并完成验证
