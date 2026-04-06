# Story 2.2: 交付背包页与资源总览体验

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 玩家，
I want 打开背包后能清楚查看自己拥有的资源、物品和存储状态，
so that 我能理解当前成长资源并准备后续养成或战斗。

## Acceptance Criteria

1. **Given** 玩家进入主界面  
   **When** 打开背包或资源相关入口  
   **Then** 页面展示当前基础资源总览与背包内容  
   **And** 信息来源于服务端返回的权威数据

2. **Given** 背包中存在不同类型物品  
   **When** 玩家浏览背包内容  
   **Then** 页面能以清晰方式区分物品类型、数量和基础说明  
   **And** 不展示延期系统的深层入口或无效操作

3. **Given** 玩家查看存储状态  
   **When** 页面渲染背包信息  
   **Then** 页面显示当前容量占用与可用空间  
   **And** 玩家能够理解哪些物品处于可用状态

## Tasks / Subtasks

- [x] 交付正式背包页与资源总览组件
  - [x] 在 `apps/game-h5/src/features/inventory` 建立正式 `inventory-page` 组件，而不是继续把 `/inventory` 保持为占位壳
  - [x] 页面至少展示基础资源总览、背包物品列表与容量摘要
  - [x] 页面文案和布局应帮助玩家理解“当前有哪些资源、背包里有什么、容量还剩多少”，而不是只展示原始 JSON 字段

- [x] 把 `/inventory` 路由切到权威库存数据
  - [x] `/inventory` 路由必须消费 Story 2.1 已建立的 inventory snapshot，而不是继续回退到 `playerInitSnapshot.resources`
  - [x] 如果权威 inventory snapshot 缺失，页面必须返回可解释的空态或恢复提示，不能白屏或静默展示假数据
  - [x] 本故事不引入背包整理、出售、入库、使用、丢弃等正式动作，只交付“读取与理解”体验

- [x] 清晰区分物品信息与一期边界
  - [x] 每个物品至少展示名称、类型、数量与简短说明/状态标签
  - [x] 页面可以按类型分组、按卡片区分或使用明显标签，但不得把延期系统入口混入背包页
  - [x] 若当前一期 starter 数据物品较少，页面仍需以可扩展方式组织，避免未来新增类型时推倒重来

- [x] 交付容量信息与空态反馈
  - [x] 页面明确展示背包已用格数、总格数和剩余格数
  - [x] 若背包为空或仅有最小 starter 物品，页面仍需给出可理解状态，而不是让玩家以为空数据是异常
  - [x] 本故事只展示容量状态，不提前实现 Story 2.3 的容量阻断处理逻辑

- [x] 完成最小可验证检查
  - [x] 为 `apps/game-h5/src/app/app.spec.tsx` 或 `features/inventory` 增加背包页行为测试，验证资源、物品、容量与空态展示
  - [x] 如新增 `inventory-page.tsx` 或其辅助函数，为其增加最小单测，验证物品分组/渲染不会混淆
  - [x] 运行 `@workspace/game-h5` 测试与相关 typecheck，证明 Story 2.1 的权威 inventory 链路未被回归破坏

## Dev Notes

### Technical Requirements

- 本故事覆盖 PRD 中的 `FR13`、`FR14`、`FR15`、`FR16` 与 `NFR16`，目标是把 Story 2.1 的权威库存模型真正交付为玩家可理解的背包页。  
  [Source: _bmad-output/planning-artifacts/prd.md#背包与资源管理]  
  [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- 背包与资源页面不仅承担查看功能，还应承担帮助玩家理解当前成长状态的职责，因此页面必须同时呈现资源、物品与容量，而不是只做单列表。  
  [Source: _bmad-output/planning-artifacts/prd.md#存储与资源系统要求]
- 本故事不负责奖励入包阻断、消耗品扣减、出售或整理动作，这些分别属于 Story 2.3 和 2.4。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3: 实现奖励入包校验与容量阻断反馈]  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4: 支持可消耗物品与基础资源扣减链路]

### Architecture Compliance

- 前端正式落点应对齐 `apps/game-h5/src/features/inventory`，架构中也已明确建议前端文件为 `inventory-page.tsx`。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- 路由策略要求使用正式路由管理主界面、背包、幻兽、战斗与成长页面流转，因此本故事应升级 `/inventory` 正式内容，而不是继续停留在通用入口壳。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- 不允许把背包权威状态长期复制为新的本地真相；当前实现应继续依赖 Story 2.1 已同步的 inventory snapshot 窄边界。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]

### Library / Framework Requirements

- 当前实际前端基线仍为 `React 19`、`react-router-dom 6.30.3`、`Vitest`，本故事继续沿用，不引入新的前端状态框架。  
  [Source: package.json]
- 页面组件层不得直接碰宿主 API，也不新增平台分叉；网页端与微信小程序壳继续共享同一 H5 背包页面。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]

### File Structure Requirements

- 优先修改或新增的文件应集中在：
  - `apps/game-h5/src/app/app.tsx`
  - `apps/game-h5/src/app/app.spec.tsx`
  - `apps/game-h5/src/app/app.module.css`
  - `apps/game-h5/src/features/inventory/inventory-page.tsx`
  - `apps/game-h5/src/features/inventory/inventory-page.spec.tsx`
  - `apps/game-h5/src/features/inventory/**`
