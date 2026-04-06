# Story 2.4 Consumables And Resource Deduction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为《召唤之王》一期建立服务端权威的消耗品使用与基础资源扣减链路，让共享 H5 在动作成功或阻断后都能同步看到最新库存状态。

**Architecture:** 先冻结共享 consume/deduct contract、action id 和错误码，再在 server domain/db/application 中实现“受控动作目录 -> 原子校验与扣减 -> 审计记录 -> 返回最新 snapshot”用例，最后把共享 H5 背包页接成最小可操作入口。整个链路不引入新页面、不把扣减真相交给客户端，也不跨出 `resource` 模块边界。

**Tech Stack:** TypeScript、Nx、NestJS、React 19、react-router-dom 6、Vitest、Jest、zod、CSS Modules

### Task 1: 冻结 consume/deduct 共享契约

**Files:**
- Modify: `libs/shared/contracts/src/lib/contracts.ts`
- Modify: `libs/shared/contracts/src/lib/contracts.spec.ts`
- Modify: `libs/shared/types/src/lib/types.ts`
- Modify: `libs/shared/types/src/lib/types.spec.ts`
- Modify: `libs/shared/schemas/src/lib/schemas.ts`
- Modify: `libs/shared/schemas/src/lib/schemas.spec.ts`

**Step 1: Write the failing test**

覆盖：
- consume/deduct contract 路径与 method
- 受控 action id
- 成功响应、资源不足失败、消耗品不足失败、动作不允许失败

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/contracts
pnpm nx test @workspace/types
pnpm nx test @workspace/schemas
```

Expected: FAIL，因为当前还没有 consume/deduct contract 和 schema。

### Task 2: 建立服务端原子扣减与日志用例

**Files:**
- Modify: `libs/server/domain/src/lib/domain.ts`
- Modify: `libs/server/domain/src/lib/domain.spec.ts`
- Modify: `libs/server/db/src/lib/db.ts`
- Modify: `libs/server/db/src/lib/db.spec.ts`
- Modify: `libs/server/application/src/lib/application.ts`
- Modify: `libs/server/application/src/lib/application.spec.ts`

**Step 1: Write the failing test**

覆盖：
- 使用 `回城符` 成功减少数量
- 资源扣减成功更新资源值
- 消耗品数量不足或资源不足时阻断且状态不变
- 成功与阻断都写入最小资源变更日志

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/domain
pnpm nx test @workspace/db
pnpm nx test @workspace/application
```

Expected: FAIL，因为当前没有 consume/deduct 用例。

### Task 3: 暴露正式 consume/deduct 接口

**Files:**
- Modify: `apps/game-server/src/modules/resource/resource.controller.ts`
- Modify: `apps/game-server/src/modules/resource/resource.service.ts`
- Modify: `apps/game-server/src/modules/resource/resource.module.ts`
- Modify: `apps/game-server/src/modules/resource/resource.controller.spec.ts`

**Step 1: Write the failing test**

覆盖：
- consume/deduct 成功返回更新后的 snapshot
- 资源不足与消耗品不足返回稳定错误码
- 无效会话返回稳定失败

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/game-server
```

Expected: FAIL，因为 resource 模块还没有 consume/deduct 接口。

### Task 4: 接入共享 H5 基础消耗反馈

**Files:**
- Modify: `libs/client/data-access/src/lib/data-access.ts`
- Modify: `libs/client/data-access/src/lib/data-access.spec.ts`
- Modify: `apps/game-h5/src/features/inventory/inventory-page.tsx`
- Modify: `apps/game-h5/src/features/inventory/inventory-page.spec.tsx`
- Modify: `apps/game-h5/src/app/app.module.css`

**Step 1: Write the failing test**

覆盖：
- 背包页可触发使用消耗品与资源扣减
- 成功时页面数量与资源值刷新
- 失败时页面展示服务端返回原因

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/data-access
pnpm nx test @workspace/game-h5
```

Expected: FAIL，因为 H5 还没有 consume/deduct 调用入口和反馈逻辑。

### Task 5: 全量验证与工件回写

**Files:**
- Modify: `_bmad-output/implementation-artifacts/2-4-support-consumables-and-resource-deduction-flow.md`
- Modify: `_bmad-output/implementation-artifacts/sprint-status.yaml`

**Step 1: Run verification**

Run:
```bash
pnpm nx test @workspace/contracts
pnpm nx test @workspace/types
pnpm nx test @workspace/schemas
pnpm nx test @workspace/domain
pnpm nx test @workspace/db
pnpm nx test @workspace/application
pnpm nx test @workspace/data-access
pnpm nx test @workspace/game-server
pnpm nx test @workspace/game-h5
pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5
```

Expected: PASS。

**Step 2: Update story record**

回写任务勾选、完成说明、文件清单、变更日志与 `Status`。

**Step 3: Update sprint status**

把 `2-4-support-consumables-and-resource-deduction-flow` 更新为 `done`。
