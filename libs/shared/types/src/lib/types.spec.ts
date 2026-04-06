import { expectTypeOf } from 'vitest';
import type {
  BeastGrowthRequest,
  BeastGrowthResponse,
  BeastDetailRequest,
  BeastDetailResponse,
  BeastListRequest,
  BeastListResponse,
  DefaultTeamSetupRequest,
  DefaultTeamSetupResponse,
  HostPlatform,
  InventorySnapshotRequest,
  InventorySnapshotResponse,
  PlayerInitRequest,
  PlayerInitResponse,
  NormalizedHostIdentity,
  ResourceConsumeRequest,
  ResourceConsumeResponse,
  RewardClaimRequest,
  RewardClaimResponse,
  SessionAuthRequest,
  SessionAuthResponse,
  UnifiedSession,
} from './types.js';
import {
  BEAST_GROWTH_ACTION_IDS,
  BEAST_GROWTH_ERROR_CODES,
  BEAST_DETAIL_ERROR_CODES,
  BEAST_LIST_ERROR_CODES,
  DEFAULT_TEAM_SETUP_ERROR_CODES,
  HOST_PLATFORMS,
  INVENTORY_ERROR_CODES,
  PLAYER_INIT_ERROR_CODES,
  RESOURCE_CONSUME_ACTION_IDS,
  RESOURCE_CONSUME_ERROR_CODES,
  REWARD_BUNDLE_IDS,
  REWARD_CLAIM_ERROR_CODES,
  SESSION_AUTH_ERROR_CODES,
} from './types.js';

describe('shared session types', () => {
  it('exposes supported host platforms for shared H5 hosts', () => {
    expect(HOST_PLATFORMS).toEqual(['web', 'wechat-miniapp']);
    expectTypeOf<HostPlatform>().toEqualTypeOf<'web' | 'wechat-miniapp'>();
  });

  it('supports a platform-agnostic unified session payload', () => {
    const request: SessionAuthRequest = {
      hostPlatform: 'web',
      normalizedHostIdentity: {
        hostPlatform: 'web',
        hostUserId: 'web-user-001',
        sessionProof: 'dev-proof',
        deviceId: 'browser-device-1',
        channel: 'web-portal',
        isDevelopmentFallback: false,
      },
    };

    const response: SessionAuthResponse = {
      ok: true,
      traceId: 'trace-001',
      session: {
        accountId: 'acc_001',
        playerId: null,
        sessionToken: 'sess_001',
        hostPlatform: 'web',
        needsPlayerInitialization: true,
      },
    };

    expect(request.normalizedHostIdentity.hostUserId).toBe('web-user-001');
    expect(response.ok).toBe(true);
    expectTypeOf<NormalizedHostIdentity['hostPlatform']>().toEqualTypeOf<
      SessionAuthRequest['hostPlatform']
    >();
    expectTypeOf<UnifiedSession['playerId']>().toEqualTypeOf<string | null>();
  });

  it('exports stable error codes for invalid input and unsupported hosts', () => {
    expect(SESSION_AUTH_ERROR_CODES).toEqual([
      'SESSION_AUTH_INVALID_INPUT',
      'SESSION_AUTH_UNSUPPORTED_PLATFORM',
    ]);
  });

  it('supports a minimal authoritative player initialization snapshot', () => {
    const request: PlayerInitRequest = {
      sessionToken: 'sess_001',
    };

    const response: PlayerInitResponse = {
      ok: true,
      traceId: 'trace-init-001',
      session: {
        accountId: 'acc_001',
        playerId: 'player_001',
        sessionToken: 'sess_001',
        hostPlatform: 'web',
        needsPlayerInitialization: false,
      },
      snapshot: {
        accountId: 'acc_001',
        player: {
          playerId: 'player_001',
          playerName: '召唤师0001',
          level: 1,
          initializedAt: '2026-04-06T00:00:00.000Z',
        },
        resources: {
          gold: 1000,
          gem: 100,
          stamina: 20,
        },
        beasts: [
          {
            beastInstanceId: 'beast_inst_001',
            beastId: 'starter-beast-001',
            beastName: '初始幻兽',
            level: 1,
            role: 'starter',
          },
        ],
        defaultTeam: {
          teamId: 'team_001',
          name: '默认队伍',
          beastInstanceIds: ['beast_inst_001'],
        },
      },
    };

    expect(request.sessionToken).toBe('sess_001');
    expect(response.snapshot.player.playerId).toBe(response.session.playerId);
  });

  it('exports stable error codes for invalid player init input and session', () => {
    expect(PLAYER_INIT_ERROR_CODES).toEqual([
      'PLAYER_INIT_INVALID_INPUT',
      'PLAYER_INIT_INVALID_SESSION',
    ]);
  });
});