- 当前 `apps/game-h5/src/features/inventory/` 仍为空目录，占位已足够；本故事应把它变成正式页面组件位置。  
  [Source: apps/game-h5/src/features/inventory]

### Testing Requirements

- 必须遵守 TDD，先让背包页行为测试失败，再补实现。  
  [Source: _bmad-output/project-context.md#测试规则]
- 最少覆盖以下验证：
  - `/inventory` 展示权威资源总览，而不是 init 占位摘要
  - 页面展示物品名称、类型、数量和简短说明/标签
  - 页面展示已用/总量/剩余容量
  - 背包空态可理解，不出现白屏
  - 主界面与其他一期入口、延期入口治理不被回归破坏
- 建议至少运行：
  - `pnpm nx test @workspace/game-h5`
  - `pnpm nx run @workspace/game-h5:typecheck`

### Previous Story Intelligence

- Story 1.5 已将 `/inventory` 路由建立为一期核心入口，但目前仍只是上下文占位；Story 2.2 正是把这个入口变成正式背包页。  
  [Source: _bmad-output/implementation-artifacts/1-5-deliver-home-guidance-and-deferred-entry-governance.md]
- Story 2.1 已把 inventory snapshot 建成权威来源，并在启动链路中完成同步；本故事必须直接消费这份 snapshot，而不是重新请求或回退到假数据。  
  [Source: _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md]
- 旧 `htmlgame` 的背包页和 `api-adapter` 仅可参考“背包 + 分类 + 列表”的表现思路与术语，不可沿用其 DOM 结构、全局脚本和演示接口。  
  [Source: htmlgame/game.html]  
  [Source: htmlgame/client/api-adapter.js]

### Latest Tech Information

- 当前 `App` 在 ready 态下已经有正式路由结构，替换 `/inventory` 页面不会影响 session/bootstrap 链路。  
  [Source: apps/game-h5/src/app/app.tsx]
- 当前 `libs/client/state` 已有 `getInventorySnapshot()`，说明本故事可以直接读取库存快照，不需要再发明第二套背包状态。  
  [Source: libs/client/state/src/lib/state.ts]
- 当前 starter inventory 至少已有基础资源、`回城符` 和独立容量信息，足够支撑第一页正式背包总览。  
  [Source: libs/server/domain/src/lib/domain.ts]

### Project Context Reference

- 一期核心域必须围绕账号与角色初始化、主界面导航、背包、幻兽、基础战斗循环和基础资源成长展开；背包页属于当前主线，不应再拖延。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]
- 旧 `htmlgame` 仅作素材、布局和术语映射参考；正式页面必须延续当前 React/Nx 骨架。  
  [Source: _bmad-output/project-context.md#新构建基线]
- 聊天、交易、联盟、VIP、商城等后续系统仍需保持延期治理边界，不能借背包页混入无效入口。  
  [Source: _bmad-output/project-context.md#关键红线规则]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2: 交付背包页与资源总览体验]
- [Source: _bmad-output/planning-artifacts/prd.md#背包与资源管理]
- [Source: _bmad-output/planning-artifacts/prd.md#存储与资源系统要求]
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/project-context.md#测试规则]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#关键红线规则]
- [Source: _bmad-output/implementation-artifacts/1-5-deliver-home-guidance-and-deferred-entry-governance.md]
- [Source: _bmad-output/implementation-artifacts/2-1-build-authoritative-inventory-and-resource-model.md]
- [Source: htmlgame/game.html]
- [Source: htmlgame/client/api-adapter.js]
- [Source: 布局图/背包.png]
- [Source: apps/game-h5/src/app/app.tsx]
- [Source: libs/client/state/src/lib/state.ts]
- [Source: libs/server/domain/src/lib/domain.ts]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Story context engine analysis for Story 2.2 completed
- `pnpm nx test @workspace/game-h5`
- `pnpm nx run @workspace/game-h5:typecheck`

### Completion Notes List

- 已在 `apps/game-h5/src/features/inventory/inventory-page.tsx` 交付正式背包页，展示基础资源、容量摘要和物品卡片，替代原 `/inventory` 占位内容。
- `/inventory` 已改为直接消费 Story 2.1 的权威 `inventory snapshot`；若快照缺失，页面显示可解释兜底，不回退到本地假库存。
- 已补充 `InventoryPage` 与 `App` 路由测试，覆盖资源、物品、容量与空态展示，并确认当前故事只交付“读取与理解”体验。
- 已验证 `pnpm nx test @workspace/game-h5` 与 `pnpm nx run @workspace/game-h5:typecheck` 通过。

### File List

- apps/game-h5/src/app/app.module.css
- apps/game-h5/src/app/app.spec.tsx
- apps/game-h5/src/app/app.tsx
- apps/game-h5/src/features/inventory/inventory-page.spec.tsx
- apps/game-h5/src/features/inventory/inventory-page.tsx
- _bmad-output/implementation-artifacts/2-2-deliver-bag-and-resource-overview.md

### Change Log

- 2026-04-06: 初始创建 Story 2.2，上下文已补齐，可直接进入开发
- 2026-04-06: 完成交付背包页与资源总览体验，验证测试与 typecheck 通过，状态更新为 done
