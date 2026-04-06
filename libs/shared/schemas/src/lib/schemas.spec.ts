import {
  beastGrowthRequestSchema,
  beastGrowthResponseSchema,
  beastDetailRequestSchema,
  beastDetailResponseSchema,
  beastListRequestSchema,
  beastListResponseSchema,
  defaultTeamSetupRequestSchema,
  defaultTeamSetupResponseSchema,
  inventorySnapshotRequestSchema,
  inventorySnapshotResponseSchema,
  parseBeastGrowthRequest,
  parseBeastGrowthResponse,
  parseBeastDetailRequest,
  parseBeastDetailResponse,
  parseBeastListRequest,
  parseBeastListResponse,
  parseDefaultTeamSetupRequest,
  parseDefaultTeamSetupResponse,
  parseInventorySnapshotRequest,
  parseInventorySnapshotResponse,
  parsePlayerInitRequest,
  parsePlayerInitResponse,
  parseResourceConsumeRequest,
  parseResourceConsumeResponse,
  parseRewardClaimRequest,
  parseRewardClaimResponse,
  playerInitRequestSchema,
  playerInitResponseSchema,
  resourceConsumeRequestSchema,
  resourceConsumeResponseSchema,
  rewardClaimRequestSchema,
  rewardClaimResponseSchema,
  parseSessionAuthRequest,
  parseSessionAuthResponse,
  sessionAuthRequestSchema,
  sessionAuthResponseSchema,
} from './schemas.js';

describe('session auth schemas', () => {
  it('parses a valid unified web auth request', () => {
    const parsed = parseSessionAuthRequest({
      hostPlatform: 'web',
      normalizedHostIdentity: {
        hostPlatform: 'web',
        hostUserId: 'web-user-001',
        sessionProof: 'dev-proof',
        deviceId: 'browser-device-1',
        channel: 'web-portal',
        isDevelopmentFallback: false,
      },
    });

    expect(sessionAuthRequestSchema.parse(parsed)).toEqual(parsed);
  });

  it('rejects mismatched envelope and normalized host platforms', () => {
    expect(() =>
      parseSessionAuthRequest({
        hostPlatform: 'web',
        normalizedHostIdentity: {
          hostPlatform: 'wechat-miniapp',
          hostUserId: 'wx-open-id',
          sessionProof: 'wx-code',
          channel: 'wechat-shell',
          isDevelopmentFallback: false,
        },
      }),
    ).toThrow(/hostPlatform/i);
  });

  it('parses both success and failure responses under one shared contract', () => {
    const success = parseSessionAuthResponse({
      ok: true,
      traceId: 'trace-001',
      session: {
        accountId: 'acc_001',
        playerId: null,
        sessionToken: 'sess_001',
        hostPlatform: 'wechat-miniapp',
        needsPlayerInitialization: true,
      },
    });

    const failure = parseSessionAuthResponse({
      ok: false,
      traceId: 'trace-002',
      error: {
        code: 'SESSION_AUTH_INVALID_INPUT',
        message: '会话请求无效',
        retryable: false,
      },
    });

    expect(sessionAuthResponseSchema.parse(success)).toEqual(success);
    expect(sessionAuthResponseSchema.parse(failure)).toEqual(failure);
  });

  it('parses a valid player initialization request with a session token', () => {
    const parsed = parsePlayerInitRequest({
      sessionToken: 'sess_001',
    });

    expect(playerInitRequestSchema.parse(parsed)).toEqual(parsed);
  });

  it('rejects an empty player initialization session token', () => {
    expect(() =>
      parsePlayerInitRequest({
        sessionToken: '',
      }),
    ).toThrow(/sessionToken/i);
  });

  it('parses both success and invalid-session responses for player init', () => {
    const success = parsePlayerInitResponse({
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
    });

    const failure = parsePlayerInitResponse({
      ok: false,
      traceId: 'trace-init-002',
      error: {
        code: 'PLAYER_INIT_INVALID_SESSION',
        message: '初始化会话无效',
        retryable: false,
      },
    });

    expect(playerInitResponseSchema.parse(success)).toEqual(success);
    expect(playerInitResponseSchema.parse(failure)).toEqual(failure);
  });
});

describe('inventory snapshot schemas', () => {
  it('parses a valid inventory snapshot request with a session token', () => {
    const parsed = parseInventorySnapshotRequest({
      sessionToken: 'sess_001',
    });

    expect(inventorySnapshotRequestSchema.parse(parsed)).toEqual(parsed);
  });

  it('rejects an empty inventory snapshot session token', () => {
    expect(() =>
      parseInventorySnapshotRequest({
        sessionToken: '',
      }),
    ).toThrow(/sessionToken/i);
  });

  it('parses success and failure payloads for the authoritative inventory snapshot', () => {
    const success = parseInventorySnapshotResponse({
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
    });

    const failure = parseInventorySnapshotResponse({
      ok: false,
      traceId: 'trace-inventory-002',
      error: {
        code: 'INVENTORY_INVALID_SESSION',
        message: '库存会话无效',
        retryable: false,
      },
    });

    expect(inventorySnapshotResponseSchema.parse(success)).toEqual(success);
    expect(inventorySnapshotResponseSchema.parse(failure)).toEqual(failure);
  });
});

