# Story 2.4: 支持可消耗物品与基础资源扣减链路

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 玩家，
I want 使用可用消耗品或执行允许的资源扣减动作后立即看到库存变化，
so that 我能确认资源消耗真实生效并为后续成长动作做准备。

## Acceptance Criteria

1. **Given** 玩家拥有一期允许使用的消耗品或可扣减资源  
   **When** 玩家执行使用或扣减动作  
   **Then** 服务端校验资源是否足够并完成权威扣减  
   **And** 客户端收到更新后的资源与背包状态

2. **Given** 玩家资源不足或目标动作不允许  
   **When** 发起使用或扣减请求  
   **Then** 系统返回明确失败结果  
   **And** 不产生部分扣减或不可解释状态

3. **Given** 资源扣减或物品消耗成功  
   **When** 系统完成结算  
   **Then** 关键资源变更被记录  
   **And** 后续幻兽养成或战斗奖励链路可以复用这条基础消耗能力

## Tasks / Subtasks

- [x] 建立共享消耗动作契约
  - [x] 在 `libs/shared/contracts` 增加一期最小消耗动作 contract，保持在 `resource` 边界，不把写操作塞回 `inventory` 只读接口
  - [x] 在 `libs/shared/types` 增加请求、成功响应、失败响应、稳定错误码与受控 action id，客户端只能提交 `sessionToken + actionId`
  - [x] 失败响应必须至少覆盖资源不足、消耗品不存在或数量不足、动作不允许三类结果，并包含可解释字段供 H5 展示

- [x] 建立服务端权威消耗与扣减用例
  - [x] 在 `libs/server/domain` 定义一期允许的最小消耗动作目录，至少覆盖“使用初始化回城符”与“一条受控基础资源扣减动作”
  - [x] 资源与背包变更必须原子完成，禁止先扣金币或减道具后再返回失败
  - [x] 在 `libs/server/application` 编排消耗动作：解析服务端定义的 action、校验库存与资源、成功时写入最新 snapshot、失败时返回稳定结果

- [x] 为成功与阻断结果记录最小资源变更日志
  - [x] 在 `libs/server/db` 扩展当前最小审计仓储，至少能记录 `traceId`、`accountId`、`playerId`、`actionId`、事件类型、结果状态与关键变更摘要
  - [x] 消耗成功时必须记录本次扣减了哪些资源或物品；阻断时也必须记录失败原因，供后续排障与申诉解释
  - [x] 当前故事只要求“存在可查询记录并能被测试验证”，不提前扩展完整 GM/客服后台

- [x] 暴露正式消耗接口并保持 snapshot 一致
  - [x] 在 `apps/game-server/src/modules/resource` 新增正式 consume/deduct controller 与 service 方法，保持 `resource` 作为写边界
  - [x] 成功返回更新后的权威 inventory snapshot；失败返回稳定错误码与可解释详情，且快照状态保持动作前一致
  - [x] 接口继续复用统一 session 边界与 `traceId` 规则，不新增平台分叉或本地直写捷径

- [x] 交付共享 H5 的一期基础消耗反馈
  - [x] 在 `apps/game-h5/src/features/inventory` 接入最小可用入口，允许玩家触发“使用一个现有消耗品”和“一条受控资源扣减动作”
  - [x] 成功后页面必须立即展示新的资源或物品数量；失败时使用服务端返回原因做清晰提示，不允许本地臆测成功
  - [x] 本故事只交付基础消耗切片，不伪装成完整成长页、完整战斗页或平台特化页面

- [x] 完成最小可验证检查
  - [x] 为 shared contracts/types/schemas 增加 consume/deduct contract 与响应 schema 测试
  - [x] 为 domain/db/application 增加成功扣减、资源不足阻断、物品数量不足阻断、日志落点与状态不变性测试
  - [x] 为 game-server 增加正式消耗接口测试，验证成功路径、失败路径与稳定错误码
  - [x] 为 game-h5 增加反馈测试，验证数量刷新与失败提示均来自服务端响应

## Dev Notes

### Technical Requirements

