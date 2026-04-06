import {
  BEAST_DETAIL_CONTRACT,
  BEAST_LIST_CONTRACT,
  DEFAULT_TEAM_SETUP_CONTRACT,
  INVENTORY_SNAPSHOT_CONTRACT,
  PLAYER_INIT_CONTRACT,
  RESOURCE_CONSUME_CONTRACT,
  REWARD_CLAIM_CONTRACT,
  SESSION_AUTH_CONTRACT,
  buildBeastDetailUrl,
  buildBeastListUrl,
  buildDefaultTeamSetupUrl,
  buildInventorySnapshotUrl,
  buildPlayerInitUrl,
  buildResourceConsumeUrl,
  buildRewardClaimUrl,
  buildSessionAuthUrl,
  isBeastDetailRoute,
  isBeastListRoute,
  isDefaultTeamSetupRoute,
  isInventorySnapshotRoute,
  isPlayerInitRoute,
  isResourceConsumeRoute,
  isRewardClaimRoute,
  isSessionAuthRoute,
} from './contracts.js';

describe('session auth contract', () => {
  it('defines the first formal player-chain session auth endpoint', () => {
    expect(SESSION_AUTH_CONTRACT).toEqual({
      method: 'POST',
      path: '/api/v1/session/auth',
    });
  });

  it('builds absolute or relative auth urls from the shared contract', () => {
    expect(buildSessionAuthUrl()).toBe('/api/v1/session/auth');
    expect(buildSessionAuthUrl('https://game.example.com')).toBe(
      'https://game.example.com/api/v1/session/auth',
    );
  });

  it('identifies the canonical session auth route only', () => {
    expect(isSessionAuthRoute('POST', '/api/v1/session/auth')).toBe(true);
    expect(isSessionAuthRoute('GET', '/api/v1/session/auth')).toBe(false);
    expect(isSessionAuthRoute('POST', '/api/v1/player/init')).toBe(false);
  });

  it('defines the authoritative player initialization endpoint', () => {
    expect(PLAYER_INIT_CONTRACT).toEqual({
      method: 'POST',
      path: '/api/v1/player/init',
    });
    expect(buildPlayerInitUrl()).toBe('/api/v1/player/init');
  });

  it('identifies the canonical player init route only', () => {
    expect(isPlayerInitRoute('POST', '/api/v1/player/init')).toBe(true);
    expect(isPlayerInitRoute('GET', '/api/v1/player/init')).toBe(false);
    expect(isPlayerInitRoute('POST', '/api/v1/session/auth')).toBe(false);
  });
});

describe('inventory snapshot contract', () => {
  it('defines the authoritative inventory snapshot endpoint', () => {
    expect(INVENTORY_SNAPSHOT_CONTRACT).toEqual({
      method: 'GET',
      path: '/api/v1/inventory',
    });
    expect(buildInventorySnapshotUrl()).toBe('/api/v1/inventory');
    expect(buildInventorySnapshotUrl('https://game.example.com')).toBe(
      'https://game.example.com/api/v1/inventory',
    );
  });

  it('identifies the canonical inventory snapshot route only', () => {
    expect(isInventorySnapshotRoute('GET', '/api/v1/inventory')).toBe(true);
    expect(isInventorySnapshotRoute('POST', '/api/v1/inventory')).toBe(false);
    expect(isInventorySnapshotRoute('GET', '/api/v1/player/init')).toBe(false);
  });
});

describe('beast list contract', () => {
  it('defines the authoritative beast list endpoint under the beast boundary', () => {
    expect(BEAST_LIST_CONTRACT).toEqual({
      method: 'GET',
      path: '/api/v1/beast',
    });
    expect(buildBeastListUrl()).toBe('/api/v1/beast');
    expect(buildBeastListUrl('https://game.example.com')).toBe(
      'https://game.example.com/api/v1/beast',
    );
  });

  it('identifies the canonical beast list route only', () => {
    expect(isBeastListRoute('GET', '/api/v1/beast')).toBe(true);
    expect(isBeastListRoute('POST', '/api/v1/beast')).toBe(false);
    expect(isBeastListRoute('GET', '/api/v1/inventory')).toBe(false);
  });
});

