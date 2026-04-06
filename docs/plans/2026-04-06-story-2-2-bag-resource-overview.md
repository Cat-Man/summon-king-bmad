# Story 2.2 Bag Resource Overview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把 `/inventory` 从占位入口升级为正式背包页，展示权威资源、物品与容量信息，帮助玩家理解当前成长状态。

**Architecture:** 先用前端行为测试冻结背包页的资源总览、物品展示、容量摘要和空态，再在 `apps/game-h5/src/features/inventory` 建立正式页面组件，并把 `/inventory` 路由切到 Story 2.1 的 inventory snapshot。实现保持只读展示，不提前进入整理、出售、使用或容量阻断逻辑。

**Tech Stack:** React 19、react-router-dom 6、Vitest、Testing Library、CSS Modules、TypeScript

### Task 1: 冻结 Story 2.2 行为测试

**Files:**
- Modify: `apps/game-h5/src/app/app.spec.tsx`
- Create: `apps/game-h5/src/features/inventory/inventory-page.spec.tsx`

**Step 1: Write the failing test**

覆盖以下行为：
- `/inventory` 展示权威资源总览
- 页面展示物品名称、类型、数量与容量信息
- 空背包快照展示可理解空态

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm nx test @workspace/game-h5
```

Expected: FAIL，因为当前 `/inventory` 仍是占位壳，正式背包页组件还不存在。

### Task 2: 实现 inventory page 正式组件

**Files:**
- Create: `apps/game-h5/src/features/inventory/inventory-page.tsx`
- Modify: `apps/game-h5/src/app/app.tsx`
- Modify: `apps/game-h5/src/app/app.module.css`

**Step 1: Write minimal implementation**

实现：
- 资源总览区
- 背包容量摘要
- 物品列表或空态
- 返回主界面入口

**Step 2: Run test to verify it passes**

Run:
```bash
pnpm nx test @workspace/game-h5
```

Expected: PASS。

### Task 3: 回归验证与文档回写

**Files:**
- Modify: `_bmad-output/implementation-artifacts/2-2-deliver-bag-and-resource-overview.md`
- Modify: `_bmad-output/implementation-artifacts/sprint-status.yaml`

**Step 1: Run verification**

Run:
```bash
pnpm nx test @workspace/game-h5
pnpm nx run @workspace/game-h5:typecheck
```

Expected: PASS。

**Step 2: Update story record**

回写任务勾选、完成说明、文件清单与变更日志。

**Step 3: Update sprint status**

把 `2-2-deliver-bag-and-resource-overview` 标记为 `done`。
