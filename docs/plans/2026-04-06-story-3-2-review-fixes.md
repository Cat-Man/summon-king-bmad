# Story 3.2 Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 Story 3.2 在 code review 中暴露的默认队伍同步问题，确保幻兽详情页切换出战后会同步共享玩家快照，并且列表页在权威刷新失败时仍以最新共享快照为回退基线。

**Architecture:** 保持现有共享 H5 + 全局内存态方案，不新增额外状态管理框架。通过为 `PlayerInitSnapshot` 增加订阅能力，让 `App` 能感知快照更新并重新向各路由分发最新初始数据；幻兽详情页成功切换默认队伍后只回写最小必要字段，不引入新的 beast store。

**Tech Stack:** TypeScript、React 19、react-router-dom 6、Vitest、Testing Library

### Task 1: 建立玩家初始化快照的可订阅更新能力

**Files:**
- Modify: `libs/client/state/src/lib/state.ts`
- Modify: `libs/client/state/src/lib/state.spec.ts`

**Step 1: Write the failing test**

覆盖：
- `setPlayerInitSnapshot` 会通知订阅者
- `clearPlayerInitSnapshot` 会通知订阅者

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/state --runInBand
```

Expected: FAIL，因为当前玩家初始化快照还没有独立订阅通道。

### Task 2: 让 App 随共享玩家快照更新重新分发路由输入

**Files:**
- Modify: `apps/game-h5/src/app/app.tsx`
- Modify: `apps/game-h5/src/app/app.spec.tsx`

**Step 1: Write the failing test**

覆盖：
- ready 态下更新 `PlayerInitSnapshot` 后，主界面和幻兽列表使用最新默认队伍信息
- 详情页切换成功后，再进入列表时即使列表接口失败，也不会回退显示旧默认队伍标记

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/game-h5 --runInBand
```

Expected: FAIL，因为当前 `App` 只读取一次初始化快照，不会随全局快照变化而重新渲染。

### Task 3: 详情页成功切换默认队伍后回写共享玩家快照

**Files:**
- Modify: `apps/game-h5/src/features/beast/beast-detail-page.tsx`
- Modify: `apps/game-h5/src/features/beast/beast-detail-page.spec.tsx`

**Step 1: Write the failing test**

覆盖：
- 默认队伍切换成功时，会把共享玩家快照中的 `defaultTeam` 和各幻兽的队伍归属同步到最新值
- 失败时不污染共享玩家快照

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/game-h5 --runInBand
```

Expected: FAIL，因为当前详情页只更新本地组件状态。

### Task 4: 全量验证与工件回写

**Files:**
- Modify: `_bmad-output/implementation-artifacts/3-2-deliver-beast-detail-and-team-setup.md`

**Step 1: Run verification**

Run:
```bash
pnpm nx test @workspace/state
pnpm nx test @workspace/game-h5
pnpm nx run-many -t typecheck -p @workspace/state,@workspace/game-h5
```

Expected: PASS。

**Step 2: Update story record**

补充本轮 review 修复说明、验证记录与状态备注。
