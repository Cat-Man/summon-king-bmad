# Story 1.1: 基于 Nx starter 初始化正式工作区与共享骨架

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 开发团队，
I want 按已批准架构初始化 `Nx` 工作区、`game-h5`、`game-server`、共享 contracts 与 platform bridge 骨架，
so that 后续玩家开局能力可以在统一边界上实现而不再依赖旧原型结构。

## Acceptance Criteria

1. **Given** 已批准 starter 为 `Nx workspace + React/Vite` 共享 H5 基线  
   **When** 团队执行正式工程初始化  
   **Then** 生成可安装依赖并可执行基础 workspace 任务的正式工作区  
   **And** 工作区中创建 `game-h5`、`game-server` 与共享库边界

2. **Given** 新工程骨架已建立  
   **When** 检查共享能力目录与入口边界  
   **Then** 至少存在 `shared contracts`、`schemas/types`、`platform bridge` 的正式位置  
   **And** 不继续以 `htmlgame/game.html` 或旧全局脚本作为正式入口

3. **Given** 架构要求的一期边界  
   **When** 初始化目录结构与首批模块  
   **Then** 一期核心域目录可见  
   **And** 聊天、交易、联盟、VIP、商城等延期系统未被实现为一期业务模块

## Tasks / Subtasks

- [x] 确认正式工作区落位策略，避免最终产物出现第二层产品根目录
  - [x] 基于当前仓库实际情况确认 Nx 工作区是“直接落在当前根目录”还是“临时生成后合并到当前根目录”
  - [x] 明确保留 `_bmad-output/`、`htmlgame/`、`布局图/`、`召唤之王/` 为参考输入，不被脚手架覆盖

- [x] 基于架构基线初始化 Nx 工作区与 `game-h5`
  - [x] 使用 `pnpm`、`React monorepo`、`Vite`、`Vitest`、`Playwright`、`CSS`、`nxCloud=skip`、`skipGit` 作为 starter 参数
  - [x] 确保初始化后能执行基础 Nx 命令，例如 `nx show projects` 或同等 project graph 查询
  - [x] 保持正式入口不再依赖旧 `htmlgame/game.html` 或旧全局脚本流程

- [x] 在工作区内创建 `game-server` 应用骨架
  - [x] 优先通过 Nx 官方 Nest 插件接入 `apps/game-server`
  - [x] 建立 `apps/game-server/src/modules` 与 `apps/game-server/prisma` 的基础位置
  - [x] 不在这一故事里实现业务模块逻辑、数据库表或接口细节

- [x] 建立共享库与平台边界骨架
  - [x] 创建可被 Nx project graph 识别的最小共享库骨架：`libs/shared/contracts`、`libs/shared/schemas`、`libs/shared/types`
  - [x] 创建可被 Nx project graph 识别的最小平台库骨架：`libs/platform/bridge`、`libs/platform/web-adapter`、`libs/platform/wechat-adapter`
  - [x] 仅建立边界和目录，不在本故事中写入平台专属业务逻辑

- [x] 建立客户端、服务端复用层与参考映射落点
  - [x] 创建 `libs/client/data-access`、`libs/client/state`、`libs/client/game-shell` 的占位目录或最小库骨架
  - [x] 创建 `libs/server/application`、`libs/server/domain`、`libs/server/db` 的占位目录或最小库骨架
  - [x] 创建 `libs/shared/reference-data` 与 `docs/source-mapping`，用于承接旧文档、旧素材、旧 ID 的映射输入
  - [x] 上述目录只建立未来落点，不在本故事中填充正式业务实现

- [x] 建立一期核心域的首批目录占位
  - [x] `game-h5` 至少建立 `bootstrap`、`routes`、`features/init`、`features/main-hub`、`features/inventory`、`features/beast`、`features/battle`、`features/growth`
  - [x] `game-server` 至少建立 `account`、`player`、`inventory`、`beast`、`battle`、`resource`、`config`、`audit`、`ops`
  - [x] 不创建聊天、交易、联盟、VIP、商城等延期模块目录