describe('shared inventory types', () => {
  it('supports a server-authoritative inventory snapshot with separate resources and bag state', () => {
    const request: InventorySnapshotRequest = {
      sessionToken: 'sess_001',
    };

    const response: InventorySnapshotResponse = {
      ok: true,
      traceId: 'trace-inventory-001',
      snapshot: {
        accountId: 'acc_001',
        playerId: 'player_001',
        resources: {
          gold: 1000,
          gem: 100,
          stamina: 20,
        },
        bag: {
          items: [
            {
              slotId: 'bag-slot-0001',
              itemId: 'item_1027',
              itemName: '回城符',
              itemType: 'consumable',
              quantity: 5,
              stackable: true,
            },
          ],
          capacity: {
            usedSlots: 1,
            totalSlots: 20,
            freeSlots: 19,
          },
        },
        updatedAt: '2026-04-06T00:00:00.000Z',
      },
    };

    expect(request.sessionToken).toBe('sess_001');
    expect(response.snapshot.bag.items[0]?.itemName).toBe('回城符');
    expect(response.snapshot.bag.capacity.freeSlots).toBe(19);
  });

  it('exports stable inventory error codes for invalid input, session and missing state', () => {
    expect(INVENTORY_ERROR_CODES).toEqual([
      'INVENTORY_INVALID_INPUT',
      'INVENTORY_INVALID_SESSION',
      'INVENTORY_STATE_MISSING',
    ]);
  });
});

describe('shared beast list types', () => {
  it('supports a server-authoritative beast list response with一期基础状态字段', () => {
    const request: BeastListRequest = {
      sessionToken: 'sess_001',
    };

    const response: BeastListResponse = {
      ok: true,
      traceId: 'trace-beast-001',
      beasts: [
        {
          beastInstanceId: 'beast_inst_001',
          beastId: 'starter-beast-001',
          beastName: '初始幻兽',
          level: 1,
          role: 'starter',
          inDefaultTeam: true,
          availableForBattle: true,
        },
      ],
    };

    expect(request.sessionToken).toBe('sess_001');
    expect(response.beasts[0]?.beastName).toBe('初始幻兽');
    expect(response.beasts[0]?.inDefaultTeam).toBe(true);
  });

  it('exports stable beast list error codes', () => {
    expect(BEAST_LIST_ERROR_CODES).toEqual([
      'BEAST_LIST_INVALID_INPUT',
      'BEAST_LIST_INVALID_SESSION',
      'BEAST_LIST_STATE_MISSING',
    ]);
  });
});

