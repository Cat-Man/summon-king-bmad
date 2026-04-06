# Story 2.1: 建立背包与基础资源的权威存储模型

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 玩家，
I want 我的基础资源、消耗品和背包内容被系统正确保存并可读取，
so that 我进入游戏后能看到真实且持续的库存状态。

## Acceptance Criteria

1. **Given** 玩家已完成角色初始化  
   **When** 服务端创建并读取玩家库存状态  
   **Then** 系统分别维护基础资源数据与背包存储数据  
   **And** 不把不同类型的存储空间混为单一容器

2. **Given** 玩家重新登录或刷新进入  
   **When** 客户端请求背包与资源快照  
   **Then** 服务端返回当前权威库存状态  
   **And** 客户端不以本地缓存作为最终真实来源

3. **Given** 一期存在不同类型的资源与物品  
   **When** 系统组织库存数据  
   **Then** 返回结果能够区分基础资源、背包物品与对应容量信息  
   **And** 数据结构与共享 contracts 保持一致

## Tasks / Subtasks

- [x] 建立共享 inventory 契约与类型边界
  - [x] 在 `libs/shared/contracts` 增加权威库存快照 contract，并提供统一 URL/route helper
  - [x] 在 `libs/shared/types` 增加库存请求、成功/失败响应、基础资源、背包物品与容量信息的共享类型
  - [x] 在 `libs/shared/schemas` 增加库存请求/响应解析，保证客户端与服务端共用相同 schema

- [x] 建立服务端权威库存模型与初始化落账
  - [x] 在 `libs/server/domain` 定义一期最小库存模型，明确拆分基础资源与背包存储，并保留独立容量信息
  - [x] 在 `libs/server/db` 提供独立的库存仓储接口与内存实现，内部分别维护资源态与背包态，而不是单一混合对象
  - [x] 在角色初始化链路中创建或读取库存状态，保证重复初始化不会重复发放库存收益

- [x] 打通正式库存读取接口
  - [x] 在 `apps/game-server/src/modules/inventory` 建立最小模块、controller 与 service，提供权威库存读取接口
  - [x] 接口必须基于现有统一 session 边界校验玩家身份，不允许客户端直接提交本地库存真相
  - [x] 错误返回至少覆盖无效 session 等可解释失败场景，并保持稳定错误码

- [x] 接入最小客户端读取层与状态落点
  - [x] 在 `libs/client/data-access` 增加库存快照请求函数，明确调用共享 contract 与 schema
  - [x] 在 `libs/client/state` 增加最小 inventory snapshot 边界，不引入新的泛化大 store
  - [x] 在 `apps/game-h5/src/bootstrap` 把“会话恢复/角色初始化后读取权威库存快照”纳入正式链路，确保刷新后不以旧本地背包为最终来源

- [x] 完成最小可验证检查
  - [x] 为 shared contracts/types/schemas 增加库存 contract 与 schema 测试
  - [x] 为 server domain/db/application 与 game-server controller 增加库存模型、初始化落账和接口测试
  - [x] 为 client data-access / bootstrap / state 增加库存读取与持久化测试，并运行相关 test 与 typecheck

## Dev Notes

### Technical Requirements

- 本故事对应 PRD 中的 `FR13`、`FR14`、`FR15`、`FR18`、`NFR6`、`NFR7`、`NFR10`、`NFR20`，目标是把“一期背包与资源管理”从初始化附带数据提升为独立权威域。  
  [Source: _bmad-output/planning-artifacts/prd.md#背包与资源管理]  
  [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- 一期优先保证“基础资源 + 背包 + 容量”三类信息结构清晰，不提前扩展到仓库、装备栏、交易寄售、联盟仓库等后续系统。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1: 建立背包与基础资源的权威存储模型]
- 若需要一个最小示例物品，优先参考旧 `htmlgame` 的样例物品与背包演示数据；若当前故事只验证权威模型，允许使用“空背包 + 独立容量信息”的最小实现，禁止臆造复杂掉落和消耗规则。  
  [Source: htmlgame/db/schema.sql]  
  [Source: htmlgame/server/src/server.js]

### Architecture Compliance

- 服务端必须权威控制初始化、奖励、容量校验与库存读取；客户端不能把本地缓存当成最终库存真相。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- 后端模块映射已明确要求存在 `inventory` 与 `resource` 业务域；本故事可以先以最小切片落地 `inventory` 读取与资源/背包独立建模，不要求一次完成全部模块深拆。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- 玩家主链路接口已预留 `inventory`，前端状态应以 query/read boundary 为主，不允许绕回长期本地真相缓存。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]

