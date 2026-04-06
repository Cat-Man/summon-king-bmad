# Story 2.1 Authoritative Inventory Model Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为《召唤之王》一期建立独立的权威库存模型，让基础资源、背包物品和容量信息由服务端维护，并允许共享 H5 通过统一 contract 读取。

**Architecture:** 先冻结 shared contract 与 server/client 行为测试，再新增 inventory 域模型与独立仓储。随后把角色初始化链路扩展为“初始化角色后同步库存快照”，最后通过 game-server 与 game-h5 测试验证权威读取链路成立，同时不把库存真相回退到本地缓存。

**Tech Stack:** TypeScript、Nx、NestJS、React、Vitest、Jest、zod

### Task 1: 冻结 shared inventory contract

**Files:**
- Modify: `libs/shared/contracts/src/lib/contracts.ts`
- Modify: `libs/shared/contracts/src/lib/contracts.spec.ts`
- Modify: `libs/shared/types/src/lib/types.ts`
- Modify: `libs/shared/types/src/lib/types.spec.ts`
- Modify: `libs/shared/schemas/src/lib/schemas.ts`
- Modify: `libs/shared/schemas/src/lib/schemas.spec.ts`

**Step 1: Write the failing test**

先给 shared 层增加失败测试，覆盖：
- `INVENTORY_SNAPSHOT_CONTRACT`
- inventory request/response 类型
- schema 能区分 `resources`、`bag.items`、`bag.capacity`

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/contracts
pnpm nx test @workspace/types
pnpm nx test @workspace/schemas
```

Expected: FAIL，因为 inventory contract/type/schema 还不存在。

**Step 3: Write minimal implementation**

新增 inventory contract helper 与最小共享类型、schema，保持与现有 `session/auth`、`player/init` 风格一致。

**Step 4: Run test to verify it passes**

Run 同上三条命令，期望全部 PASS。

### Task 2: 建立独立库存域模型与仓储

**Files:**
- Modify: `libs/server/domain/src/lib/domain.ts`
- Modify: `libs/server/domain/src/lib/domain.spec.ts`
- Modify: `libs/server/db/src/lib/db.ts`
- Modify: `libs/server/db/src/lib/db.spec.ts`
- Modify: `libs/server/application/src/lib/application.ts`
- Modify: `libs/server/application/src/lib/application.spec.ts`

**Step 1: Write the failing test**

新增失败测试，覆盖：
- starter inventory 生成时资源与背包独立
- 仓储内部独立保存资源态与背包态
- 重复初始化不会重复生成库存

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/domain
pnpm nx test @workspace/db
pnpm nx test @workspace/application
```

Expected: FAIL，因为当前只有 player init snapshot，没有 inventory 域。

**Step 3: Write minimal implementation**

增加 starter inventory builder、独立 inventory repository，并让 player initialization service 在首次创建角色时同步落账库存。

**Step 4: Run test to verify it passes**

Run 同上三条命令，期望全部 PASS。

### Task 3: 暴露正式 inventory 读取接口

**Files:**
- Create: `apps/game-server/src/modules/inventory/inventory.controller.ts`
- Create: `apps/game-server/src/modules/inventory/inventory.service.ts`
- Create: `apps/game-server/src/modules/inventory/inventory.module.ts`
- Create: `apps/game-server/src/modules/inventory/inventory.controller.spec.ts`
- Modify: `apps/game-server/src/app/app.module.ts`
- Modify: `apps/game-server/src/modules/player/player.module.ts`
- Modify: `apps/game-server/src/modules/player/player.service.ts`
- Modify: `apps/game-server/src/modules/player/player.controller.spec.ts`

**Step 1: Write the failing test**

为 game-server 增加失败测试，覆盖：
- `GET /api/v1/inventory` 能返回权威库存快照
- header 中 session token 无效时返回稳定错误
- 初始化后的 inventory snapshot 与 player init starter state 一致

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/game-server
```

Expected: FAIL，因为 inventory module 和接口还不存在。

**Step 3: Write minimal implementation**

新增 inventory 模块并复用现有 session 校验边界，不创建平台分叉或本地真相旁路。

**Step 4: Run test to verify it passes**

Run:
```bash
pnpm nx test @workspace/game-server
```

Expected: PASS。

### Task 4: 接入客户端读取与最小状态

**Files:**
- Modify: `libs/client/data-access/src/lib/data-access.ts`
- Modify: `libs/client/data-access/src/lib/data-access.spec.ts`
- Modify: `libs/client/state/src/lib/state.ts`
- Modify: `libs/client/state/src/lib/state.spec.ts`
- Create: `apps/game-h5/src/bootstrap/initialize-inventory.ts`
- Create: `apps/game-h5/src/bootstrap/initialize-inventory.spec.ts`
- Modify: `apps/game-h5/src/bootstrap/init-app.ts`
- Modify: `apps/game-h5/src/bootstrap/init-app.spec.ts`

**Step 1: Write the failing test**

新增失败测试，覆盖：
- data-access 会调用 inventory contract
- inventory snapshot 能被持久化/清理
- app bootstrap 在角色初始化后继续请求库存快照

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/data-access
pnpm nx test @workspace/state
pnpm nx test @workspace/game-h5
```

Expected: FAIL，因为客户端 inventory 读取链路还不存在。

**Step 3: Write minimal implementation**

增加 `fetchInventorySnapshot`、最小 inventory state，以及 bootstrap 内的库存同步步骤。

**Step 4: Run test to verify it passes**

Run 同上三条命令，期望全部 PASS。

### Task 5: 全量回归与故事回写

**Files:**
- Modify: `_bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md`
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
pnpm nx test @workspace/state
pnpm nx test @workspace/game-server
pnpm nx test @workspace/game-h5
pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/domain,@workspace/db,@workspace/application,@workspace/data-access,@workspace/state,@workspace/game-server,@workspace/game-h5
```

Expected: PASS。

**Step 2: Update story record**

回写 story 的任务勾选、完成说明、文件清单、变更日志与 `Status`。

**Step 3: Update sprint status**

把 `2-1-build-authoritative-inventory-and-resource-model` 更新为 `done`，并同步 `last_updated`。
