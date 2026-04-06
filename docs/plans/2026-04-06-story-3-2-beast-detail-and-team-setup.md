# Story 3.2 Beast Detail And Team Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为《召唤之王》一期建立正式的幻兽详情读取与默认队伍配置链路，让共享 H5 可以从列表进入详情，并通过服务端权威写入切换默认出战幻兽。

**Architecture:** 继续沿用现有 `beast` 领域边界，在 shared contract/type/schema 先冻结 detail 与 team setup 协议，再在 server application 和 Nest beast 模块中实现最小读写用例。默认队伍继续作为一期唯一的当前出战队伍，写入优先复用 `PlayerInitializationRepository` 的完整快照保存，不提前拆独立幻兽仓储或多队伍模型。

**Tech Stack:** TypeScript、Nx、NestJS、React 19、react-router-dom 6、Vitest、Jest、zod、CSS Modules

### Task 1: 冻结 beast detail 与 default team setup 共享契约

**Files:**
- Modify: `libs/shared/contracts/src/lib/contracts.ts`
- Modify: `libs/shared/contracts/src/lib/contracts.spec.ts`
- Modify: `libs/shared/types/src/lib/types.ts`
- Modify: `libs/shared/types/src/lib/types.spec.ts`
- Modify: `libs/shared/schemas/src/lib/schemas.ts`
- Modify: `libs/shared/schemas/src/lib/schemas.spec.ts`

**Step 1: Write the failing test**

覆盖：
- `BEAST_DETAIL_CONTRACT`
- `DEFAULT_TEAM_SETUP_CONTRACT`
- 幻兽详情请求/成功/失败响应
- 默认队伍配置请求/成功/失败响应
- 一期详情字段与默认队伍摘要字段

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/contracts
pnpm nx test @workspace/types
pnpm nx test @workspace/schemas
```

Expected: FAIL，因为当前还没有正式 beast detail / team setup 共享协议。

### Task 2: 建立服务端幻兽详情与默认队伍配置用例

**Files:**
- Modify: `libs/server/application/src/lib/application.ts`
- Modify: `libs/server/application/src/lib/application.spec.ts`

**Step 1: Write the failing test**

覆盖：
- 有效会话读取指定幻兽详情
- 详情返回包含默认队伍关系与当前队伍摘要
- 默认队伍配置成功后，详情和列表都立即反映新状态
- 非法配置稳定失败，不写入半状态

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/application
```

Expected: FAIL，因为当前还没有 beast detail / default team setup 用例。

### Task 3: 暴露正式 beast detail 与 default team setup 接口

**Files:**
- Modify: `apps/game-server/src/modules/beast/beast.controller.ts`
- Modify: `apps/game-server/src/modules/beast/beast.service.ts`
- Modify: `apps/game-server/src/modules/beast/beast.controller.spec.ts`

**Step 1: Write the failing test**

覆盖：
- `GET /api/v1/beast/:beastInstanceId` 成功读取详情
- `POST /api/v1/beast/team/default` 成功切换默认队伍
- 非法配置返回稳定失败 payload
- 配置完成后再次读取详情/列表能看到更新后的权威状态

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/game-server
```

Expected: FAIL，因为当前 beast 模块只支持列表读取。

### Task 4: 接入共享 H5 幻兽详情页与最小队伍配置交互

**Files:**
- Modify: `libs/client/data-access/src/lib/data-access.ts`
- Modify: `libs/client/data-access/src/lib/data-access.spec.ts`
- Modify: `apps/game-h5/src/features/beast/beast-list-page.tsx`
- Create: `apps/game-h5/src/features/beast/beast-detail-page.tsx`
- Create: `apps/game-h5/src/features/beast/beast-detail-page.spec.tsx`
- Modify: `apps/game-h5/src/app/app.tsx`
- Modify: `apps/game-h5/src/app/app.spec.tsx`

**Step 1: Write the failing test**

覆盖：
- 幻兽列表能进入 `/beasts/:beastInstanceId`
- 详情页通过正式接口读取详情
- 详情页可提交默认队伍配置
- 成功后展示明确反馈
- 失败时展示服务端错误文案

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/data-access
pnpm nx test @workspace/game-h5
```

Expected: FAIL，因为当前没有 beast detail data-access、详情页和默认队伍配置交互。

### Task 5: 全量验证与工件回写

**Files:**
- Modify: `_bmad-output/implementation-artifacts/3-2-deliver-beast-detail-and-team-setup.md`
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

把 `3-2-deliver-beast-detail-and-team-setup` 更新为 `done`。
