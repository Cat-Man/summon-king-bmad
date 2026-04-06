import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(currentDir, '..', '..');

function fromRoot(...parts) {
  return resolve(repoRoot, ...parts);
}

function assertExists(relativePath) {
  assert.ok(existsSync(fromRoot(relativePath)), `expected ${relativePath} to exist`);
}

function assertMissing(relativePath) {
  assert.ok(!existsSync(fromRoot(relativePath)), `expected ${relativePath} to be absent`);
}

test('Story 1.1 workspace skeleton exists at repo root without nested product root', () => {
  [
    'package.json',
    'nx.json',
    'pnpm-workspace.yaml',
    'apps/game-h5',
    'apps/game-server',
    'libs/shared/contracts',
    'libs/shared/schemas',
    'libs/shared/types',
    'libs/platform/bridge',
    'libs/platform/web-adapter',
    'libs/platform/wechat-adapter',
    'libs/client/data-access',
    'libs/client/state',
    'libs/client/game-shell',
    'libs/server/application',
    'libs/server/domain',
    'libs/server/db',
    'libs/shared/reference-data',
    'docs/source-mapping',
  ].forEach(assertExists);

  [
    'apps/game-h5/src/bootstrap',
    'apps/game-h5/src/routes',
    'apps/game-h5/src/features/init',
    'apps/game-h5/src/features/main-hub',
    'apps/game-h5/src/features/inventory',
    'apps/game-h5/src/features/beast',
    'apps/game-h5/src/features/battle',
    'apps/game-h5/src/features/growth',
    'apps/game-server/src/modules/account',
    'apps/game-server/src/modules/player',
    'apps/game-server/src/modules/inventory',
    'apps/game-server/src/modules/beast',
    'apps/game-server/src/modules/battle',
    'apps/game-server/src/modules/resource',
    'apps/game-server/src/modules/config',
    'apps/game-server/src/modules/audit',
    'apps/game-server/src/modules/ops',
    'apps/game-server/prisma',
  ].forEach(assertExists);

  [
    'apps/game-h5/src/features/chat',
    'apps/game-h5/src/features/trade',
    'apps/game-h5/src/features/guild',
    'apps/game-h5/src/features/vip',
    'apps/game-h5/src/features/shop',
    'apps/game-server/src/modules/chat',
    'apps/game-server/src/modules/trade',
    'apps/game-server/src/modules/alliance',
    'apps/game-server/src/modules/vip',
    'apps/game-server/src/modules/shop',
    '.tmp-nx-workspace',
    'summon-king',
  ].forEach(assertMissing);
});

test('Story 1.1 project graph excludes legacy htmlgame server from formal workspace scope', () => {
  const projects = new Set(JSON.parse(execFileSync('pnpm', ['nx', 'show', 'projects', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })));

  assert.ok(projects.has('@workspace/game-h5'), 'expected Nx to recognize game-h5');
  assert.ok(projects.has('@workspace/game-server'), 'expected Nx to recognize game-server');
  assert.ok(!projects.has('htmlgame-server'), 'expected legacy htmlgame server to stay outside formal Nx workspace scope');
});