- [x] 完成最小可验证检查
  - [x] 验证 `game-h5`、`game-server` 与共享库在 workspace 中可被识别
  - [x] 验证首批目录与边界存在
  - [x] 验证 `libs/client/*`、`libs/server/*`、`libs/shared/reference-data`、`docs/source-mapping` 已作为后续故事合法落点存在
  - [x] 记录脚手架生成过程中的根目录适配决策与任何必要偏差

### Review Findings

- [x] [Review][Patch] 将项目图断言改为按行精确匹配，避免 `@workspace/game-h5-e2e` 之类名称导致误判 [tools/tests/workspace-skeleton.test.mjs:89]
- [x] [Review][Patch] 修正 VS Code 调试配置的 `runtimeExecutable` 调用方式，当前 `pnpm exec` 会被当成不存在的单个可执行文件 [.vscode/launch.json:8]
- [x] [Review][Patch] 修正 VS Code 调试配置的 `outFiles` glob 分组写法，当前写法不符合 VS Code 文档列出的 glob 分组语法 [.vscode/launch.json:18]
- [x] [Review][Patch] 同步 `sprint-status.yaml` 顶部注释中的 `last_updated`，避免与正文字段时间不一致 [_bmad-output/implementation-artifacts/sprint-status.yaml:2]
- [x] [Review][Patch] 将项目图查询改为 `pnpm nx show projects --json` 并按 JSON 解析，避免未来 CLI 输出格式变化导致结构测试误报 [tools/tests/workspace-skeleton.test.mjs:84]
- [ ] [Review][Patch] 收紧结构测试的文件系统断言：对预期目录做目录类型校验，并让“缺失路径”断言只接受 `ENOENT`，避免文件或权限异常被误判为通过 [tools/tests/workspace-skeleton.test.mjs:15]
- [ ] [Review][Patch] 同步 Story 1.1 中已完成 review 项的描述文案，当前第 1/2 条与最新实现状态不一致 [_bmad-output/implementation-artifacts/1-1-init-nx-workspace-and-shared-skeleton.md:70]

## Dev Notes

### Technical Requirements

- 当前故事是“一期正式骨架”的起点，目标是建立可持续扩展的 workspace，而不是继续在旧 H5 原型上叠功能。  
  [Source: _bmad-output/planning-artifacts/prd.md#Technical Success]
- 一期正式骨架必须支撑共享 H5 主客户端，且后续网页端与微信小程序壳不能演化成两套分叉业务逻辑。  
  [Source: _bmad-output/planning-artifacts/prd.md#Technical Success]
- 当前仓库不是 git 仓库，不能把 branch/PR 当作默认工作流前提；本故事必须在不依赖 git 初始化的前提下完成。  
  [Source: _bmad-output/project-context.md#开发流程规则]

### Architecture Compliance

- 架构已明确选型为 `Nx Workspace + React/Vite H5 Baseline`，并给出参考初始化命令；故事实施不得临时替换成 Next.js、Turborepo 或继续沿用旧单页结构。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Selected Starter: Nx Workspace + React/Vite H5 Baseline]
- 一期 API、业务模块与平台能力必须分层；本故事只建立边界，不实现跨层规则。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- 平台差异必须封装在 `platform-bridge`、`web-adapter`、`wechat-adapter` 中，不得渗入 `game-h5` 页面逻辑。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Platform Boundary Strategy]

### Library / Framework Requirements

- starter 基线：`create-nx-workspace` + `React` + `Vite` + `Vitest` + `Playwright` + `pnpm` + `--skipGit`。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Initialization Command]
- `game-server` 的正式方向是 `NestJS 11` 模块化单体；在 Nx 内应优先通过 `@nx/nest` 路径生成和管理应用骨架，而不是单独用裸 `nest-cli` 在 workspace 外另起炉灶。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]  
  Supplemental: https://nx.dev/docs/technologies/node/nest/introduction
- 共享契约位于 `libs/shared/contracts`、`libs/shared/schemas`、`libs/shared/types`；平台边界位于 `libs/platform/*`。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]

### File Structure Requirements

