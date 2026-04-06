import {
  BEAST_GROWTH_CONTRACT,
  BEAST_DETAIL_CONTRACT,
  BEAST_LIST_CONTRACT,
  DEFAULT_TEAM_SETUP_CONTRACT,
  INVENTORY_SNAPSHOT_CONTRACT,
  PLAYER_INIT_CONTRACT,
  RESOURCE_CONSUME_CONTRACT,
  REWARD_CLAIM_CONTRACT,
  SESSION_AUTH_CONTRACT,
} from '@workspace/contracts';
import {
  authenticateSession,
  growBeast,
  claimReward,
  consumeResource,
  fetchBeastDetail,
  fetchBeastList,
  fetchInventorySnapshot,
  initializePlayer,
  setupDefaultTeam,
} from './data-access.js';

describe('authenticateSession', () => {
  it('posts normalized host identity to the shared session auth contract', async () => {
    const request = {
      hostPlatform: 'web' as const,
      normalizedHostIdentity: {
        hostPlatform: 'web' as const,
        hostUserId: 'web-user-001',
        sessionProof: 'dev-proof',
        deviceId: 'browser-device-1',
        channel: 'web-portal',
        isDevelopmentFallback: false,
      },
    };
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
        ok: true,
        traceId: 'trace-001',
        session: {
          accountId: 'acc_001',
          playerId: null,
          sessionToken: 'sess_001',
          hostPlatform: 'web',
          needsPlayerInitialization: true,
        },
      }),
    });

    const response = await authenticateSession(request, {
      baseUrl: 'https://game.example.com',
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith(
      `https://game.example.com${SESSION_AUTH_CONTRACT.path}`,
      {
        method: SESSION_AUTH_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(request),
      },
    );
    expect(response).toMatchObject({
      ok: true,
      traceId: 'trace-001',
      session: {
        accountId: 'acc_001',
        hostPlatform: 'web',
      },
    });
  });

  it('rejects invalid server payloads through the shared schema boundary', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
        ok: true,
        traceId: '',
      }),
    });

    await expect(
      authenticateSession(
        {
          hostPlatform: 'web',
          normalizedHostIdentity: {
            hostPlatform: 'web',
            hostUserId: 'web-user-001',
            isDevelopmentFallback: false,
          },
        },
        { fetcher },
      ),
    ).rejects.toThrow();
  });

  it('posts the current session token to the shared player init contract', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
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
      }),
    });

    const response = await initializePlayer(
      { sessionToken: 'sess_001' },
      {
        baseUrl: 'https://game.example.com',
        fetcher,
      },
    );

    expect(fetcher).toHaveBeenCalledWith(
      `https://game.example.com${PLAYER_INIT_CONTRACT.path}`,
      {
        method: PLAYER_INIT_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: 'sess_001',
        }),
      },
    );
    expect(response.ok).toBe(true);
  });

  it('requests the authoritative inventory snapshot through the shared inventory contract', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
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
      }),
    });

    const response = await fetchInventorySnapshot(
      { sessionToken: 'sess_001' },
      {
        baseUrl: 'https://game.example.com',
        fetcher,
      },
    );

    expect(fetcher).toHaveBeenCalledWith(
      `https://game.example.com${INVENTORY_SNAPSHOT_CONTRACT.path}`,
      {
        method: INVENTORY_SNAPSHOT_CONTRACT.method,
        headers: {
          'x-session-token': 'sess_001',
        },
      },
    );
    expect(response).toMatchObject({
      ok: true,
      snapshot: {
        playerId: 'player_001',
        bag: {
          capacity: {
            totalSlots: 20,
          },
        },
      },
    });
  });

  it('requests the authoritative beast list through the shared beast contract', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
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
      }),
    });

    const response = await fetchBeastList(
      { sessionToken: 'sess_001' },
      {
        baseUrl: 'https://game.example.com',
        fetcher,
      },
    );

    expect(fetcher).toHaveBeenCalledWith(
      `https://game.example.com${BEAST_LIST_CONTRACT.path}`,
      {
        method: BEAST_LIST_CONTRACT.method,
        headers: {
          'x-session-token': 'sess_001',
        },
      },
    );
    expect(response).toMatchObject({
      ok: true,
      beasts: [
        {
          beastName: '初始幻兽',
          inDefaultTeam: true,
        },
      ],
    });
  });

  it('requests the authoritative beast detail through the shared beast detail contract', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
        ok: true,
        traceId: 'trace-beast-detail-001',
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
      }),
    });

    const response = await fetchBeastDetail(
      {
        sessionToken: 'sess_001',
        beastInstanceId: 'beast_inst_001',
      },
      {
        baseUrl: 'https://game.example.com',
        fetcher,
      },
    );

    expect(fetcher).toHaveBeenCalledWith(
      `https://game.example.com${BEAST_DETAIL_CONTRACT.path.replace(':beastInstanceId', 'beast_inst_001')}`,
      {
        method: BEAST_DETAIL_CONTRACT.method,
        headers: {
          'x-session-token': 'sess_001',
        },
      },
    );
    expect(response).toMatchObject({
      ok: true,
      beast: {
        beastName: '初始幻兽',
        canSetAsDefault: false,
      },
      defaultTeam: {
        name: '默认队伍',
        capacity: 1,
      },
    });
  });

  it('posts the default team setup through the shared beast setup contract', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
        ok: true,
        traceId: 'trace-beast-setup-001',
        message: '默认队伍已更新',
        beast: {
          beastInstanceId: 'beast_inst_002',
          beastId: 'starter-beast-002',
          beastName: '烈焰狐',
          level: 3,
          role: 'damage',
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
      }),
    });

    const response = await setupDefaultTeam(
      {
        sessionToken: 'sess_001',
        beastInstanceIds: ['beast_inst_002'],
      },
      {
        baseUrl: 'https://game.example.com',
        fetcher,
      },
    );

    expect(fetcher).toHaveBeenCalledWith(
      `https://game.example.com${DEFAULT_TEAM_SETUP_CONTRACT.path}`,
      {
        method: DEFAULT_TEAM_SETUP_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: 'sess_001',
          beastInstanceIds: ['beast_inst_002'],
        }),
      },
    );
    expect(response).toMatchObject({
      ok: true,
      message: '默认队伍已更新',
      beast: {
        beastName: '烈焰狐',
        inDefaultTeam: true,
      },
      defaultTeam: {
        beastInstanceIds: ['beast_inst_002'],
      },
    });
  });

  it('posts a basic beast growth action through the shared beast growth contract', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
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
      }),
    });

    const response = await growBeast(
      {
        sessionToken: 'sess_001',
        beastInstanceId: 'beast_inst_001',
        actionId: 'basic-level-up',
      },
      {
        baseUrl: 'https://game.example.com',
        fetcher,
      },
    );

    expect(fetcher).toHaveBeenCalledWith(
      `https://game.example.com${BEAST_GROWTH_CONTRACT.path}`,
      {
        method: BEAST_GROWTH_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: 'sess_001',
          beastInstanceId: 'beast_inst_001',
          actionId: 'basic-level-up',
        }),
      },
    );
    expect(response).toMatchObject({
      ok: true,
      actionId: 'basic-level-up',
      beast: {
        beastName: '初始幻兽',
        level: 2,
      },
      resources: {
        gold: 800,
      },
    });
  });

  it('posts a controlled reward bundle claim through the shared reward contract', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
        ok: false,
        traceId: 'trace-reward-001',
        error: {
          code: 'REWARD_CLAIM_CAPACITY_BLOCKED',
          message: '背包容量不足，奖励已被阻断',
          retryable: true,
          details: {
            storage: 'bag',
            freeSlots: 19,
            requiredSlots: 20,
            missingSlots: 1,
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
      }),
    });

    const response = await claimReward(
      {
        sessionToken: 'sess_001',
        rewardBundleId: 'inventory-demo-overflow-reward',
      },
      {
        baseUrl: 'https://game.example.com',
        fetcher,
      },
    );

    expect(fetcher).toHaveBeenCalledWith(
      `https://game.example.com${REWARD_CLAIM_CONTRACT.path}`,
      {
        method: REWARD_CLAIM_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: 'sess_001',
          rewardBundleId: 'inventory-demo-overflow-reward',
        }),
      },
    );
    expect(response).toMatchObject({
      ok: false,
      error: {
        code: 'REWARD_CLAIM_CAPACITY_BLOCKED',
        details: {
          missingSlots: 1,
        },
      },
    });
  });

  it('posts a controlled resource consume action through the shared consume contract', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      json: async () => ({
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
          updatedAt: '2026-04-06T00:10:00.000Z',
        },
      }),
    });

    const response = await consumeResource(
      {
        sessionToken: 'sess_001',
        actionId: 'use-return-scroll',
      },
      {
        baseUrl: 'https://game.example.com',
        fetcher,
      },
    );

    expect(fetcher).toHaveBeenCalledWith(
      `https://game.example.com${RESOURCE_CONSUME_CONTRACT.path}`,
      {
        method: RESOURCE_CONSUME_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: 'sess_001',
          actionId: 'use-return-scroll',
        }),
      },
    );
    expect(response).toMatchObject({
      ok: true,
      actionId: 'use-return-scroll',
      consumedItems: [
        {
          quantityRemaining: 4,
        },
      ],
    });
  });
});
