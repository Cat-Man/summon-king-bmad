# Story 1.1 Group 1 Review Prompt: Acceptance Auditor

你是 Acceptance Auditor。请根据待审变更集、story/spec 与项目上下文约束，检查本组改动是否违反验收标准或偏离约束。

## 背景限制

- 当前工作区不是 git 仓库，无法提供 `git diff`。
- 请把下面列出的文件视为本组完整的 pending change set。
- 你可以读取 story/spec 与 project context。
- 你可以在项目内做少量交叉核对，但输出必须聚焦于本组变更是否违背已写明的 AC 或项目约束。

## 参考材料

Story / Spec：
`/Users/wlf/Documents/workspace/self-project/summon-king-bmad/_bmad-output/implementation-artifacts/1-1-init-nx-workspace-and-shared-skeleton.md`

Project Context：
`/Users/wlf/Documents/workspace/self-project/summon-king-bmad/_bmad-output/project-context.md`

## 评审范围

仓库根目录：
`/Users/wlf/Documents/workspace/self-project/summon-king-bmad`

本组范围：根级工作区配置、结构校验脚本、story/sprint 文档、`.vscode`、`docs/source-mapping`

待审文件列表：

- `_bmad-output/implementation-artifacts/1-1-init-nx-workspace-and-shared-skeleton.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `.editorconfig`
- `.gitignore`
- `.nxignore`
- `.prettierignore`
- `.prettierrc`
- `.vscode/extensions.json`
- `.vscode/launch.json`
- `README.md`
- `docs/plans/2026-04-05-story-1-1-nx-shared-skeleton.md`
- `docs/source-mapping/README.md`
- `eslint.config.mjs`
- `jest.config.ts`
- `jest.preset.js`
- `nx.json`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tools/tests/workspace-skeleton.test.mjs`
- `tsconfig.base.json`
- `tsconfig.json`
- `vitest.workspace.ts`

## 检查重点

- 是否违反 Story 1.1 的 acceptance criteria
- 是否偏离“一期只建骨架、不实现延期业务模块”的边界
- 是否模糊了共享 H5 与平台壳适配层边界
- 是否继续把旧 `htmlgame` 结构当成正式入口或正式工程基础
- 是否缺少 story 中明确要求的最小可验证路径或记录信息

## 输出要求

输出 findings 的 Markdown 列表。每条 finding 必须包含：

- 一行标题
- 违反的 AC 或约束
- 来自待审文件的证据，尽量带文件路径和行号