### Library / Framework Requirements

- 当前实际基线仍为 `NestJS 11`、`React 19`、`Vitest`、`Jest`、`zod`；本故事继续沿用，不新增状态或服务端框架。  
  [Source: package.json]
- 共享 contract 与 schema 仍通过 `@workspace/contracts`、`@workspace/types`、`@workspace/schemas` 串联，不能出现客户端/服务端各自定义一份库存结构。  
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
  - `libs/server/domain/src/lib/domain.ts`
  - `libs/server/domain/src/lib/domain.spec.ts`
  - `libs/server/db/src/lib/db.ts`
  - `libs/server/db/src/lib/db.spec.ts`
  - `libs/server/application/src/lib/application.ts`
  - `libs/server/application/src/lib/application.spec.ts`
  - `apps/game-server/src/modules/inventory/**`
  - `apps/game-server/src/app/app.module.ts`
  - `apps/game-server/src/modules/player/player.service.ts`
  - `apps/game-server/src/modules/player/player.module.ts`
  - `libs/client/data-access/src/lib/data-access.ts`
  - `libs/client/data-access/src/lib/data-access.spec.ts`
  - `libs/client/state/src/lib/state.ts`
  - `libs/client/state/src/lib/state.spec.ts`
  - `apps/game-h5/src/bootstrap/**`
- 当前 `apps/game-server/src/modules/inventory/` 仍为空占位目录，本故事应把它变成正式最小模块，而不是继续把库存逻辑塞回 `player` 模块。  
  [Source: apps/game-server/src/modules/inventory]

### Testing Requirements