describe('beast list schemas', () => {
  it('parses a valid beast list request with a session token', () => {
    const parsed = parseBeastListRequest({
      sessionToken: 'sess_001',
    });

    expect(beastListRequestSchema.parse(parsed)).toEqual(parsed);
  });

  it('rejects an empty beast list session token', () => {
    expect(() =>
      parseBeastListRequest({
        sessionToken: '',
      }),
    ).toThrow(/sessionToken/i);
  });

  it('parses success and invalid-session payloads for the authoritative beast list flow', () => {
    const success = parseBeastListResponse({
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
    });

    const failure = parseBeastListResponse({
      ok: false,
      traceId: 'trace-beast-002',
      error: {
        code: 'BEAST_LIST_INVALID_SESSION',
        message: '幻兽列表会话无效',
        retryable: false,
      },
    });

    expect(beastListResponseSchema.parse(success)).toEqual(success);
    expect(beastListResponseSchema.parse(failure)).toEqual(failure);
  });
});

describe('beast detail schemas', () => {
  it('parses a valid beast detail request with session token and beast instance id', () => {
    const parsed = parseBeastDetailRequest({
      sessionToken: 'sess_001',
      beastInstanceId: 'beast_inst_001',
    });

    expect(beastDetailRequestSchema.parse(parsed)).toEqual(parsed);
  });

  it('rejects an empty session token or beast instance id for beast detail', () => {
    expect(() =>
      parseBeastDetailRequest({
        sessionToken: '',
        beastInstanceId: 'beast_inst_001',
      }),
    ).toThrow(/sessionToken/i);

    expect(() =>
      parseBeastDetailRequest({
        sessionToken: 'sess_001',
        beastInstanceId: '',
      }),
    ).toThrow(/beastInstanceId/i);
  });

  it('parses success and not-found payloads for the authoritative beast detail flow', () => {
    const success = parseBeastDetailResponse({
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
    });

    const failure = parseBeastDetailResponse({
      ok: false,
      traceId: 'trace-detail-002',
      error: {
        code: 'BEAST_DETAIL_NOT_FOUND',
        message: '目标幻兽不存在',
        retryable: false,
      },
    });

    expect(beastDetailResponseSchema.parse(success)).toEqual(success);
    expect(beastDetailResponseSchema.parse(failure)).toEqual(failure);
  });
});

describe('default team setup schemas', () => {
  it('parses a valid default team setup request', () => {
    const parsed = parseDefaultTeamSetupRequest({
      sessionToken: 'sess_001',
      beastInstanceIds: ['beast_inst_002'],
    });

    expect(defaultTeamSetupRequestSchema.parse(parsed)).toEqual(parsed);
  });

  it('rejects empty session token, empty team payload or duplicate beast ids', () => {
    expect(() =>
      parseDefaultTeamSetupRequest({
        sessionToken: '',
        beastInstanceIds: ['beast_inst_002'],
      }),
    ).toThrow(/sessionToken/i);

    expect(() =>
      parseDefaultTeamSetupRequest({
        sessionToken: 'sess_001',
        beastInstanceIds: [],
      }),
    ).toThrow(/beastInstanceIds/i);

    expect(() =>
      parseDefaultTeamSetupRequest({
        sessionToken: 'sess_001',
        beastInstanceIds: ['beast_inst_002', 'beast_inst_002'],
      }),
    ).toThrow(/duplicate/i);
  });

  it('parses success and invalid-session payloads for the authoritative default team setup flow', () => {
    const success = parseDefaultTeamSetupResponse({
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
    });

    const failure = parseDefaultTeamSetupResponse({
      ok: false,
      traceId: 'trace-team-002',
      error: {
        code: 'DEFAULT_TEAM_SETUP_INVALID_SESSION',
        message: '默认队伍配置会话无效',
        retryable: false,
      },
    });

    expect(defaultTeamSetupResponseSchema.parse(success)).toEqual(success);
    expect(defaultTeamSetupResponseSchema.parse(failure)).toEqual(failure);
  });
});

