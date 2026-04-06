# Story 1.5: 交付主界面首轮引导与延期入口治理

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 新玩家，
I want 在主界面清楚看到当前可玩的核心入口和下一步目标，
so that 我能理解该去背包、幻兽还是战斗，并且不会被延期系统干扰。

## Acceptance Criteria

1. **Given** 玩家完成初始化并进入主界面  
   **When** 主界面首次展示  
   **Then** 页面展示背包、幻兽、战斗三个一期核心入口  
   **And** 当前最优先动作以显式按钮、提示条或推荐区形式出现

2. **Given** 一期存在未开放系统  
   **When** 玩家查看主界面入口  
   **Then** 延期系统入口被隐藏、置灰或明确标识未开放  
   **And** 同一入口状态在主界面与相关跳转路径中保持一致

3. **Given** 玩家首次进入主界面  
   **When** 系统需要帮助其理解主循环  
   **Then** 页面给出首轮引导、奖励提示或下一步成长建议  
   **And** 至少提供一个可直接触发的后续动作，例如“前往幻兽”“前往背包”或“前往挑战”

## Tasks / Subtasks

- [x] 交付主界面就绪态与最小正式路由壳
  - [x] 将 Story 1.4 的“就绪交接占位”升级为正式主界面壳，在 `ready` 状态下渲染主界面而不是单纯提示后续故事
  - [x] 使用现有 `BrowserRouter` 边界建立最小正式路由，至少支持主界面首页与背包、幻兽、战斗三个一期核心入口路由
  - [x] 本故事中的核心入口页面只交付导航壳、上下文提示或最小占位，不提前展开 Story 2/3/4 的正式业务实现

- [x] 交付首轮引导、推荐动作与主循环认知
  - [x] 在主界面展示基于权威初始化快照的角色摘要、初始资源/幻兽摘要与当前推荐动作
  - [x] 推荐动作必须显式可触发，至少提供一个可进入核心入口的 CTA，例如“前往幻兽”
  - [x] 引导文案应帮助玩家理解“一期主循环”是“查看当前状态 -> 执行养成/准备 -> 后续进入战斗”，但不得伪造未实现的服务端结果

- [x] 完成延期入口治理与相关路径一致性
  - [x] 在主界面明确区分一期核心入口与延期系统入口，延期入口可以置灰、标记“未开放”或进入统一关闭态
  - [x] 延期入口至少覆盖聊天、交易、联盟、VIP、商城这一组后续系统，不得在本故事中挂半逻辑
  - [x] 若玩家直接访问延期入口相关路径，页面必须返回与主界面一致的“未开放”状态，而不是空白页、404 或误导性可用态

- [x] 守住共享 H5 和服务端权威边界
  - [x] 主界面与引导只消费 Story 1.3 已落地的服务端初始化快照，不得在客户端本地拼装假背包、假战斗进度或本地时间驱动提示
  - [x] 宿主差异仍只能停留在 `platform-bridge` / adapter 边界，本故事不得在主界面里新增平台专属分支
  - [x] 不在本故事引入聊天、交易、联盟、VIP、商城、支付、分享、完整背包实现、完整幻兽实现、正式战斗流程或新的后端接口

- [x] 完成最小可验证检查
  - [x] 为 `apps/game-h5/src/app/app.spec.tsx` 增加主界面渲染与导航测试，验证核心入口、推荐动作与延期入口状态
  - [x] 如拆出主界面配置或路由辅助模块，为其增加最小单测，验证核心入口与延期入口配置不会混淆
  - [x] 运行 `@workspace/game-h5` 测试与类型检查，证明 Story 1.4 的启动反馈未被回归破坏

## Dev Notes

### Technical Requirements

