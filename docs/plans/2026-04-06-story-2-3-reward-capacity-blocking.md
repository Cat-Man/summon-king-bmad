# Story 2.3 Reward Capacity Blocking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为《召唤之王》一期建立服务端权威的奖励入包校验链路，在背包容量不足时阻断奖励发放并给出可解释反馈。

**Architecture:** 先冻结 shared contract/type/schema，再在 server domain/db/application 中实现“受控奖励包 -> 容量校验 -> 成功发放或阻断 -> 审计记录”用例，最后把共享 H5 背包页接成最小奖励校验入口与阻断提示。整个链路不依赖战斗结算页，不把奖励真相交给客户端。

**Tech Stack:** TypeScript、Nx、NestJS、React 19、react-router-dom 6、Vitest、Jest、zod、CSS Modules

### Task 1: 冻结奖励领取共享契约

**Files:**
- Modify: `libs/shared/contracts/src/lib/contracts.ts`
- Modify: `libs/shared/contracts/src/lib/contracts.spec.ts`
- Modify: `libs/shared/types/src/lib/types.ts`
- Modify: `libs/shared/types/src/lib/types.spec.ts`
- Modify: `libs/shared/schemas/src/lib/schemas.ts`
- Modify: `libs/shared/schemas/src/lib/schemas.spec.ts`

**Step 1: Write the failing test**

覆盖：
- `REWARD_CLAIM_CONTRACT`
- 奖励领取请求与成功/阻断响应类型
- 容量阻断详情 schema

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/contracts
pnpm nx test @workspace/types
pnpm nx test @workspace/schemas
```

Expected: FAIL，因为奖励领取 contract/type/schema 还不存在。

### Task 2: 建立服务端奖励校验与审计用例

**Files:**
- Modify: `libs/server/domain/src/lib/domain.ts`
- Modify: `libs/server/domain/src/lib/domain.spec.ts`
- Modify: `libs/server/db/src/lib/db.ts`
- Modify: `libs/server/db/src/lib/db.spec.ts`
- Modify: `libs/server/application/src/lib/application.ts`
- Modify: `libs/server/application/src/lib/application.spec.ts`

**Step 1: Write the failing test**

覆盖：
- 小奖励成功入包
- 满包奖励被阻断
- 阻断时库存不变
- 成功和阻断都写入审计记录

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/domain
pnpm nx test @workspace/db
pnpm nx test @workspace/application
```

Expected: FAIL，因为当前没有 reward claim 用例和 audit repository。

### Task 3: 暴露正式奖励领取接口

**Files:**
- Create: `apps/game-server/src/modules/resource/resource.controller.ts`
- Create: `apps/game-server/src/modules/resource/resource.service.ts`
- Create: `apps/game-server/src/modules/resource/resource.module.ts`
- Create: `apps/game-server/src/modules/resource/resource.controller.spec.ts`
- Modify: `apps/game-server/src/app/app.module.ts`

**Step 1: Write the failing test**

覆盖：
- 成功奖励领取返回更新后的 inventory snapshot
- 容量不足返回稳定错误码与阻断详情
- 无效会话返回稳定失败

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/game-server
```

Expected: FAIL，因为 resource reward 接口还不存在。

### Task 4: 接入共享 H5 阻断反馈体验

**Files:**
- Modify: `libs/client/data-access/src/lib/data-access.ts`
- Modify: `libs/client/data-access/src/lib/data-access.spec.ts`
- Modify: `apps/game-h5/src/features/inventory/inventory-page.tsx`
- Modify: `apps/game-h5/src/features/inventory/inventory-page.spec.tsx`
- Modify: `apps/game-h5/src/app/app.tsx`
- Modify: `apps/game-h5/src/app/app.spec.tsx`
- Modify: `apps/game-h5/src/app/app.module.css`

**Step 1: Write the failing test**

覆盖：
- 背包页可触发受控奖励领取
- 奖励成功时页面显示成功反馈并刷新库存
- 容量不足时页面显示服务端阻断提示

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/data-access
pnpm nx test @workspace/game-h5
```

Expected: FAIL，因为 H5 还没有奖励领取入口和阻断反馈。

### Task 5: 全量验证与工件回写

**Files:**
- Modify: `_bmad-output/implementation-artifacts/2-3-implement-reward-capacity-check-and-blocking-feedback.md`
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

把 `2-3-implement-reward-capacity-check-and-blocking-feedback` 更新为 `done`。