- 本故事主要覆盖 PRD 中的 `FR13`、`FR17`、`FR18`、`NFR6`、`NFR10`、`NFR15`、`NFR20`，目标是把“一期允许的消耗动作”落到正式权威链路，而不是继续停留在只读展示层。  
  [Source: _bmad-output/planning-artifacts/prd.md#基础资源成长与养成消耗]  
  [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- PRD 明确要求资源扣减、养成消耗与成长推进必须由服务端裁定，客户端不能本地先改数量再假设成功。  
  [Source: _bmad-output/planning-artifacts/prd.md#技术约束]
- 当前故事只要求“一期受控消耗动作切片”，不负责完整幻兽养成、战斗体力结算、商城购买或复杂多资源组合扣减。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4: 支持可消耗物品与基础资源扣减链路]  
  [Source: _bmad-output/planning-artifacts/epics.md#Epic 3: 玩家培养幻兽并配置出战队伍]  
  [Source: _bmad-output/planning-artifacts/epics.md#Epic 4: 玩家进入基础战斗并获得结果反馈]

### Architecture Compliance

- 服务端必须权威控制物品消耗与资源扣减，前端只能提交 action 请求，不能上传“要扣多少金币”“要减多少道具”作为真相。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- `背包与资源管理` 与 `基础成长与节奏反馈` 在结构上映射到 `apps/game-h5/src/features/inventory`、`apps/game-server/src/modules/resource` 与共享 application/domain/db 分层；本故事应沿用该边界。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- 共享 H5 与微信小程序壳必须继续共用同一条 consume/deduct 规则链路，平台差异只允许存在于宿主桥接层。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]

### Library / Framework Requirements

- 当前实际基线继续沿用 `NestJS 11`、`React 19`、`react-router-dom 6.30.3`、`Vitest`、`Jest`、`zod`，不新增新的服务端框架、状态框架或 UI 状态库。  
  [Source: package.json]
- 共享请求/响应定义仍通过 `@workspace/contracts`、`@workspace/types`、`@workspace/schemas` 串联，consume/deduct 的 action id、错误码和详情不能只存在于某一端私有实现里。  
  [Source: libs/shared/contracts/src/lib/contracts.ts]  
  [Source: libs/shared/types/src/lib/types.ts]

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
  - `apps/game-server/src/modules/resource/**`
  - `libs/client/data-access/src/lib/data-access.ts`
  - `libs/client/data-access/src/lib/data-access.spec.ts`
  - `apps/game-h5/src/features/inventory/**`
  - `apps/game-h5/src/app/app.module.css`
- 当前 `apps/game-server/src/modules/inventory` 仍是只读快照接口；本故事的所有写动作必须继续留在 `resource` 模块或等价正式写边界。  
  [Source: apps/game-server/src/modules/inventory/inventory.controller.ts]  
  [Source: apps/game-server/src/modules/inventory/inventory.service.ts]

### Testing Requirements

- 必须遵守 TDD，先让 consume/deduct 测试失败，再补实现。  
  [Source: _bmad-output/project-context.md#测试规则]
- 最少覆盖以下验证：
  - consume/deduct contract 与 schema 能稳定表达成功、资源不足、消耗品不足、动作不允许
  - 服务端在失败时不会产生部分扣减
  - 使用消耗品后数量正确减少，归零时背包格数同步释放
  - 成功与阻断都会写入最小资源变更日志
  - 客户端展示的数量变化和失败原因来自服务端返回，而不是本地推断
- 建议至少运行：
  - `pnpm nx test @workspace/contracts`
  - `pnpm nx test @workspace/types`
  - `pnpm nx test @workspace/schemas`
  - `pnpm nx test @workspace/domain`
  - `pnpm nx test @workspace/db`
  - `pnpm nx test @workspace/application`
  - `pnpm nx test @workspace/data-access`
  - `pnpm nx test @workspace/game-server`
  - `pnpm nx test @workspace/game-h5`
  - `pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`

### Previous Story Intelligence

- Story 2.1 已建立权威 inventory snapshot、独立资源态/背包态和基础仓储，本故事必须直接复用这条库存模型，而不是额外造一套“消耗中间态”。  
  [Source: _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md]
- Story 2.2 已把 `/inventory` 做成正式背包页，Story 2.3 又在同页接入了奖励校验切片；本故事应继续沿用该页承接最小消耗反馈，而不是跳去未规划的新页面。  
  [Source: _bmad-output/implementation-artifacts/2-2-deliver-bag-and-resource-overview.md]  
  [Source: _bmad-output/implementation-artifacts/2-3-implement-reward-capacity-check-and-blocking-feedback.md]
- Story 2.3 已把 `resource` 模块、共享 reward contract 和最小审计仓储建立起来；Story 2.4 应继续沿用同一分层模式扩展 consume/deduct 能力，而不是回退成 controller 内直接改仓储。  
  [Source: _bmad-output/implementation-artifacts/2-3-implement-reward-capacity-check-and-blocking-feedback.md]

### Latest Tech Information

- 当前 `buildStarterInventorySnapshot` 已初始化 `回城符 x5`，这是一期最合适的最小 consumable 用例，适合验证数量扣减、归零处理和 H5 文案反馈。  
  [Source: libs/server/domain/src/lib/domain.ts]
- 当前 `ResourceService` / `ResourceController` 只落地了 reward claim，用例边界已经在 `resource` 模块中建立完成，consume/deduct 应复用这里的模块装配方式。  
  [Source: apps/game-server/src/modules/resource/resource.service.ts]  
  [Source: apps/game-server/src/modules/resource/resource.controller.ts]
- 当前 `InventoryPage` 已维护本地 `activeSnapshot` 与反馈卡片状态，也已经能在成功后持久化新的 snapshot，因此非常适合作为本故事的最小 UI 承接层。  
  [Source: apps/game-h5/src/features/inventory/inventory-page.tsx]
- 当前 `libs/client/data-access` 已有 reward claim 调用模式；新增 consume/deduct 请求应保持同样的 shared contract + schema 解析方式。  
  [Source: libs/client/data-access/src/lib/data-access.ts]

### Project Context Reference

- 共享 H5 是唯一核心客户端，网页端与微信壳只是宿主；消耗规则和资源扣减结果不能出现平台分叉。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]
- 所有资源消耗、奖励发放和成长推进必须保留明确来源与去向语义，不能用不可追溯的临时字段直接覆盖核心资源。  
  [Source: _bmad-output/project-context.md#关键红线规则]
- 旧 `htmlgame` 只能参考“消耗品、资源、布局文案”的表现思路，不能沿用其单页脚本、演示接口或本地直写逻辑。  
  [Source: _bmad-output/project-context.md#新构建基线]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4: 支持可消耗物品与基础资源扣减链路]
- [Source: _bmad-output/planning-artifacts/prd.md#技术约束]
- [Source: _bmad-output/planning-artifacts/prd.md#基础资源成长与养成消耗]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]
- [Source: _bmad-output/project-context.md#测试规则]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#关键红线规则]
- [Source: _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md]
- [Source: _bmad-output/implementation-artifacts/2-2-deliver-bag-and-resource-overview.md]
- [Source: _bmad-output/implementation-artifacts/2-3-implement-reward-capacity-check-and-blocking-feedback.md]
- [Source: apps/game-h5/src/features/inventory/inventory-page.tsx]
- [Source: apps/game-server/src/modules/resource/resource.controller.ts]
- [Source: apps/game-server/src/modules/resource/resource.service.ts]
- [Source: libs/server/application/src/lib/application.ts]
- [Source: libs/server/domain/src/lib/domain.ts]
- [Source: libs/client/data-access/src/lib/data-access.ts]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Story context engine analysis for Story 2.4 completed
- `pnpm nx test @workspace/contracts`
- `pnpm nx test @workspace/types`
- `pnpm nx test @workspace/schemas`
- `pnpm nx test @workspace/domain`
- `pnpm nx test @workspace/db`
- `pnpm nx test @workspace/application`
- `pnpm nx test @workspace/data-access`
- `pnpm nx test @workspace/game-server`
- `pnpm nx test @workspace/game-h5`
- `pnpm nx run-many -t test -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`
- `pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`

### Completion Notes List

- 已新增共享 consume/deduct contract、action id、错误码与 schema，客户端只能提交 `sessionToken + actionId`，扣减明细完全由服务端决定。
- 已在 `libs/server/domain`、`libs/server/application` 与 `libs/server/db` 建立一期最小消耗能力：支持 `use-return-scroll` 与 `deduct-growth-gold` 两条受控动作，失败时保证无部分扣减，成功与阻断均落最小审计记录。
- 已在 `apps/game-server/src/modules/resource` 落地正式 `POST /api/v1/resource/consume`，成功返回更新后的权威 inventory snapshot，资源不足/物品不足返回稳定阻断结果。
- 已在共享 H5 背包页接入“使用 1 张回城符”“扣除 200 金币”入口，成功后即时刷新资源与物品数量，失败提示来自服务端返回而非本地推断。
- 已完成整组 test 与 typecheck；当前仍有 React Router future flag warning 和 Nx `MaxListenersExceededWarning`，均未阻断结果。

### File List

- _bmad-output/implementation-artifacts/2-4-support-consumables-and-resource-deduction-flow.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- apps/game-h5/src/features/inventory/inventory-page.spec.tsx
- apps/game-h5/src/features/inventory/inventory-page.tsx
- apps/game-server/src/modules/resource/resource.controller.spec.ts
- apps/game-server/src/modules/resource/resource.controller.ts
- apps/game-server/src/modules/resource/resource.service.ts
- docs/plans/2026-04-06-story-2-4-consumables-and-resource-deduction.md
- libs/client/data-access/src/lib/data-access.spec.ts
- libs/client/data-access/src/lib/data-access.ts
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

- 2026-04-06: 初始创建 Story 2.4，上下文已补齐，可直接进入开发
- 2026-04-06: 完成可消耗物品与基础资源扣减链路，实现正式 consume 接口、最小审计记录、共享 H5 反馈与全量验证