describe('shared beast detail types', () => {
  it('supports a server-authoritative beast detail response with team summary fields', () => {
    const request: BeastDetailRequest = {
      sessionToken: 'sess_001',
      beastInstanceId: 'beast_inst_001',
    };

    const response: BeastDetailResponse = {
      ok: true,
      traceId: 'trace-detail-001',
      beast: {
        beastInstanceId: 'beast_inst_001',
        beastId: 'starter-beast-001',
        beastName: '初始幻兽',
        level: 1,
        role: 'starter',
        inDefaultTeam: true,
        availableForBattle: true,
        canSetAsDefault: false,
      },
      defaultTeam: {
        teamId: 'team_001',
        name: '默认队伍',
        beastInstanceIds: ['beast_inst_001'],
        capacity: 1,
      },
    };

    expect(request.beastInstanceId).toBe('beast_inst_001');
    expect(response.beast.beastName).toBe('初始幻兽');
    expect(response.defaultTeam.capacity).toBe(1);
  });

  it('exports stable beast detail error codes', () => {
    expect(BEAST_DETAIL_ERROR_CODES).toEqual([
      'BEAST_DETAIL_INVALID_INPUT',
      'BEAST_DETAIL_INVALID_SESSION',
      'BEAST_DETAIL_STATE_MISSING',
      'BEAST_DETAIL_NOT_FOUND',
    ]);
  });
});

describe('shared default team setup types', () => {
  it('supports a controlled default team setup request and success response', () => {
    const request: DefaultTeamSetupRequest = {
      sessionToken: 'sess_001',
      beastInstanceIds: ['beast_inst_002'],
    };

    const response: DefaultTeamSetupResponse = {
      ok: true,
      traceId: 'trace-team-001',
      message: '默认队伍已更新',
      beast: {
        beastInstanceId: 'beast_inst_002',
        beastId: 'starter-beast-002',
        beastName: '风刃灵',
        level: 1,
        role: 'assault',
        inDefaultTeam: true,
        availableForBattle: true,
        canSetAsDefault: false,
      },
      defaultTeam: {
        teamId: 'team_001',
        name: '默认队伍',
        beastInstanceIds: ['beast_inst_002'],
        capacity: 1,
      },
    };

    expect(request.beastInstanceIds).toEqual(['beast_inst_002']);
    expect(response.defaultTeam.beastInstanceIds).toEqual(['beast_inst_002']);
    expect(response.message).toBe('默认队伍已更新');
  });

  it('exports stable default team setup error codes', () => {
    expect(DEFAULT_TEAM_SETUP_ERROR_CODES).toEqual([
      'DEFAULT_TEAM_SETUP_INVALID_INPUT',
      'DEFAULT_TEAM_SETUP_INVALID_SESSION',
      'DEFAULT_TEAM_SETUP_STATE_MISSING',
      'DEFAULT_TEAM_SETUP_BEAST_NOT_FOUND',
      'DEFAULT_TEAM_SETUP_TEAM_CAPACITY_EXCEEDED',
      'DEFAULT_TEAM_SETUP_DUPLICATE_BEAST',
    ]);
  });
});

describe('shared reward claim types', () => {
  it('supports a controlled reward claim request and a blocked capacity response', () => {
    const request: RewardClaimRequest = {
      sessionToken: 'sess_001',
      rewardBundleId: 'inventory-demo-overflow-reward',
    };

    const response: RewardClaimResponse = {
      ok: false,
      traceId: 'trace-reward-001',
      error: {
        code: 'REWARD_CLAIM_CAPACITY_BLOCKED',
        message: '背包容量不足，奖励已被阻断',
        retryable: true,
        details: {
          storage: 'bag',
          freeSlots: 0,
          requiredSlots: 20,
          missingSlots: 20,
          guidance: '请先整理、消耗或清出背包空位后再继续领取奖励。',
          blockedItems: [
            {
              itemId: 'item_reward_001',
              itemName: '战利箱',
              itemType: 'consumable',
              quantity: 1,
              stackable: false,
            },
          ],
        },
      },
    };

    expect(request.rewardBundleId).toBe('inventory-demo-overflow-reward');
    expect(response.error.details?.missingSlots).toBe(20);
    expect(response.error.details?.blockedItems[0]?.itemName).toBe('战利箱');
  });

  it('exports stable reward bundle ids and reward claim error codes', () => {
    expect(REWARD_BUNDLE_IDS).toEqual([
      'inventory-demo-single-reward',
      'inventory-demo-overflow-reward',
    ]);
    expect(REWARD_CLAIM_ERROR_CODES).toEqual([
      'REWARD_CLAIM_INVALID_INPUT',
      'REWARD_CLAIM_INVALID_SESSION',
      'REWARD_CLAIM_STATE_MISSING',
      'REWARD_CLAIM_CAPACITY_BLOCKED',
    ]);
  });
});

