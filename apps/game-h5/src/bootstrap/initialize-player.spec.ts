import { initializePlayer } from './initialize-player';

describe('initializePlayer', () => {
  it('requests the authoritative init snapshot and persists both session and snapshot', async () => {
    const response = await initializePlayer({
      session: {
        accountId: 'acc_001',
        playerId: null,
        sessionToken: 'sess_001',
        hostPlatform: 'web',
        needsPlayerInitialization: true,
      },
      initPlayer: vi.fn().mockResolvedValue({
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
      persistSession: vi.fn(),
      persistSnapshot: vi.fn(),
    });

    expect(response.ok).toBe(true);
  });

  it('clears stale snapshots and surfaces an initialization failure to callers', async () => {
    const clearSnapshot = vi.fn();

    const response = await initializePlayer(
      {
        accountId: 'acc_001',
        playerId: null,
        sessionToken: 'sess_001',
        hostPlatform: 'web',
        needsPlayerInitialization: true,
      },
      {
        initPlayer: vi.fn().mockResolvedValue({
          ok: false,
          traceId: 'trace-init-err',
          error: {
            code: 'PLAYER_INIT_INVALID_SESSION',
            message: '初始化会话无效',
            retryable: false,
          },
        }),
        clearSnapshot,
      },
    );

    expect(response.ok).toBe(false);
    expect(clearSnapshot).toHaveBeenCalledTimes(1);
  });
});