describe('reward claim schemas', () => {
  it('parses a valid reward claim request with a controlled reward bundle id', () => {
    const parsed = parseRewardClaimRequest({
      sessionToken: 'sess_001',
      rewardBundleId: 'inventory-demo-single-reward',
    });

    expect(rewardClaimRequestSchema.parse(parsed)).toEqual(parsed);
  });

  it('rejects an empty session token or unknown reward bundle id', () => {
    expect(() =>
      parseRewardClaimRequest({
        sessionToken: '',
        rewardBundleId: 'inventory-demo-single-reward',
      }),
    ).toThrow(/sessionToken/i);

    expect(() =>
      parseRewardClaimRequest({
        sessionToken: 'sess_001',
        rewardBundleId: 'unknown-reward',
      }),
    ).toThrow(/rewardBundleId/i);
  });

  it('parses success and blocked payloads for the authoritative reward claim flow', () => {
    const success = parseRewardClaimResponse({
      ok: true,
      traceId: 'trace-reward-001',
      rewardBundleId: 'inventory-demo-single-reward',
      grantedItems: [
        {
          itemId: 'item_reward_001',
          itemName: '战利箱',
          itemType: 'consumable',
          quantity: 1,
          stackable: false,
        },
      ],
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
            {
              slotId: 'bag-slot-0002',
              itemId: 'item_reward_001',
              itemName: '战利箱',
              itemType: 'consumable',
              quantity: 1,
              stackable: false,
            },
          ],
          capacity: {
            usedSlots: 2,
            totalSlots: 20,
            freeSlots: 18,
          },
        },
        updatedAt: '2026-04-06T00:00:00.000Z',
      },
    });

    const blocked = parseRewardClaimResponse({
      ok: false,
      traceId: 'trace-reward-002',
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
    });

    expect(rewardClaimResponseSchema.parse(success)).toEqual(success);
    expect(rewardClaimResponseSchema.parse(blocked)).toEqual(blocked);
  });
});

describe('resource consume schemas', () => {
  it('parses a valid consume request with a controlled action id', () => {
    const parsed = parseResourceConsumeRequest({
      sessionToken: 'sess_001',
      actionId: 'use-return-scroll',
    });

    expect(resourceConsumeRequestSchema.parse(parsed)).toEqual(parsed);
  });

  it('rejects an empty session token or unknown consume action id', () => {
    expect(() =>
      parseResourceConsumeRequest({
        sessionToken: '',
        actionId: 'use-return-scroll',
      }),
    ).toThrow(/sessionToken/i);

    expect(() =>
      parseResourceConsumeRequest({
        sessionToken: 'sess_001',
        actionId: 'unknown-action',
      }),
    ).toThrow(/actionId/i);
  });

  it('parses success and blocked payloads for the authoritative resource consume flow', () => {
    const success = parseResourceConsumeResponse({
      ok: true,
      traceId: 'trace-consume-001',
      actionId: 'use-return-scroll',
      message: '已使用 回城符 x1，当前剩余 4。',
      consumedItems: [
        {
          itemId: 'item_1027',
          itemName: '回城符',
          quantityConsumed: 1,
          quantityRemaining: 4,
        },
      ],
      consumedResources: [],
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
              quantity: 4,
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
    });

    const blocked = parseResourceConsumeResponse({
      ok: false,
      traceId: 'trace-consume-002',
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
    });

    expect(resourceConsumeResponseSchema.parse(success)).toEqual(success);
    expect(resourceConsumeResponseSchema.parse(blocked)).toEqual(blocked);
  });
});

describe('beast growth schemas', () => {
  it('parses a valid beast growth request', () => {
    const parsed = parseBeastGrowthRequest({
      sessionToken: 'sess_001',
      beastInstanceId: 'beast_inst_001',
      actionId: 'basic-level-up',
    });

    expect(beastGrowthRequestSchema.parse(parsed)).toEqual(parsed);
  });

  it('rejects an empty session token, missing beast id or unknown growth action id', () => {
    expect(() =>
      parseBeastGrowthRequest({
        sessionToken: '',
        beastInstanceId: 'beast_inst_001',
        actionId: 'basic-level-up',
      }),
    ).toThrow(/sessionToken/i);

    expect(() =>
      parseBeastGrowthRequest({
        sessionToken: 'sess_001',
        beastInstanceId: '',
        actionId: 'basic-level-up',
      }),
    ).toThrow(/beastInstanceId/i);

    expect(() =>
      parseBeastGrowthRequest({
        sessionToken: 'sess_001',
        beastInstanceId: 'beast_inst_001',
        actionId: 'unknown-growth',
      }),
    ).toThrow(/actionId/i);
  });

  it('parses success and blocked payloads for the authoritative beast growth flow', () => {
    const success = parseBeastGrowthResponse({
      ok: true,
      traceId: 'trace-growth-001',
      actionId: 'basic-level-up',
      message: '培养成功，初始幻兽提升到 Lv.2。',
      beast: {
        beastInstanceId: 'beast_inst_001',
        beastId: 'starter-beast-001',
        beastName: '初始幻兽',
        level: 2,
        role: 'starter',
        inDefaultTeam: true,
        availableForBattle: true,
        canSetAsDefault: false,
      },
      resources: {
        gold: 800,
        gem: 100,
        stamina: 20,
      },
    });

    const blocked = parseBeastGrowthResponse({
      ok: false,
      traceId: 'trace-growth-002',
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
    });

    expect(beastGrowthResponseSchema.parse(success)).toEqual(success);
    expect(beastGrowthResponseSchema.parse(blocked)).toEqual(blocked);
  });
});