- 必须遵守 TDD，先写失败测试，再写最小实现。  
  [Source: _bmad-output/project-context.md#测试规则]
- 最少覆盖以下验证：
  - shared contract 能稳定表达库存读取路径与结构
  - 初始化后库存已落账，重复初始化不会重复生成或污染库存
  - 库存仓储内部独立维护资源与背包态
  - 客户端请求库存快照时调用服务端权威接口，而不是直接读本地初始化快照
  - 刷新链路中 inventory snapshot 会被清理、重载并重新持久化
- 建议至少运行：
  - `pnpm nx test @workspace/contracts`
  - `pnpm nx test @workspace/types`
  - `pnpm nx test @workspace/schemas`
  - `pnpm nx test @workspace/domain`
  - `pnpm nx test @workspace/db`
  - `pnpm nx test @workspace/application`
  - `pnpm nx test @workspace/data-access`
  - `pnpm nx test @workspace/state`
  - `pnpm nx test @workspace/game-server`
  - `pnpm nx test @workspace/game-h5`
  - `pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/data-access,@workspace/state,@workspace/game-server,@workspace/game-h5`

### Previous Story Intelligence

- Story 1.3 已把初始化链路固定为“恢复 session -> 初始化玩家快照”，且 starter 资源已在初始化返回中出现；本故事不重写初始化契约，而是在其后补上正式 inventory 权威域。  
  [Source: _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md]
- Story 1.4 已把入口状态编排固定在 `apps/game-h5/src/bootstrap/init-app.ts`，本故事应在同一编排中补上库存快照读取，而不是新开第二条启动链路。  
  [Source: _bmad-output/implementation-artifacts/1-4-build-h5-entry-and-init-loading-feedback.md]
- Story 1.5 已交付主界面与延期入口治理，但背包页仍是导航壳；本故事不直接做完整 UI，只补权威数据基础，供 Story 2.2 扩展展示。  
  [Source: _bmad-output/implementation-artifacts/1-5-deliver-home-guidance-and-deferred-entry-governance.md]

### Latest Tech Information

- 当前 `PlayerService` 仅处理 `player/init`，`libs/server/db` 只有初始化仓储接口，库存域尚未真正存在。  
  [Source: apps/game-server/src/modules/player/player.service.ts]  
  [Source: libs/server/db/src/lib/db.ts]
- 当前 `data-access` 只封装 `session/auth` 与 `player/init`，客户端状态也只缓存 `session + playerInitSnapshot`，说明本故事需要增加最小 inventory 边界，但不能顺手演变成大一统 store。  
  [Source: libs/client/data-access/src/lib/data-access.ts]  
  [Source: libs/client/state/src/lib/state.ts]

### Project Context Reference

- 共享 H5 是唯一核心客户端，网页端和微信壳只是宿主；库存与资源规则不得出现平台分叉。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]
- 服务端必须继续保持权威，容量不足、奖励阻断和资产状态都必须可解释，不能回到旧 `htmlgame` 的演示式本地/松散处理。  
  [Source: _bmad-output/project-context.md#关键红线规则]
- 旧 `htmlgame` 可作为物品命名、素材或旧接口形态参考，但不能继续沿用其单页逻辑和演示级数据真相。  
  [Source: _bmad-output/project-context.md#新构建基线]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1: 建立背包与基础资源的权威存储模型]
- [Source: _bmad-output/planning-artifacts/prd.md#背包与资源管理]
- [Source: _bmad-output/planning-artifacts/prd.md#存储与资源系统要求]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]
- [Source: _bmad-output/project-context.md#测试规则]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#关键红线规则]
- [Source: htmlgame/db/schema.sql]
- [Source: htmlgame/server/src/server.js]
- [Source: apps/game-server/src/modules/player/player.service.ts]
- [Source: libs/client/data-access/src/lib/data-access.ts]
- [Source: libs/client/state/src/lib/state.ts]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Story context engine analysis for Story 2.1 completed
- `pnpm nx run-many -t test -p @workspace/contracts,@workspace/types,@workspace/schemas`
- `pnpm nx run-many -t test -p @workspace/domain,@workspace/db,@workspace/application`
- `pnpm nx test @workspace/game-h5`
- `pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/data-access,@workspace/state,@workspace/game-server,@workspace/game-h5`
- `pnpm nx run-many -t test -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/data-access,@workspace/state,@workspace/game-server,@workspace/game-h5`

### Completion Notes List

- 已新增共享 `inventory` contract/type/schema，统一定义基础资源、背包物品、容量信息与稳定错误码
- 已在 `libs/server/domain`、`libs/server/db`、`libs/server/application` 建立独立库存模型、分离式仓储与权威查询服务
- 已在 `apps/game-server` 落地 `GET /api/v1/inventory`，并复用统一 session 边界返回权威库存快照
- 已在角色初始化链路中补上库存落账与缺失补建，避免重复初始化污染库存，同时兼容已存在玩家态缺少库存时的自修复
- 已在 `libs/client/data-access`、`libs/client/state` 与 `apps/game-h5/src/bootstrap` 打通库存快照读取和持久化，刷新进入时不再只依赖本地初始化快照
- 当前仍存在 React Router v7 future flag warning 与 Nx `MaxListenersExceededWarning`，均为现有依赖/工具链提示，不影响本故事测试通过
- 当前工作区不是 git 仓库，且本轮未获得新的子代理评审授权，因此收尾采用本地顺序自检而非并行 code review

### File List

- _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md
- apps/game-h5/src/bootstrap/init-app.spec.ts
- apps/game-h5/src/bootstrap/init-app.ts
- apps/game-h5/src/bootstrap/initialize-inventory.spec.ts
- apps/game-h5/src/bootstrap/initialize-inventory.ts
- apps/game-server/src/app/app.module.ts
- apps/game-server/src/modules/inventory/inventory.controller.spec.ts
- apps/game-server/src/modules/inventory/inventory.controller.ts
- apps/game-server/src/modules/inventory/inventory.module.ts
- apps/game-server/src/modules/inventory/inventory.service.ts
- apps/game-server/src/modules/player/player.module.ts
- apps/game-server/src/modules/player/player.service.ts
- docs/plans/2026-04-06-story-2-1-authoritative-inventory-model.md
- libs/client/data-access/src/lib/data-access.spec.ts
- libs/client/data-access/src/lib/data-access.ts
- libs/client/state/src/lib/state.spec.ts
- libs/client/state/src/lib/state.ts
- libs/server/application/src/lib/application.spec.ts
- libs/server/application/src/lib/application.ts
- libs/server/db/src/lib/db.spec.ts
- libs/server/db/src/lib/db.ts
- libs/server/domain/src/lib/domain.spec.ts
- libs/server/domain/src/lib/domain.ts
- libs/shared/contracts/src/lib/contracts.spec.ts
- libs/shared/contracts/src/lib/contracts.ts
- libs/shared/schemas/src/lib/schemas.spec.ts
- libs/shared/schemas/src/lib/schemas.ts
- libs/shared/types/src/lib/types.spec.ts
- libs/shared/types/src/lib/types.ts

### Change Log

- 2026-04-06: 初始创建 Story 2.1，上下文已补齐，可直接进入开发
- 2026-04-06: 完成 Story 2.1 实现与验证，权威库存模型、服务端读取接口与客户端库存同步链路已落地
