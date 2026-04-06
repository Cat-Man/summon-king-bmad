import { initializeAppSession } from './init-app';

describe('initializeAppSession', () => {
  it('publishes restoring, initializing, inventory sync and ready phases during a successful bootstrap', async () => {
    const setBootstrapState = vi.fn();

    await initializeAppSession({
      restoreSession: vi.fn().mockResolvedValue({
        ok: true,
        traceId: 'trace-restore-001',
        session: {
          accountId: 'acc_001',
          playerId: null,
          sessionToken: 'sess_001',
          hostPlatform: 'web',
          needsPlayerInitialization: true,
        },
      }),
      initializePlayer: vi.fn().mockResolvedValue({
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
      initializeInventory: vi.fn().mockResolvedValue({
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
      createBridge: () =>
        ({
          getNormalizedHostIdentity: vi.fn(),
        }) as never,
      setBootstrapState,
    });

    expect(setBootstrapState.mock.calls).toEqual([
      [
        {
          phase: 'restoring-session',
          message: '正在连接账号会话...',
          error: null,
        },
      ],
      [
        {
          phase: 'initializing-player',
          message: '正在同步角色与开局数据...',
          error: null,
        },
      ],
      [
        {
          phase: 'initializing-player',
          message: '正在同步背包与资源...',
          error: null,
        },
      ],
      [
        {
          phase: 'ready',
          message: '一期主流程已就绪',
          error: null,
        },
      ],
    ]);
  });

  it('invokes the restore-session bootstrap action', async () => {
    const restoreSession = vi.fn().mockResolvedValue(undefined);

    await initializeAppSession({
      restoreSession,
      createBridge: () =>
        ({
          getNormalizedHostIdentity: vi.fn(),
        }) as never,
    });

    expect(restoreSession).toHaveBeenCalledTimes(1);
  });

  it('requests player initialization after session restore succeeds', async () => {
    const restoreSession = vi.fn().mockResolvedValue({
      ok: true,
      traceId: 'trace-001',
      session: {
        accountId: 'acc_001',
        playerId: null,
        sessionToken: 'sess_001',
        hostPlatform: 'web',
        needsPlayerInitialization: true,
      },
    });
    const initializePlayer = vi.fn().mockResolvedValue(undefined);
    const initializeInventory = vi.fn().mockResolvedValue(undefined);
    initializePlayer.mockResolvedValue({
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
    initializeInventory.mockResolvedValue({
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

    await initializeAppSession({
      restoreSession,
      initializePlayer,
      initializeInventory,
      createBridge: () =>
        ({
          getNormalizedHostIdentity: vi.fn(),
        }) as never,
    });

    expect(initializePlayer).toHaveBeenCalledWith({
      accountId: 'acc_001',
      playerId: null,
      sessionToken: 'sess_001',
      hostPlatform: 'web',
      needsPlayerInitialization: true,
    });

    expect(initializeInventory).toHaveBeenCalledWith({
      accountId: 'acc_001',
      playerId: 'player_001',
      sessionToken: 'sess_001',
      hostPlatform: 'web',
      needsPlayerInitialization: false,
    });
  });

  it('routes bootstrap failures into the provided error hook', async () => {
    const error = new Error('bootstrap failed');
    const onError = vi.fn();

    await initializeAppSession({
      restoreSession: vi.fn().mockRejectedValue(error),
      initializePlayer: vi.fn(),
      createBridge: () =>
        ({
          getNormalizedHostIdentity: vi.fn(),
        }) as never,
      onError,
    });

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('routes non-ok restore or initialization results into the provided error hook', async () => {
    const onError = vi.fn();
    const setBootstrapState = vi.fn();

    await initializeAppSession({
      restoreSession: vi.fn().mockResolvedValue({
        ok: false,
        traceId: 'trace-auth-failed',
        error: {
          code: 'SESSION_AUTH_INVALID_INPUT',
          message: '统一会话请求无效',
          retryable: false,
        },
      }),
      initializePlayer: vi.fn(),
      createBridge: () =>
        ({
          getNormalizedHostIdentity: vi.fn(),
        }) as never,
      setBootstrapState,
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(setBootstrapState).toHaveBeenLastCalledWith({
      phase: 'error',
      message: '统一会话请求无效',
      error: {
        title: '进入失败',
        message: '统一会话请求无效',
        traceId: 'trace-auth-failed',
        retryable: false,
      },
    });
  });

  it('maps thrown network errors into a retryable entry failure state', async () => {
    const setBootstrapState = vi.fn();

    await initializeAppSession({
      restoreSession: vi.fn().mockRejectedValue(new Error('fetch failed')),
      initializePlayer: vi.fn(),
      createBridge: () =>
        ({
          getNormalizedHostIdentity: vi.fn(),
        }) as never,
      setBootstrapState,
    });

    expect(setBootstrapState).toHaveBeenLastCalledWith({
      phase: 'error',
      message: '网络连接异常，请重试',
      error: {
        title: '连接失败',
        message: '网络连接异常，请重试',
        retryable: true,
      },
    });
  });
});