- 本故事覆盖 PRD 中的 `FR7`、`FR8`、`FR9`、`FR10`、`FR11`、`FR12`，是 Epic 1 中把“已完成初始化”转成“玩家知道下一步做什么”的收口故事。  
  [Source: _bmad-output/planning-artifacts/prd.md#主界面与成长引导]
- 玩家首次进入后应直接感知一期核心玩法，而不是先被延期系统打断，因此主界面必须突出一期核心入口，同时治理延期入口。  
  [Source: _bmad-output/planning-artifacts/prd.md#账号与角色起步]  
  [Source: _bmad-output/planning-artifacts/prd.md#主界面与成长引导]
- 本故事不负责正式背包、幻兽、战斗业务数据读写；它只建立主界面导航壳和首轮引导，把后续 Epic 2/3/4 的入口组织起来。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5: 交付主界面首轮引导与延期入口治理]

### Architecture Compliance

- 路由策略要求主界面、背包、幻兽、战斗使用正式路由组织，延期系统入口只保留显式占位或关闭态，不挂半逻辑。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- `主界面与成长引导` 的前端落点应对齐 `apps/game-h5/src/features/main-hub`，当前故事允许用最小增量逐步接近该结构，但不能回退到单页全局脚本拼接。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- 数据流必须继续遵循“初始化快照 -> 主界面展示 -> 后续入口导航”，主界面推荐动作不能依赖客户端假进度或本地时间。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]

### Library / Framework Requirements

- 当前实际前端基线仍是 `React 19`、`react-router-dom 6.30.3`、`Vitest`，本故事继续沿用。  
  [Source: package.json]
- 即使架构远期规划中有 `TanStack Query` / `Zustand`，本故事也只应复用现有 `libs/client/state` 窄边界，不做整套状态架构重写。  
  [Source: package.json]  
  [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]

### File Structure Requirements

- 优先修改或新增的文件应集中在：
  - `apps/game-h5/src/app/app.tsx`
  - `apps/game-h5/src/app/app.spec.tsx`
  - `apps/game-h5/src/app/app.module.css`
  - `apps/game-h5/src/features/main-hub/**`（如需要）
  - `apps/game-h5/src/routes/**`（如需要）
  - `apps/game-h5/src/styles.css`
- Story 1.4 已把 `App` 的 `ready` 分支做成权威快照交接态；Story 1.5 应在这个基础上升级为正式主界面，不要重新发明第二套 ready 入口。  
  [Source: _bmad-output/implementation-artifacts/1-4-build-h5-entry-and-init-loading-feedback.md#Completion Notes List]

### Testing Requirements

- 必须遵守 TDD，先让主界面行为测试失败，再补实现。  
  [Source: _bmad-output/project-context.md#测试规则]
- 最少覆盖以下验证：
  - 主界面首页展示背包、幻兽、战斗三个一期核心入口
  - 推荐动作显式出现且能进入一个核心入口
  - 延期入口在主界面呈现为统一未开放状态
  - 玩家直接访问延期入口相关路径时，仍看到同样的未开放状态
  - Story 1.4 的加载态/失败态没有因为主界面改造而回归
- 建议至少运行：
  - `pnpm nx test @workspace/game-h5`
  - `pnpm nx run @workspace/game-h5:typecheck`

### Previous Story Intelligence

- Story 1.3 已把初始化快照限定为最小玩家态数据，本故事必须把主界面初始信息建立在这份权威快照上，而不是新增本地伪状态。  
  [Source: _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md#Completion Notes List]
- Story 1.4 已交付入口加载、失败与重试反馈，且 `App` 在 `ready` 态已有最小交接视图；本故事应该保留这些启动反馈，扩展其 `ready` 分支。  
  [Source: _bmad-output/implementation-artifacts/1-4-build-h5-entry-and-init-loading-feedback.md#Completion Notes List]
- Story 1.4 已强调不提前展开完整主界面导航；因此 Story 1.5 正是把这部分正式补上，但仍只做到导航壳和治理边界，不吞并后续 epic。  
  [Source: _bmad-output/implementation-artifacts/1-4-build-h5-entry-and-init-loading-feedback.md#Tasks / Subtasks]

### Latest Tech Information

- 当前 `apps/game-h5/src/main.tsx` 已包裹 `BrowserRouter`，说明本故事可以直接接入正式路由，而不需要新增应用入口。  
  [Source: apps/game-h5/src/main.tsx]
- 当前 `App` 已覆盖 loading/error/ready 三类状态，其中 ready 仍是一期主流程交接占位；这是本故事的直接改造点。  
  [Source: apps/game-h5/src/app/app.tsx]
- 当前工作区尚未存在 `features/main-hub` 或 `routes` 目录；如本故事要新增，应保持最小范围且只围绕主界面与入口治理。  
  [Source: apps/game-h5/src]

### Project Context Reference

- 本故事输入来源仍固定为：`召唤之王详细需求文档.pdf`、`召唤之王/`、`布局图/`、以及仅作参考输入的 `htmlgame/`。  
  [Source: _bmad-output/project-context.md#开发流程规则]
- 共享 H5 是唯一核心客户端；网页端与微信壳只是宿主容器。主界面组织和延期入口治理不能出现平台分叉。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]
- 聊天、交易、联盟、VIP、商城等后续系统必须显式延期或隔离，不能在一期主界面里埋半功能。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]  
  [Source: _bmad-output/project-context.md#关键红线规则]

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5: 交付主界面首轮引导与延期入口治理]
- [Source: _bmad-output/planning-artifacts/prd.md#账号与角色起步]
- [Source: _bmad-output/planning-artifacts/prd.md#主界面与成长引导]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/planning-artifacts/architecture.md#Integration Points]
- [Source: _bmad-output/project-context.md#开发流程规则]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#关键红线规则]
- [Source: _bmad-output/implementation-artifacts/1-3-implement-character-bootstrap-and-initial-grants.md]
- [Source: _bmad-output/implementation-artifacts/1-4-build-h5-entry-and-init-loading-feedback.md]
- [Source: apps/game-h5/src/main.tsx]
- [Source: apps/game-h5/src/app/app.tsx]

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- Story context engine analysis for Story 1.5 completed
- `pnpm nx test @workspace/game-h5`
- `pnpm nx run @workspace/game-h5:typecheck`

### Completion Notes List

- 已将 Story 1.4 的 ready 交接视图升级为正式主界面壳，并在现有 `BrowserRouter` 边界内接入首页、背包、幻兽、战斗与延期入口路由
- 已基于权威初始化快照展示角色摘要、初始资源/幻兽摘要，并给出显式推荐动作 CTA `前往幻兽`
- 已把聊天、交易、联盟、VIP、商城统一治理为“未开放”入口，并保证直接访问延期路径时仍返回一致关闭态
- 核心入口页当前只交付导航壳和上下文提示，未提前展开 Epic 2/3/4 的正式业务实现
- 已通过 `pnpm nx test @workspace/game-h5` 与 `pnpm nx run @workspace/game-h5:typecheck` 验证本故事改动
- 当前仅剩 React Router v7 future flag warning，属于现有依赖提示，不影响本故事通过

### File List

- _bmad-output/implementation-artifacts/1-5-deliver-home-guidance-and-deferred-entry-governance.md
- apps/game-h5/src/app/app.module.css
- apps/game-h5/src/app/app.spec.tsx
- apps/game-h5/src/app/app.tsx

### Change Log

- 2026-04-06: 初始创建 Story 1.5，上下文已补齐，可直接进入开发
- 2026-04-06: 完成 Story 1.5 实现与验证，主界面壳、推荐动作和延期入口治理已落地