- 目标结构至少要开始向以下布局收敛：`apps/game-h5`、`apps/game-server`、`libs/shared/*`、`libs/platform/*`、`libs/client/*`、`libs/server/*`。  
  [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- 本故事只需建立一期核心域的首批目录占位，不应提前创建延期系统模块。  
  [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1: 基于 Nx starter 初始化正式工作区与共享骨架]
- 旧原型相关目录必须保留为参考输入，不得把其脚手架、DOM 路由或全局脚本迁入新工程入口。  
  [Source: _bmad-output/project-context.md#结构与平台边界规则]

### Testing Requirements

- 当前项目没有正式生产级自动化测试基线，本故事的“完成”不能只靠脚手架生成成功；必须有最小可重复验证路径。  
  [Source: _bmad-output/project-context.md#测试规则]
- 至少验证以下内容：
  - `pnpm install` 可完成
  - `nx show projects` 或等价命令能识别 `game-h5`、`game-server` 与共享库
  - `game-h5` 至少具备可运行/可测试的默认 target
  - 如果 `game-server` 已生成 target，则其基础 test/lint target 至少能被 Nx 识别
- 不要求在本故事中实现初始化业务、接口契约或数据库 schema，但必须保证后续 story 有合法落点。

### Latest Tech Information

- 官方 Nx 命令参考确认 `create-nx-workspace` 仍是标准工作区初始化入口，相关初始化参数包含 `--nxCloud`、`--interactive` 等 CLI 选项；当前架构选定 `--nxCloud=skip` 和 `--skipGit`，应继续遵循。  
  Supplemental: https://nx.dev/docs/reference/nx-commands
- 官方 Nx Nest 文档确认 `@nx/nest` 是在 Nx workspace 中创建和管理 Nest 应用/库的官方插件路径；故事实现应优先沿用这一路径，避免绕过 Nx project graph。  
  Supplemental: https://nx.dev/docs/technologies/node/nest/introduction

### Project Context Reference

- 当前 root 同时承载规划产物、旧原型、规则文档和布局参考，因此脚手架操作必须把“正式骨架”和“参考输入”隔离开。  
  [Source: _bmad-output/project-context.md#新构建基线]
- 禁止继续把正式功能直接堆到 `htmlgame/game.html` 或旧全局脚本流程。  
  [Source: _bmad-output/project-context.md#语言与代码模式规则]
- 新代码结构必须清楚体现“一期”和“延期”边界，避免后续再次退化为巨型单入口。  
  [Source: _bmad-output/project-context.md#代码质量与风格规则]

### Project Structure Notes

- 当前仓库实际名称不是 `summon-king/`，但架构示例中的目标结构默认以产品根目录展示。开发时允许根据当前根目录实际情况调整生成方式，但最终产物不能保留“额外嵌套一层正式工程根目录”的状态。
- 如果 `create-nx-workspace` 无法直接安全初始化到当前根目录，允许先在临时目录生成，再把正式工作区文件合并到当前项目根目录，同时保留现有 `_bmad-output/` 与 legacy 参考目录。
- `docs/` 在当前仓库里尚未形成长期知识库，不应把不存在的 `docs/source-mapping` 当作现成完成物；可以在本故事里只建立目录骨架，不必填充内容。

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1: 基于 Nx starter 初始化正式工作区与共享骨架]
- [Source: _bmad-output/planning-artifacts/prd.md#Technical Success]
- [Source: _bmad-output/planning-artifacts/prd.md#一期功能范围]
- [Source: _bmad-output/planning-artifacts/architecture.md#Selected Starter: Nx Workspace + React/Vite H5 Baseline]
- [Source: _bmad-output/planning-artifacts/architecture.md#Initialization Command]
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping]
- [Source: _bmad-output/project-context.md#新构建基线]
- [Source: _bmad-output/project-context.md#结构与平台边界规则]
- [Source: _bmad-output/project-context.md#开发流程规则]
- Supplemental: https://nx.dev/docs/reference/nx-commands
- Supplemental: https://nx.dev/docs/technologies/node/nest/introduction

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- `node --test tools/tests/workspace-skeleton.test.mjs`（红灯：缺少 `package.json`）
- `node --test tools/tests/workspace-skeleton.test.mjs`（红灯：缺少 `apps/game-server`）
- `node --test tools/tests/workspace-skeleton.test.mjs`（红灯：缺少 `docs/source-mapping`）
- `node --test tools/tests/workspace-skeleton.test.mjs`（红灯：`htmlgame-server` 仍在 Nx project graph）
- `pnpm install`
- `pnpm nx add @nx/nest@22.6.4`
- `pnpm nx g @nx/nest:application apps/game-server --linter=eslint --e2eTestRunner=none --unitTestRunner=jest --strict=true --interactive=false`
- `pnpm nx show projects`
- `pnpm nx show project @workspace/game-server`
- `pnpm nx test @workspace/game-h5`
- `pnpm nx run-many -t test --all --outputStyle=static`
- `pnpm nx run-many -t lint --all --outputStyle=static`
- `pnpm nx lint @workspace/game-server`
- `pnpm nx test @workspace/game-server`

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- 当前为第一条故事，无 previous story intelligence 可继承
- 当前仓库不是 git 仓库，无 git history intelligence 可引用
- 采用“临时目录生成后合并回当前根目录”的落位策略，在 `/tmp` 下生成 Nx workspace 后合并到仓库根目录，避免形成第二层产品根目录
- 保留 `_bmad-output/`、`htmlgame/`、`布局图/`、`召唤之王/` 作为参考输入，未覆盖 legacy 目录
- 正式骨架已建立 `apps/game-h5`、`apps/game-server`、`libs/shared/*`、`libs/platform/*`、`libs/client/*`、`libs/server/*`
- 通过 `.nxignore` 将 `htmlgame/**` 排除出正式 Nx project graph，保持旧原型仅作参考输入
- 已建立 `docs/source-mapping` 与 `libs/shared/reference-data` 作为旧文档、旧素材、旧 ID 的映射落点
- 已建立一期 H5 特性目录与服务端模块目录占位，且未创建聊天、交易、联盟、VIP、商城等延期模块目录
- 验证通过：结构测试、`pnpm install`、`pnpm nx show projects`、`pnpm nx show project @workspace/game-server`、`pnpm nx run-many -t test --all --outputStyle=static`、`pnpm nx run-many -t lint --all --outputStyle=static`
- 非阻断提示：Nx/Vitest 在当前终端环境会输出 `NO_COLOR`/`FORCE_COLOR` 警告，`game-h5` 默认样板测试会输出 React Router future flag 提示；不影响 Story 1.1 的骨架验收

### File List

- _bmad-output/implementation-artifacts/1-1-init-nx-workspace-and-shared-skeleton.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- .editorconfig
- .gitignore
- .nxignore
- .prettierignore
- .prettierrc
- .vscode/extensions.json
- .vscode/launch.json
- README.md
- apps/game-h5-e2e/eslint.config.mjs
- apps/game-h5-e2e/package.json
- apps/game-h5-e2e/playwright.config.ts
- apps/game-h5-e2e/src/example.spec.ts
- apps/game-h5-e2e/tsconfig.json
- apps/game-h5/eslint.config.mjs
- apps/game-h5/index.html
- apps/game-h5/package.json
- apps/game-h5/public/favicon.ico
- apps/game-h5/src/app/app.module.css
- apps/game-h5/src/app/app.spec.tsx
- apps/game-h5/src/app/app.tsx
- apps/game-h5/src/app/nx-welcome.tsx
- apps/game-h5/src/assets/.gitkeep
- apps/game-h5/src/bootstrap/.gitkeep
- apps/game-h5/src/features/battle/.gitkeep
- apps/game-h5/src/features/beast/.gitkeep
- apps/game-h5/src/features/growth/.gitkeep
- apps/game-h5/src/features/init/.gitkeep
- apps/game-h5/src/features/inventory/.gitkeep
- apps/game-h5/src/features/main-hub/.gitkeep
- apps/game-h5/src/main.tsx
- apps/game-h5/src/routes/.gitkeep
- apps/game-h5/src/styles.css
- apps/game-h5/tsconfig.app.json
- apps/game-h5/tsconfig.json
- apps/game-h5/tsconfig.spec.json
- apps/game-h5/vite.config.mts
- apps/game-server/eslint.config.mjs
- apps/game-server/jest.config.cts
- apps/game-server/package.json
- apps/game-server/prisma/.gitkeep
- apps/game-server/src/app/app.controller.spec.ts
- apps/game-server/src/app/app.controller.ts
- apps/game-server/src/app/app.module.ts
- apps/game-server/src/app/app.service.spec.ts
- apps/game-server/src/app/app.service.ts
- apps/game-server/src/assets/.gitkeep
- apps/game-server/src/main.ts
- apps/game-server/src/modules/account/.gitkeep
- apps/game-server/src/modules/audit/.gitkeep
- apps/game-server/src/modules/battle/.gitkeep
- apps/game-server/src/modules/beast/.gitkeep
- apps/game-server/src/modules/config/.gitkeep
- apps/game-server/src/modules/inventory/.gitkeep
- apps/game-server/src/modules/ops/.gitkeep
- apps/game-server/src/modules/player/.gitkeep
- apps/game-server/src/modules/resource/.gitkeep
- apps/game-server/tsconfig.app.json
- apps/game-server/tsconfig.json
- apps/game-server/tsconfig.spec.json
- apps/game-server/webpack.config.js
- docs/plans/2026-04-05-story-1-1-nx-shared-skeleton.md
- docs/source-mapping/README.md
- eslint.config.mjs
- jest.config.ts
- jest.preset.js
- libs/client/data-access/README.md
- libs/client/data-access/eslint.config.mjs
- libs/client/data-access/package.json
- libs/client/data-access/src/index.ts
- libs/client/data-access/src/lib/data-access.spec.ts
- libs/client/data-access/src/lib/data-access.ts
- libs/client/data-access/tsconfig.json
- libs/client/data-access/tsconfig.lib.json
- libs/client/data-access/tsconfig.spec.json
- libs/client/data-access/vitest.config.mts
- libs/client/game-shell/README.md
- libs/client/game-shell/eslint.config.mjs
- libs/client/game-shell/package.json
- libs/client/game-shell/src/index.ts
- libs/client/game-shell/src/lib/game-shell.spec.ts
- libs/client/game-shell/src/lib/game-shell.ts
- libs/client/game-shell/tsconfig.json
- libs/client/game-shell/tsconfig.lib.json
- libs/client/game-shell/tsconfig.spec.json
- libs/client/game-shell/vitest.config.mts
- libs/client/state/README.md
- libs/client/state/eslint.config.mjs
- libs/client/state/package.json
- libs/client/state/src/index.ts
- libs/client/state/src/lib/state.spec.ts
- libs/client/state/src/lib/state.ts
- libs/client/state/tsconfig.json
- libs/client/state/tsconfig.lib.json
- libs/client/state/tsconfig.spec.json
- libs/client/state/vitest.config.mts
- libs/platform/bridge/README.md
- libs/platform/bridge/eslint.config.mjs
- libs/platform/bridge/package.json
- libs/platform/bridge/src/index.ts
- libs/platform/bridge/src/lib/bridge.spec.ts
- libs/platform/bridge/src/lib/bridge.ts
- libs/platform/bridge/tsconfig.json
- libs/platform/bridge/tsconfig.lib.json
- libs/platform/bridge/tsconfig.spec.json
- libs/platform/bridge/vitest.config.mts
- libs/platform/web-adapter/README.md
- libs/platform/web-adapter/eslint.config.mjs
- libs/platform/web-adapter/package.json
- libs/platform/web-adapter/src/index.ts
- libs/platform/web-adapter/src/lib/web-adapter.spec.ts
- libs/platform/web-adapter/src/lib/web-adapter.ts
- libs/platform/web-adapter/tsconfig.json
- libs/platform/web-adapter/tsconfig.lib.json
- libs/platform/web-adapter/tsconfig.spec.json
- libs/platform/web-adapter/vitest.config.mts
- libs/platform/wechat-adapter/README.md
- libs/platform/wechat-adapter/eslint.config.mjs
- libs/platform/wechat-adapter/package.json
- libs/platform/wechat-adapter/src/index.ts
- libs/platform/wechat-adapter/src/lib/wechat-adapter.spec.ts
- libs/platform/wechat-adapter/src/lib/wechat-adapter.ts
- libs/platform/wechat-adapter/tsconfig.json
- libs/platform/wechat-adapter/tsconfig.lib.json
- libs/platform/wechat-adapter/tsconfig.spec.json
- libs/platform/wechat-adapter/vitest.config.mts
- libs/server/application/README.md
- libs/server/application/eslint.config.mjs
- libs/server/application/package.json
- libs/server/application/src/index.ts
- libs/server/application/src/lib/application.spec.ts
- libs/server/application/src/lib/application.ts
- libs/server/application/tsconfig.json
- libs/server/application/tsconfig.lib.json
- libs/server/application/tsconfig.spec.json
- libs/server/application/vitest.config.mts
- libs/server/db/README.md
- libs/server/db/eslint.config.mjs
- libs/server/db/package.json
- libs/server/db/src/index.ts
- libs/server/db/src/lib/db.spec.ts
- libs/server/db/src/lib/db.ts
- libs/server/db/tsconfig.json
- libs/server/db/tsconfig.lib.json
- libs/server/db/tsconfig.spec.json
- libs/server/db/vitest.config.mts
- libs/server/domain/README.md
- libs/server/domain/eslint.config.mjs
- libs/server/domain/package.json
- libs/server/domain/src/index.ts
- libs/server/domain/src/lib/domain.spec.ts
- libs/server/domain/src/lib/domain.ts
- libs/server/domain/tsconfig.json
- libs/server/domain/tsconfig.lib.json
- libs/server/domain/tsconfig.spec.json
- libs/server/domain/vitest.config.mts
- libs/shared/contracts/README.md
- libs/shared/contracts/eslint.config.mjs
- libs/shared/contracts/package.json
- libs/shared/contracts/src/index.ts
- libs/shared/contracts/src/lib/contracts.spec.ts
- libs/shared/contracts/src/lib/contracts.ts
- libs/shared/contracts/tsconfig.json
- libs/shared/contracts/tsconfig.lib.json
- libs/shared/contracts/tsconfig.spec.json
- libs/shared/contracts/vitest.config.mts
- libs/shared/reference-data/README.md
- libs/shared/reference-data/eslint.config.mjs
- libs/shared/reference-data/package.json
- libs/shared/reference-data/src/index.ts
- libs/shared/reference-data/src/lib/reference-data.spec.ts
- libs/shared/reference-data/src/lib/reference-data.ts
- libs/shared/reference-data/tsconfig.json
- libs/shared/reference-data/tsconfig.lib.json
- libs/shared/reference-data/tsconfig.spec.json
- libs/shared/reference-data/vitest.config.mts
- libs/shared/schemas/README.md
- libs/shared/schemas/eslint.config.mjs
- libs/shared/schemas/package.json
- libs/shared/schemas/src/index.ts
- libs/shared/schemas/src/lib/schemas.spec.ts
- libs/shared/schemas/src/lib/schemas.ts
- libs/shared/schemas/tsconfig.json
- libs/shared/schemas/tsconfig.lib.json
- libs/shared/schemas/tsconfig.spec.json
- libs/shared/schemas/vitest.config.mts
- libs/shared/types/README.md
- libs/shared/types/eslint.config.mjs
- libs/shared/types/package.json
- libs/shared/types/src/index.ts
- libs/shared/types/src/lib/types.spec.ts
- libs/shared/types/src/lib/types.ts
- libs/shared/types/tsconfig.json
- libs/shared/types/tsconfig.lib.json
- libs/shared/types/tsconfig.spec.json
- libs/shared/types/vitest.config.mts
- nx.json
- package.json
- pnpm-lock.yaml
- pnpm-workspace.yaml
- tools/tests/workspace-skeleton.test.mjs
- tsconfig.base.json
- tsconfig.json
- vitest.workspace.ts

### Change Log

- 2026-04-05: 采用临时目录生成并合并回根目录的方式初始化 Nx React/Vite 正式工作区，避免形成第二层产品根目录
- 2026-04-05: 接入 `@nx/nest` 生成 `apps/game-server`，并建立共享库、平台库、客户端/服务端复用层与一期目录占位
- 2026-04-05: 新增结构验证脚本与 `.nxignore`，确保旧 `htmlgame` 继续作为参考输入而非正式 workspace 项目
