# Story 3.1 Beast List Query Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为《召唤之王》一期建立服务端权威的幻兽实例列表读取链路，让共享 H5 的 `/beasts` 页面从占位入口升级为正式列表页。

**Architecture:** 先冻结 shared beast list contract/type/schema，再在 server application + beast module 中实现只读查询，优先复用现有初始化后的玩家态作为权威幻兽来源。最后把 H5 `/beasts` 路由接成正式列表页，只展示一期基础字段，不提前展开详情、编队与养成写逻辑。

**Tech Stack:** TypeScript、Nx、NestJS、React 19、react-router-dom 6、Vitest、Jest、zod、CSS Modules

### Task 1: 冻结 beast list 共享契约

**Files:**
- Modify: `libs/shared/contracts/src/lib/contracts.ts`
- Modify: `libs/shared/contracts/src/lib/contracts.spec.ts`
- Modify: `libs/shared/types/src/lib/types.ts`
- Modify: `libs/shared/types/src/lib/types.spec.ts`
- Modify: `libs/shared/schemas/src/lib/schemas.ts`
- Modify: `libs/shared/schemas/src/lib/schemas.spec.ts`

**Step 1: Write the failing test**

覆盖：
- `BEAST_LIST_CONTRACT`
- 幻兽列表请求与成功/失败响应
- 一期最小幻兽实例字段

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/contracts
pnpm nx test @workspace/types
pnpm nx test @workspace/schemas
```

Expected: FAIL，因为当前没有正式 beast list 共享契约。

### Task 2: 建立服务端幻兽列表查询用例

**Files:**
- Modify: `libs/server/application/src/lib/application.ts`
- Modify: `libs/server/application/src/lib/application.spec.ts`

**Step 1: Write the failing test**

覆盖：
- 有效会话成功返回当前幻兽实例列表
- 重复读取返回一致权威状态
- 无效会话或缺失状态返回稳定失败

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/application
```

Expected: FAIL，因为当前还没有 beast list 查询用例。

### Task 3: 暴露正式 beast 列表接口

**Files:**
- Create: `apps/game-server/src/modules/beast/beast.controller.ts`
- Create: `apps/game-server/src/modules/beast/beast.service.ts`
- Create: `apps/game-server/src/modules/beast/beast.module.ts`
- Create: `apps/game-server/src/modules/beast/beast.controller.spec.ts`
- Modify: `apps/game-server/src/app/app.module.ts`

**Step 1: Write the failing test**

覆盖：
- 幻兽列表读取成功返回正式 payload
- 无效会话返回稳定失败
- 重复请求结果一致

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/game-server
```

Expected: FAIL，因为当前没有 beast 模块和正式接口。

### Task 4: 接入共享 H5 幻兽列表页

**Files:**
- Modify: `libs/client/data-access/src/lib/data-access.ts`
- Modify: `libs/client/data-access/src/lib/data-access.spec.ts`
- Create: `apps/game-h5/src/features/beast/beast-list-page.tsx`
- Create: `apps/game-h5/src/features/beast/beast-list-page.spec.tsx`
- Modify: `apps/game-h5/src/app/app.tsx`
- Modify: `apps/game-h5/src/app/app.spec.tsx`
- Modify: `apps/game-h5/src/app/app.module.css`

**Step 1: Write the failing test**

覆盖：
- `/beasts` 进入后正式请求服务端 beast list
- 页面展示幻兽名、等级、定位、是否在默认队伍中
- 失败时展示清晰错误提示

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/data-access
pnpm nx test @workspace/game-h5
```

Expected: FAIL，因为当前 `/beasts` 还是占位页。

### Task 5: 全量验证与工件回写

**Files:**
- Modify: `_bmad-output/implementation-artifacts/3-1-build-beast-instance-model-and-list-query.md`
- Modify: `_bmad-output/implementation-artifacts/sprint-status.yaml`

**Step 1: Run verification**

Run:
```bash
pnpm nx run-many -t test -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5
pnpm nx run-many -t typecheck -p @workspace/contracts,@workspace/types,@workspace/schemas,@workspace/application,@workspace/data-access,@workspace/game-server,@workspace/game-h5
```

Expected: PASS。

**Step 2: Update story record**

回写任务勾选、完成说明、文件清单、变更日志与 `Status`。

**Step 3: Update sprint status**

把 `3-1-build-beast-instance-model-and-list-query` 更新为 `done`。