describe('beast detail contract', () => {
  it('defines the authoritative beast detail endpoint under the beast boundary', () => {
    expect(BEAST_DETAIL_CONTRACT).toEqual({
      method: 'GET',
      path: '/api/v1/beast/:beastInstanceId',
    });
    expect(buildBeastDetailUrl('beast_inst_001')).toBe(
      '/api/v1/beast/beast_inst_001',
    );
    expect(
      buildBeastDetailUrl('beast_inst_001', 'https://game.example.com'),
    ).toBe('https://game.example.com/api/v1/beast/beast_inst_001');
  });

  it('identifies the canonical beast detail route only', () => {
    expect(isBeastDetailRoute('GET', '/api/v1/beast/beast_inst_001')).toBe(
      true,
    );
    expect(isBeastDetailRoute('POST', '/api/v1/beast/beast_inst_001')).toBe(
      false,
    );
    expect(isBeastDetailRoute('GET', '/api/v1/beast')).toBe(false);
    expect(isBeastDetailRoute('GET', '/api/v1/beast/team/default')).toBe(
      false,
    );
  });
});

describe('default team setup contract', () => {
  it('defines the authoritative default team setup endpoint under the beast boundary', () => {
    expect(DEFAULT_TEAM_SETUP_CONTRACT).toEqual({
      method: 'POST',
      path: '/api/v1/beast/team/default',
    });
    expect(buildDefaultTeamSetupUrl()).toBe('/api/v1/beast/team/default');
    expect(buildDefaultTeamSetupUrl('https://game.example.com')).toBe(
      'https://game.example.com/api/v1/beast/team/default',
    );
  });

  it('identifies the canonical default team setup route only', () => {
    expect(isDefaultTeamSetupRoute('POST', '/api/v1/beast/team/default')).toBe(
      true,
    );
    expect(isDefaultTeamSetupRoute('GET', '/api/v1/beast/team/default')).toBe(
      false,
    );
    expect(
      isDefaultTeamSetupRoute('POST', '/api/v1/beast/beast_inst_001'),
    ).toBe(false);
  });
});

describe('reward claim contract', () => {
  it('defines the authoritative reward claim endpoint under the resource boundary', () => {
    expect(REWARD_CLAIM_CONTRACT).toEqual({
      method: 'POST',
      path: '/api/v1/resource/rewards/claim',
    });
    expect(buildRewardClaimUrl()).toBe('/api/v1/resource/rewards/claim');
    expect(buildRewardClaimUrl('https://game.example.com')).toBe(
      'https://game.example.com/api/v1/resource/rewards/claim',
    );
  });

  it('identifies the canonical reward claim route only', () => {
    expect(isRewardClaimRoute('POST', '/api/v1/resource/rewards/claim')).toBe(
      true,
    );
    expect(isRewardClaimRoute('GET', '/api/v1/resource/rewards/claim')).toBe(
      false,
    );
    expect(isRewardClaimRoute('POST', '/api/v1/inventory')).toBe(false);
  });
});

describe('resource consume contract', () => {
  it('defines the authoritative consume endpoint under the resource boundary', () => {
    expect(RESOURCE_CONSUME_CONTRACT).toEqual({
      method: 'POST',
      path: '/api/v1/resource/consume',
    });
    expect(buildResourceConsumeUrl()).toBe('/api/v1/resource/consume');
    expect(buildResourceConsumeUrl('https://game.example.com')).toBe(
      'https://game.example.com/api/v1/resource/consume',
    );
  });

  it('identifies the canonical resource consume route only', () => {
    expect(isResourceConsumeRoute('POST', '/api/v1/resource/consume')).toBe(
      true,
    );
    expect(isResourceConsumeRoute('GET', '/api/v1/resource/consume')).toBe(
      false,
    );
    expect(isResourceConsumeRoute('POST', '/api/v1/inventory')).toBe(false);
  });
});
