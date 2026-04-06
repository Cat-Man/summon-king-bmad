# Story 3.3: 实现基础幻兽养成动作与权威结算

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 玩家，
I want 对幻兽执行一期开放的基础养成动作，
so that 我能通过消耗资源让幻兽变强。

## Acceptance Criteria

1. **Given** 玩家拥有足够的养成资源  
   **When** 对幻兽执行一期允许的基础养成动作  
   **Then** 服务端完成资源扣减与幻兽成长结算  
   **And** 返回更新后的幻兽状态与资源结果

2. **Given** 玩家资源不足或目标幻兽状态不满足条件  
   **When** 发起养成请求  
   **Then** 系统返回明确失败结果  
   **And** 不发生部分扣减或部分成长写入

3. **Given** 幻兽养成成功  
   **When** 系统完成结算  
   **Then** 关键资源变动和幻兽成长结果被记录  
   **And** 后续战斗读取到的是更新后的权威状态

## Tasks / Subtasks

- [x] 冻结一期基础幻兽养成的共享契约与最小模型
  - [x] 在 `libs/shared/types` 定义一期最小 `beast growth` 请求/响应、动作 id、错误码与成功载荷，保持中文业务语义但代码值使用稳定英文标识
  - [x] 在 `libs/shared/contracts` 增加正式养成接口 contract 与 URL builder，沿用现有 `/api/v1/...` 约定，不复用旧 demo 风格接口
  - [x] 在 `libs/shared/schemas` 为请求与成功/失败响应补齐 Zod schema，保证 beast、resource 与错误结构稳定可解析
  - [x] 一期只开放单一基础养成动作，不提前加入技能、战灵、战骨、魔魂、升星或多材料组合逻辑

- [x] 建立服务端权威的幻兽养成结算用例
  - [x] 在 `libs/server/domain` 增加一期最小成长规则：对指定幻兽执行一次基础培养，消耗受控金币成本并提升最小等级结果
  - [x] 在 `libs/server/application` 增加 beast growth 用例，确保资源扣减、幻兽成长与返回载荷在同一条权威结算链路中完成
  - [x] 养成成功后同时更新 `PlayerInitializationRepository` 与 `PlayerInventoryRepository` 中的相关资源/幻兽状态，避免主界面、幻兽页与背包页出现资源漂移
  - [x] 资源不足、会话无效、状态缺失、目标幻兽不存在或当前动作未开放时必须稳定失败，且不得出现部分扣减或部分成长写入
  - [x] 复用现有审计仓储边界记录 `beast.growth` 成功/阻断结果，优先最小扩展现有 audit record，而不是为一期引入新的持久化模块

- [x] 暴露正式 beast growth 接口并接入共享 data-access
  - [x] 在 `apps/game-server/src/modules/beast` 增加正式养成 controller/service 链路，保持 controller 只做解析与错误映射，规则仍落在 application/domain
  - [x] 在 `libs/client/data-access` 增加正式 beast growth 请求方法，继续复用 shared contract/schema，而不是在页面内手写 fetch payload
  - [x] 接口成功时返回最新幻兽状态与最新资源结果，失败时返回稳定错误码、文案与 traceId

- [x] 在共享 H5 接入一期最小养成动作入口
  - [x] 优先在 `apps/game-h5/src/features/beast/beast-detail-page.tsx` 接入“培养 1 次”或等价的一期最小动作入口，避免在 Story 3.3 额外铺开完整成长页体系
  - [x] 成功后同步更新详情页本地显示、共享 `PlayerInitSnapshot` 与 `InventorySnapshot`，保证主界面、幻兽列表、详情页和背包资源能读到同一份最新结果
  - [x] 失败提示必须来自服务端返回，不允许前端本地猜测资源不足或成长结果
  - [x] Story 3.3 只交付“可执行的最小养成动作 + 基础成功/失败反馈”，更丰富的成长结果展示与未开放分支导流留给 Story 3.4

- [x] 补齐测试与验证
  - [x] 为 shared contracts/types/schemas 增加 beast growth 契约测试
  - [x] 为 domain 增加基础成长成功、资源不足失败与无部分写入测试
  - [x] 为 application 增加双仓储同步、审计记录、非法幻兽失败与结果幂等验证
  - [x] 为 game-server 增加 beast growth 接口测试
  - [x] 为 data-access 增加 beast growth 请求解析测试
  - [x] 为 game-h5 增加 BeastDetailPage 的养成动作测试，验证成功刷新与失败提示

## Dev Notes

### Technical Requirements

