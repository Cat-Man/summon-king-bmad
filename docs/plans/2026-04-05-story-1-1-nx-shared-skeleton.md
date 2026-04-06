# Story 1.1 Nx Shared Skeleton Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在当前仓库根目录建立不嵌套二层产品目录的 Nx 正式工作区，并补齐一期共享 H5、Nest 服务端与共享边界骨架。

**Architecture:** 先用 Node 内建测试验证目标结构并故意失败，再通过临时目录生成 Nx React/Vite 工作区后合并回当前根目录。随后接入 Nest 应用、共享库、平台库与一期核心目录，最后用 Nx 项目识别与默认 target 做回归验证。

**Tech Stack:** Node 24、pnpm 10、Nx、React/Vite、Vitest、Playwright、NestJS、Prisma 目录骨架

### Task 1: 验证与落位策略

**Files:**
- Create: `tools/tests/workspace-skeleton.test.mjs`
- Modify: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Test: `tools/tests/workspace-skeleton.test.mjs`

**Step 1: Write the failing test**

写一个基于 `node:test` 的结构验证脚本，校验以下事实：
- 根目录存在 `nx.json`、`package.json`、`pnpm-workspace.yaml`
- 存在 `apps/game-h5`、`apps/game-server`
- 存在 `libs/shared/contracts`、`libs/shared/schemas`、`libs/shared/types`
- 存在 `libs/platform/bridge`、`libs/platform/web-adapter`、`libs/platform/wechat-adapter`
- 存在 `libs/client/*`、`libs/server/*`、`libs/shared/reference-data`、`docs/source-mapping`
- 不存在二层正式工程根目录

**Step 2: Run test to verify it fails**

Run: `node --test tools/tests/workspace-skeleton.test.mjs`
Expected: FAIL，因为 Nx 工作区与目标目录尚未存在。

### Task 2: 生成并合并 Nx 工作区

**Files:**
- Create: `package.json`
- Create: `nx.json`
- Create: `pnpm-workspace.yaml`
- Create: `apps/game-h5/*`
- Modify: `.gitignore`（如生成）
- Test: `node --test tools/tests/workspace-skeleton.test.mjs`

**Step 1: Generate workspace in temp directory**

Run:
```bash
pnpm dlx create-nx-workspace@latest sk-tmp \
  --preset=react-monorepo \
  --appName=game-h5 \
  --bundler=vite \
  --style=css \
  --unitTestRunner=vitest \
  --e2eTestRunner=playwright \
  --packageManager=pnpm \
  --nxCloud=skip \
  --skipGit \
  --interactive=false
```

**Step 2: Merge generated workspace back to repo root**

保留 `_bmad-output/`、`htmlgame/`、`布局图/`、`召唤之王/`、现有 `docs/`，只把 Nx 正式工程文件与 `apps/libs/tools` 合并回根目录。

**Step 3: Run test again**

Run: `node --test tools/tests/workspace-skeleton.test.mjs`
Expected: 仍失败，因为 `game-server` 与共享骨架尚未补齐。

### Task 3: 接入服务端与共享边界

**Files:**
- Create: `apps/game-server/*`
- Create: `libs/shared/contracts/*`
- Create: `libs/shared/schemas/*`
- Create: `libs/shared/types/*`
- Create: `libs/platform/bridge/*`
- Create: `libs/platform/web-adapter/*`
- Create: `libs/platform/wechat-adapter/*`

**Step 1: Add Nest support and generate application**

使用 Nx 官方 Nest 插件接入 `game-server`，并建立 `src/modules`、`prisma` 基础位置。

**Step 2: Generate minimal shared/platform libraries**

使用 Nx 生成最小 TS 库，确保能被 project graph 识别。

**Step 3: Run test again**

Run: `node --test tools/tests/workspace-skeleton.test.mjs`
Expected: 仍可能失败，因为一期核心域目录与参考映射目录尚未补齐。

### Task 4: 补齐一期核心域与参考映射目录

**Files:**
- Create: `apps/game-h5/src/bootstrap/.gitkeep`
- Create: `apps/game-h5/src/routes/.gitkeep`
- Create: `apps/game-h5/src/features/init/.gitkeep`
- Create: `apps/game-h5/src/features/main-hub/.gitkeep`
- Create: `apps/game-h5/src/features/inventory/.gitkeep`
- Create: `apps/game-h5/src/features/beast/.gitkeep`
- Create: `apps/game-h5/src/features/battle/.gitkeep`
- Create: `apps/game-h5/src/features/growth/.gitkeep`
- Create: `apps/game-server/src/modules/*/.gitkeep`
- Create: `libs/client/*`
- Create: `libs/server/*`
- Create: `libs/shared/reference-data/README.md`
- Create: `docs/source-mapping/README.md`

**Step 1: Create only MVP boundary directories**

只创建一期目录，不创建聊天、交易、联盟、VIP、商城目录。

**Step 2: Run test to verify it passes**

Run: `node --test tools/tests/workspace-skeleton.test.mjs`
Expected: PASS。

### Task 5: 安装与回归验证

**Files:**
- Modify: `_bmad-output/implementation-artifacts/1-1-init-nx-workspace-and-shared-skeleton.md`
- Modify: `_bmad-output/implementation-artifacts/sprint-status.yaml`

**Step 1: Install dependencies**

Run: `pnpm install`
Expected: 成功完成依赖安装。

**Step 2: Verify workspace recognition**

Run: `pnpm nx show projects`
Expected: 至少能识别 `game-h5`、`game-server` 与已生成的共享/平台库。

**Step 3: Verify default targets**

Run:
```bash
pnpm nx test game-h5
pnpm nx show project game-server
```

Expected:
- `game-h5` 默认测试 target 可运行
- `game-server` target 至少被 Nx 识别

**Step 4: Update story record**

回写 story 中的任务勾选、完成说明、文件清单与变更日志。