describe('shared resource consume types', () => {
  it('supports a controlled consume action request and a resource-insufficient response', () => {
    const request: ResourceConsumeRequest = {
      sessionToken: 'sess_001',
      actionId: 'deduct-growth-gold',
    };

    const response: ResourceConsumeResponse = {
      ok: false,
      traceId: 'trace-consume-001',
      error: {
        code: 'RESOURCE_CONSUME_RESOURCE_INSUFFICIENT',
        message: '金币不足，无法完成当前扣减动作',
        retryable: true,
        details: {
          reason: 'resource_insufficient',
          actionId: 'deduct-growth-gold',
          guidance: '请先获取更多金币后再尝试。',
          resourceType: 'gold',
          currentAmount: 100,
          requiredAmount: 200,
        },
      },
    };

    expect(request.actionId).toBe('deduct-growth-gold');
    expect(response.error.details?.reason).toBe('resource_insufficient');
    if (response.error.details?.reason !== 'resource_insufficient') {
      throw new Error('Expected resource_insufficient details');
    }
    expect(response.error.details.requiredAmount).toBe(200);
  });

  it('exports stable consume action ids and error codes', () => {
    expect(RESOURCE_CONSUME_ACTION_IDS).toEqual([
      'use-return-scroll',
      'deduct-growth-gold',
    ]);
    expect(RESOURCE_CONSUME_ERROR_CODES).toEqual([
      'RESOURCE_CONSUME_INVALID_INPUT',
      'RESOURCE_CONSUME_INVALID_SESSION',
      'RESOURCE_CONSUME_STATE_MISSING',
      'RESOURCE_CONSUME_ACTION_NOT_ALLOWED',
      'RESOURCE_CONSUME_ITEM_INSUFFICIENT',
      'RESOURCE_CONSUME_RESOURCE_INSUFFICIENT',
    ]);
  });
});

describe('shared beast growth types', () => {
  it('supports a basic beast growth request and a resource-insufficient response', () => {
    const request: BeastGrowthRequest = {
      sessionToken: 'sess_001',
      beastInstanceId: 'beast_inst_001',
      actionId: 'basic-level-up',
    };

    const response: BeastGrowthResponse = {
      ok: false,
      traceId: 'trace-growth-001',
      error: {
        code: 'BEAST_GROWTH_RESOURCE_INSUFFICIENT',
        message: '金币不足，无法完成本次培养',
        retryable: true,
        details: {
          reason: 'resource_insufficient',
          actionId: 'basic-level-up',
          guidance: '请先获取更多金币后再尝试培养。',
          resourceType: 'gold',
          currentAmount: 100,
          requiredAmount: 200,
        },
      },
    };

    expect(request.actionId).toBe('basic-level-up');
    expect(response.error.details?.reason).toBe('resource_insufficient');
    if (response.error.details?.reason !== 'resource_insufficient') {
      throw new Error('Expected resource_insufficient details');
    }
    expect(response.error.details.requiredAmount).toBe(200);
  });

  it('exports stable beast growth action ids and error codes', () => {
    expect(BEAST_GROWTH_ACTION_IDS).toEqual(['basic-level-up']);
    expect(BEAST_GROWTH_ERROR_CODES).toEqual([
      'BEAST_GROWTH_INVALID_INPUT',
      'BEAST_GROWTH_INVALID_SESSION',
      'BEAST_GROWTH_STATE_MISSING',
      'BEAST_GROWTH_BEAST_NOT_FOUND',
      'BEAST_GROWTH_ACTION_NOT_ALLOWED',
      'BEAST_GROWTH_RESOURCE_INSUFFICIENT',
    ]);
  });
});
