# Story 2.3: 实现奖励入包校验与容量阻断反馈

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 玩家，
I want 在获得奖励但背包容量不足时收到明确阻断与处理提示，
so that 我不会因为静默失败而失去奖励或无法理解当前问题。

## Acceptance Criteria

1. **Given** 玩家获得需要进入背包的奖励  
   **When** 服务端执行奖励发放前校验  
   **Then** 系统检查目标存储空间是否足够  
   **And** 校验结果由服务端权威裁定

2. **Given** 存储空间不足  
   **When** 奖励无法完整发放  
   **Then** 系统返回明确阻断结果与稳定错误码  
   **And** 客户端显示可理解的容量不足提示与处理方向

3. **Given** 奖励发放被阻断  
   **When** 玩家查看当前状态  
   **Then** 系统不会静默吞掉奖励或写入不一致结果  
   **And** 关键阻断事件被记录到可查询日志中

## Tasks / Subtasks

- [x] 建立奖励入包与容量阻断的共享契约
  - [x] 在 `libs/shared/contracts` 增加一期最小奖励领取 contract，路径应保持在 `resource/reward` 边界内，不把奖励动作混回 `inventory` 只读接口
  - [x] 在 `libs/shared/types` 增加奖励领取请求、成功响应、阻断响应与稳定错误码，至少覆盖无效输入、无效会话、容量不足三类结果
  - [x] 阻断响应必须包含足够的可解释字段，支持客户端展示“剩余容量不足、哪些奖励被阻断、建议如何处理”

- [x] 建立服务端权威容量校验与奖励发放用例
  - [x] 在 `libs/server/domain` 定义一期最小奖励包模型与背包容量校验规则，明确“先校验，再发放”，不允许部分写入后再报错
  - [x] 在 `libs/server/application` 编排奖励领取用例：解析服务端奖励包、校验背包空位、成功时写入库存、失败时返回稳定阻断结果
  - [x] 奖励内容必须由服务端决定，客户端只能提交受控奖励入口标识或动作请求，不能自行上传奖励物品清单作为真相

- [x] 为阻断与成功结果记录最小可查询日志
  - [x] 在 `libs/server/db` 增加最小奖励审计记录仓储，至少能保存 `traceId`、`accountId`、`playerId`、事件类型、结果状态与关键上下文
  - [x] 奖励被阻断时必须落一条阻断日志；奖励成功发放时也应落成功日志，供后续客服/排障链路使用
  - [x] 当前故事只要求“可查询记录存在且可被代码读取验证”，不提前扩展完整 GM/客服后台页面

- [x] 暴露正式奖励领取接口并保持 inventory snapshot 一致
  - [x] 在 `apps/game-server/src/modules/resource` 或与之等价的正式模块中新增奖励领取 controller/service/module，不把写入逻辑塞回 `inventory` 只读模块
  - [x] 成功发放后返回更新后的权威 inventory snapshot；阻断时返回稳定错误码与阻断详情，且库存状态保持发放前一致
  - [x] 接口继续复用统一 session 边界与 `traceId` 生成规则，不新增平台分叉或本地直写旁路

- [x] 交付共享 H5 的阻断反馈体验
  - [x] 在 `apps/game-h5/src/features/inventory` 接入一期最小奖励领取触发与阻断反馈，优先复用当前背包页而不是另起一套假页面
  - [x] 由于战斗奖励链路尚未正式接入，本故事允许提供“受控测试奖励”触发入口来验证容量规则，但必须明确其属于一期奖励校验切片，不伪装成完整战斗结算页
  - [x] 阻断提示必须清楚说明“背包容量不足”“当前剩余格数”“建议先整理/消耗/清出空间后再继续”，不得只弹出泛化失败文案

- [x] 完成最小可验证检查
  - [x] 为 shared contracts/types/schemas 增加奖励领取 contract 与响应 schema 测试
  - [x] 为 domain/db/application 增加奖励成功、容量阻断、日志落点与库存不变性测试
  - [x] 为 game-server 增加奖励领取接口测试，验证成功发放、容量阻断与稳定错误码
  - [x] 为 game-h5 增加阻断反馈测试，验证提示文案来自服务端阻断结果而不是本地臆测

## Dev Notes

### Technical Requirements