- 本故事主要覆盖 PRD 中的 `FR17`、`FR18`、`FR21`、`FR22`、`FR24`、`NFR3`、`NFR6`、`NFR7`、`NFR10`，目标是在一期范围内把“资源消耗 -> 幻兽成长 -> 状态可读”闭环正式接上。  
  [Source: _bmad-output/planning-artifacts/prd.md#背包与资源管理]  
  [Source: _bmad-output/planning-artifacts/prd.md#幻兽养成与队伍]
- 一期养成动作必须严格收敛为单一基础动作，不可把完整首发版中的深层养成分支提前引入当前骨架。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3: 实现基础幻兽养成动作与权威结算]  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4: 展示成长反馈并限制未开放深层养成分支]
- 成功响应至少需要携带最新幻兽状态与最新资源结果，便于共享 H5 同步 `beast` 与 `inventory` 两条视图链路；不要求在 3.3 一次性给出完整成长前后对比面板。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3: 实现基础幻兽养成动作与权威结算]
- 养成结算必须由服务端权威完成，客户端只负责提交动作与展示结果，不允许在 H5 或小程序壳本地推导最终等级或资源扣减。  
  [Source: _bmad-output/project-context.md#关键红线规则]

### Architecture Compliance

- 必须继续遵守 `shared contracts/types/schemas -> data-access -> game-server module -> application -> domain -> db` 的正式分层，不能在页面组件中直接拼装领域规则。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Service Boundaries]  
  [Source: _bmad-output/planning-artifacts/architecture.md#Data Boundaries]
- `幻兽养成与队伍` 的主落点仍是 `apps/game-h5/src/features/beast` 与 `apps/game-server/src/modules/beast`；不要因为引入成长动作就把幻兽主链路拆成另一套平行 beast 客户端。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- 当前工程里资源快照与玩家初始化快照分属两个仓储边界；本故事必须显式处理这两个权威视图的一致性，而不是只更新其中一边。  
  [Source: libs/server/db/src/lib/db.ts]  
  [Source: apps/game-h5/src/app/app.tsx]
- 审计记录优先最小扩展现有 in-memory audit repository，记录 `beast.growth` 的 granted/blocked 结果；不要在 3.3 提前引入完整 ops/audit 新模块。  
  [Source: libs/server/db/src/lib/db.ts]  
  [Source: _bmad-output/planning-artifacts/architecture.md#Monitoring & Logging]

### Library / Framework Requirements

- 前端继续使用当前 React 19 + React Router + Testing Library 栈；不为 3.3 引入新的状态框架或页面级请求库切换。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- 共享请求必须继续通过 `@workspace/data-access` 发起，并由 `@workspace/schemas` 解析返回；不要在 BeastDetailPage 内直接散落裸 `fetch` 实现。  
  [Source: libs/client/data-access/src/lib/data-access.ts]
- 若需要同步前端共享快照，继续沿用 `libs/client/state` 的边界和 Story 3.2 已建立的可订阅快照模式，不重新发明新的 beast 全局 store。  
  [Source: libs/client/state/src/lib/state.ts]  
  [Source: _bmad-output/implementation-artifacts/3-2-deliver-beast-detail-and-team-setup.md#Completion Notes List]

### File Structure Requirements

- 共享协议层优先修改：
  - `libs/shared/types/src/lib/types.ts`
  - `libs/shared/types/src/lib/types.spec.ts`
  - `libs/shared/contracts/src/lib/contracts.ts`
  - `libs/shared/contracts/src/lib/contracts.spec.ts`
  - `libs/shared/schemas/src/lib/schemas.ts`
  - `libs/shared/schemas/src/lib/schemas.spec.ts`
- 服务端规则与用例优先修改：
  - `libs/server/domain/src/lib/domain.ts`
  - `libs/server/domain/src/lib/domain.spec.ts`
  - `libs/server/application/src/lib/application.ts`
  - `libs/server/application/src/lib/application.spec.ts`
  - `apps/game-server/src/modules/beast/beast.controller.ts`
  - `apps/game-server/src/modules/beast/beast.controller.spec.ts`
  - `apps/game-server/src/modules/beast/beast.service.ts`
- 客户端接入优先修改：
  - `libs/client/data-access/src/lib/data-access.ts`
  - `libs/client/data-access/src/lib/data-access.spec.ts`
  - `apps/game-h5/src/features/beast/beast-detail-page.tsx`
  - `apps/game-h5/src/features/beast/beast-detail-page.spec.tsx`
  - `apps/game-h5/src/app/app.tsx` / `apps/game-h5/src/app/app.spec.tsx`（仅在需要校验共享快照回流时调整）
- 除非实现被事实证明必须独立路由，否则 3.3 不应提前创建完整 `features/growth` 页面体系；先把最小养成动作落在现有幻兽详情链路里。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4: 展示成长反馈并限制未开放深层养成分支]

### Testing Requirements

- 必须遵守 TDD，先让 beast growth 相关测试失败，再补实现。  
  [Source: _bmad-output/project-context.md#测试规则]
- 最少覆盖以下验证：
  - beast growth contract 与 schema 能稳定表达成功和失败
  - 成功结算后，幻兽等级与资源快照同步更新
  - 资源不足或非法幻兽失败时，不发生部分扣减或部分成长写入
  - audit 记录成功/阻断结果
  - H5 成功后详情页、主界面/列表回退基线与背包资源保持一致
  - 失败提示来自服务端响应，而不是前端本地猜测
- 建议至少运行：
  - `pnpm nx test @workspace/types`
  - `pnpm nx test @workspace/contracts`
  - `pnpm nx test @workspace/schemas`
  - `pnpm nx test @workspace/domain`
  - `pnpm nx test @workspace/application`
  - `pnpm nx test @workspace/data-access`
  - `pnpm nx test @workspace/game-server`
  - `pnpm nx test @workspace/game-h5`
  - `pnpm nx run-many -t typecheck -p @workspace/types,@workspace/contracts,@workspace/schemas,@workspace/domain,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`

### Previous Story Intelligence

- Story 3.2 已完成正式幻兽详情读取与默认队伍配置链路，并在 review 修复后建立了 `PlayerInitSnapshot` 的共享订阅更新能力；3.3 应直接在这条详情链路上接入最小养成动作，不要退回占位页。  
  [Source: _bmad-output/implementation-artifacts/3-2-deliver-beast-detail-and-team-setup.md]
- Story 2.4 已建立“受控动作 -> 资源扣减 -> 审计记录 -> 返回最新 snapshot”的稳定模式；3.3 可以复用这套原子结算思路，但不能只停留在 inventory consume 语义，因为本故事还要求返回最新幻兽状态。  
  [Source: _bmad-output/implementation-artifacts/2-4-support-consumables-and-resource-deduction-flow.md]
- Story 3.1 / 3.2 的 beast 数据目前都来自初始化快照中的 `snapshot.beasts` 与 `snapshot.defaultTeam`；3.3 不要提前发明独立幻兽成长仓储。  
  [Source: _bmad-output/implementation-artifacts/3-1-build-beast-instance-model-and-list-query.md]  
  [Source: _bmad-output/implementation-artifacts/3-2-deliver-beast-detail-and-team-setup.md]

### Latest Tech Information

- 当前 `StarterBeastSnapshot` 的稳定成长字段只有 `level`，尚未有星级、技能树、装备槽等深层模型；一期最小成长结果应优先围绕 `level` 变化建立。  
  [Source: libs/shared/types/src/lib/types.ts]
- 当前 domain 已存在受控资源动作 `deduct-growth-gold`，成本为 200 金币；3.3 可以把它作为一期最小养成成本基线，但正式 beast growth 响应仍需返回更新后的幻兽结果。  
  [Source: libs/server/domain/src/lib/domain.ts]
- 当前 `RewardAuditLogRepository` 仅记录 `reward.claim` 与 `resource.consume`；本故事若需记录成长结果，应优先做最小扩展而非全仓重构。  
  [Source: libs/server/db/src/lib/db.ts]
- 当前主界面与幻兽链路使用 `PlayerInitSnapshot`，背包页使用 `InventorySnapshot`；若养成成功只更新其中一边，用户会立刻看到资源或等级不一致。  
  [Source: apps/game-h5/src/app/app.tsx]  
  [Source: apps/game-h5/src/features/inventory/inventory-page.tsx]

### Project Context Reference

- 共享 H5 是唯一核心客户端，网页端与微信壳只是宿主；养成规则与结算语义不得出现平台分叉。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]
- 中文业务术语、幻兽名称和养成语义必须保留，不要在新实现中改写成泛化英文 RPG 词汇。  
  [Source: _bmad-output/project-context.md#语言与代码模式规则]
- 旧 `htmlgame` 只可参考布局、术语和素材，不可把旧单页里的本地养成脚本或前端直改数值逻辑搬进正式工程。  
  [Source: _bmad-output/project-context.md#新构建基线]
- 所有成长推进都必须由服务端裁定；客户端只能提交动作与展示结果。  
  [Source: _bmad-output/project-context.md#关键红线规则]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3: 实现基础幻兽养成动作与权威结算]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4: 展示成长反馈并限制未开放深层养成分支]
- [Source: _bmad-output/planning-artifacts/prd.md#背包与资源管理]
- [Source: _bmad-output/planning-artifacts/prd.md#幻兽养成与队伍]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Monitoring & Logging]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#Service Boundaries]
- [Source: _bmad-output/project-context.md#测试规则]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#语言与代码模式规则]
- [Source: _bmad-output/project-context.md#关键红线规则]
- [Source: _bmad-output/implementation-artifacts/2-4-support-consumables-and-resource-deduction-flow.md]
- [Source: _bmad-output/implementation-artifacts/3-1-build-beast-instance-model-and-list-query.md]
- [Source: _bmad-output/implementation-artifacts/3-2-deliver-beast-detail-and-team-setup.md]
- [Source: apps/game-h5/src/app/app.tsx]
- [Source: apps/game-h5/src/features/beast/beast-detail-page.tsx]
- [Source: apps/game-h5/src/features/inventory/inventory-page.tsx]
- [Source: apps/game-server/src/modules/beast/beast.controller.ts]
- [Source: apps/game-server/src/modules/beast/beast.service.ts]
- [Source: libs/client/data-access/src/lib/data-access.ts]
- [Source: libs/server/application/src/lib/application.ts]
- [Source: libs/server/db/src/lib/db.ts]
- [Source: libs/server/domain/src/lib/domain.ts]
- [Source: libs/shared/types/src/lib/types.ts]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- `pnpm nx run-many -t test -p @workspace/data-access,@workspace/game-server,@workspace/game-h5 --parallel=1`
- `pnpm nx test @workspace/data-access`
- `pnpm nx test @workspace/game-server`
- `pnpm nx test @workspace/game-h5`
- `pnpm nx run-many -t test -p @workspace/types,@workspace/contracts,@workspace/schemas,@workspace/domain,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5 --parallel=1`
- `pnpm nx run-many -t typecheck -p @workspace/types,@workspace/contracts,@workspace/schemas,@workspace/domain,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`

### Completion Notes List

- 完成一期最小幻兽养成动作 `basic-level-up` 的共享类型、契约与 schema，保持成长动作固定为消耗 200 金币提升 1 级。
- 服务端正式接入 `createBeastGrowthService`，在 beast 模块内暴露权威 `POST /api/v1/beast/growth`，并复用现有 inventory/audit 仓储同步资源与审计结果。
- `BeastDetailPage` 增加“培养 1 次”入口，成功后同步详情本地状态、`PlayerInitSnapshot` 与 `InventorySnapshot`，失败提示直接使用服务端返回。
- 为通过 `game-h5` 的 spec typecheck，补齐 `apps/game-h5/tsconfig.spec.json` 的 DOM lib，避免测试文件中的 `closest` 在类型层失效。

### File List

- `_bmad-output/implementation-artifacts/3-3-implement-basic-beast-growth-and-authoritative-settlement.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/game-h5/src/features/beast/beast-detail-page.spec.tsx`
- `apps/game-h5/src/features/beast/beast-detail-page.tsx`
- `apps/game-h5/tsconfig.spec.json`
- `apps/game-server/src/modules/beast/beast.controller.spec.ts`
- `apps/game-server/src/modules/beast/beast.controller.ts`
- `apps/game-server/src/modules/beast/beast.module.ts`
- `apps/game-server/src/modules/beast/beast.service.ts`
- `apps/game-server/src/modules/resource/resource.module.ts`
- `libs/client/data-access/src/lib/data-access.spec.ts`
- `libs/client/data-access/src/lib/data-access.ts`
- `libs/server/application/src/lib/application.spec.ts`
- `libs/server/application/src/lib/application.ts`
- `libs/server/db/src/lib/db.ts`
- `libs/server/domain/src/lib/domain.spec.ts`
- `libs/server/domain/src/lib/domain.ts`
- `libs/shared/contracts/src/lib/contracts.spec.ts`
- `libs/shared/contracts/src/lib/contracts.ts`
- `libs/shared/schemas/src/lib/schemas.spec.ts`
- `libs/shared/schemas/src/lib/schemas.ts`
- `libs/shared/types/src/lib/types.spec.ts`
- `libs/shared/types/src/lib/types.ts`

### Change Log

- 2026-04-06: 初始创建 Story 3.3，上下文已补齐，可直接进入开发
- 2026-04-06: 完成 beast growth 共享契约、服务端权威结算、正式 beast 接口接线、H5 养成入口与共享快照同步，并通过 Story 3.3 全量测试与 typecheck