- 本故事主要覆盖 PRD 中的 `FR15`、`FR16`、`FR18`、`FR38`、`NFR6`、`NFR7`、`NFR20`，目标是把“奖励发放前容量校验”和“失败可解释”真正落到服务端权威链路。  
  [Source: _bmad-output/planning-artifacts/prd.md#背包与资源管理]  
  [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- PRD 明确要求奖励、容量、阻断和排障记录属于一期核心链路，不能等到完整战斗系统接入后再补。  
  [Source: _bmad-output/planning-artifacts/prd.md#目标与背景上下文]  
  [Source: _bmad-output/planning-artifacts/prd.md#存储与资源系统要求]
- 本故事不负责完整战斗结算、奖励池配置后台或消耗品正式使用动作；它只负责“奖励准备入包时的校验、阻断反馈和最小日志”。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3: 实现奖励入包校验与容量阻断反馈]  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4: 支持可消耗物品与基础资源扣减链路]  
  [Source: _bmad-output/planning-artifacts/epics.md#Epic 4: 玩家进入基础战斗并获得结果反馈]

### Architecture Compliance

- 服务端必须权威控制奖励发放与容量校验，客户端不能根据当前 `freeSlots` 本地先判成功再补请求。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- API 结构已明确把玩家主链路中的奖励动作放在 `resource/reward` 边界；库存读取和奖励写入应分离建模。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- 前端只能通过正式 contract 和 data-access 调用后端，不得把平台桥接、宿主差异或假数据捷径渗透进奖励规则。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]  
  [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]
- 一期必须保留初始化/奖励/容量阻断/结算追踪的最小日志与结构化记录，因此本故事的“可查询日志”至少要先落在仓储/应用层，而不是只打控制台输出。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]

### Library / Framework Requirements

- 当前实际基线继续沿用 `NestJS 11`、`React 19`、`react-router-dom 6.30.3`、`Vitest`、`Jest`、`zod`，不新增新的服务端框架、状态框架或表单框架。  
  [Source: package.json]
- 共享请求/响应定义仍通过 `@workspace/contracts`、`@workspace/types`、`@workspace/schemas` 串联；奖励阻断详情不能只存在于某一端的私有接口里。  
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
  - `apps/game-server/src/modules/resource/**`
  - `apps/game-server/src/app/app.module.ts`
  - `libs/client/data-access/src/lib/data-access.ts`
  - `libs/client/data-access/src/lib/data-access.spec.ts`
  - `apps/game-h5/src/features/inventory/**`
  - `apps/game-h5/src/app/app.spec.tsx`
  - `apps/game-h5/src/app/app.module.css`
- 当前代码库还没有正式 `resource` 模块与 `audit` 模块实现；本故事允许先落最小 `resource` 写接口与轻量审计仓储，但不要把未来完整模块边界彻底写死在 `inventory` 只读路径里。  
  [Source: apps/game-server/src/modules/inventory]  
  [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]

### Testing Requirements

- 必须遵守 TDD，先让奖励发放/阻断测试失败，再补实现。  
  [Source: _bmad-output/project-context.md#测试规则]
- 最少覆盖以下验证：
  - 奖励领取 contract 与 schema 能稳定表达成功、阻断、无效会话
  - 服务端在容量不足时不会部分落账或吞奖励
  - 阻断结果包含可用于 UI 展示的剩余容量和处理方向
  - 阻断与成功都会写入最小审计记录
  - 客户端阻断提示来自服务端返回，而不是本地 `freeSlots` 直接臆断
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

- Story 2.1 已把 inventory snapshot、独立资源态/背包态和服务端权威库存读取链路建立完成；本故事必须建立在这条权威链路上做“奖励写入前校验”，不能重新发明第二套库存模型。  
  [Source: _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md]
- Story 2.2 已把 `/inventory` 升级为正式背包页，并增加“inventory snapshot 缺失时的可解释兜底”；本故事应优先在该页面接入容量阻断反馈，而不是另开未规划页面。  
  [Source: _bmad-output/implementation-artifacts/2-2-deliver-bag-and-resource-overview.md]
- 现阶段共享 H5 里还没有正式战斗奖励入口，因此若需要验证阻断体验，应通过受控的最小奖励触发切片接入，不要假装完整战斗结算已经完成。  
  [Source: _bmad-output/implementation-artifacts/1-5-deliver-home-guidance-and-deferred-entry-governance.md]

### Latest Tech Information

- 当前 `libs/server/application` 只有角色初始化与 inventory snapshot 查询服务，尚不存在奖励发放或审计用例，这正是本故事需要补的正式缺口。  
  [Source: libs/server/application/src/lib/application.ts]
- 当前 `libs/server/db` 只保存玩家初始化态与 inventory 的资源/背包态，没有奖励日志仓储；若要满足“可查询日志”，需要在这里或等价持久化边界补最小记录能力。  
  [Source: libs/server/db/src/lib/db.ts]
- 当前 `apps/game-server/src/modules/inventory` 是只读读取接口，不能承担奖励写入职责；Story 2.3 应新增独立写接口模块。  
  [Source: apps/game-server/src/modules/inventory/inventory.service.ts]  
  [Source: apps/game-server/src/modules/inventory/inventory.controller.ts]
- 当前 `apps/game-h5/src/features/inventory/inventory-page.tsx` 已展示容量摘要和物品列表，适合作为容量阻断反馈的最小承接页面。  
  [Source: apps/game-h5/src/features/inventory/inventory-page.tsx]
- 当前 `libs/client/data-access` 与 `apps/game-h5/src/bootstrap/initialize-inventory.ts` 已具备读取权威 inventory snapshot 的链路，奖励成功后应复用同一 snapshot 结构更新 UI，而不是额外拼接本地字段。  
  [Source: libs/client/data-access/src/lib/data-access.ts]  
  [Source: apps/game-h5/src/bootstrap/initialize-inventory.ts]

### Project Context Reference

- 共享 H5 是唯一核心客户端，网页端与微信壳只是宿主；容量校验、奖励阻断和处理语义不能出现平台分叉。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]
- 满仓状态必须明确阻断并提示，绝不能静默吞奖励、覆盖库存或依赖旧原型的宽松处理。  
  [Source: _bmad-output/project-context.md#关键红线规则]
- 旧 `htmlgame` 仅可参考“背包满时玩家需要知道发生了什么”的术语和表现思路，不可沿用其单页脚本、演示接口或本地捷径。  
  [Source: _bmad-output/project-context.md#新构建基线]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3: 实现奖励入包校验与容量阻断反馈]
- [Source: _bmad-output/planning-artifacts/prd.md#背包与资源管理]
- [Source: _bmad-output/planning-artifacts/prd.md#存储与资源系统要求]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/project-context.md#测试规则]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#关键红线规则]
- [Source: _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md]
- [Source: _bmad-output/implementation-artifacts/2-2-deliver-bag-and-resource-overview.md]
- [Source: apps/game-h5/src/features/inventory/inventory-page.tsx]
- [Source: apps/game-server/src/modules/inventory/inventory.controller.ts]
- [Source: apps/game-server/src/modules/inventory/inventory.service.ts]
- [Source: libs/server/application/src/lib/application.ts]
- [Source: libs/server/db/src/lib/db.ts]
- [Source: libs/client/data-access/src/lib/data-access.ts]
- [Source: apps/game-h5/src/bootstrap/initialize-inventory.ts]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Story context engine analysis for Story 2.3 completed
- `pnpm nx run-many -t test -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`
- `pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5`

### Completion Notes List

- 已新增共享 reward claim contract/type/schema，定义受控奖励包领取、稳定错误码和容量阻断详情，客户端与服务端共用同一响应结构。
- 已在 `libs/server/domain`、`libs/server/db`、`libs/server/application` 建立奖励包校验、最小审计仓储和权威奖励领取用例，保证“先校验、再发放”，阻断时库存保持不变。
- 已在 `apps/game-server/src/modules/resource` 落地正式奖励领取接口，成功返回更新后的权威 inventory snapshot，容量不足返回稳定阻断结果。
- 已在背包页接入一期受控奖励校验入口：`领取单格奖励` 可刷新库存，`尝试大包奖励` 会展示服务端阻断提示与处理方向。
- 已验证全量测试与 typecheck 通过；当前仍有 React Router future flag warning 和 Nx `MaxListenersExceededWarning`，均为依赖/工具链提示，不影响本故事结果。

### File List

- apps/game-h5/src/app/app.module.css
- apps/game-h5/src/app/app.spec.tsx
- apps/game-h5/src/app/app.tsx
- apps/game-h5/src/features/inventory/inventory-page.spec.tsx
- apps/game-h5/src/features/inventory/inventory-page.tsx
- apps/game-server/src/app/app.module.ts
- apps/game-server/src/modules/resource/resource.controller.spec.ts
- apps/game-server/src/modules/resource/resource.controller.ts
- apps/game-server/src/modules/resource/resource.module.ts
- apps/game-server/src/modules/resource/resource.service.ts
- docs/plans/2026-04-06-story-2-3-reward-capacity-blocking.md
- _bmad-output/implementation-artifacts/2-3-implement-reward-capacity-check-and-blocking-feedback.md
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

- 2026-04-06: 初始创建 Story 2.3，上下文已补齐，可直接进入开发
- 2026-04-06: 完成奖励入包校验、容量阻断反馈、最小审计记录与 H5 背包页反馈接入，验证通过并更新为 done
