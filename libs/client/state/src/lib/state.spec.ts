import {
  clearAppBootstrapState,
  clearActiveSession,
  clearInventorySnapshot,
  clearPlayerInitSnapshot,
  getAppBootstrapState,
  getActiveSession,
  getInventorySnapshot,
  getPlayerInitSnapshot,
  setAppBootstrapError,
  setAppBootstrapLoading,
  setAppBootstrapReady,
  setInventorySnapshot,
  setPlayerInitSnapshot,
  setActiveSession,
  subscribeAppBootstrapState,
} from './state.js';

describe('client session state', () => {
  afterEach(() => {
    clearAppBootstrapState();
    clearActiveSession();
    clearInventorySnapshot();
    clearPlayerInitSnapshot();
  });

  it('stores the active unified session in a narrow client boundary', () => {
    const session = {
      accountId: 'acc_001',
      playerId: null,
      sessionToken: 'sess_001',
      hostPlatform: 'web' as const,
      needsPlayerInitialization: true,
    };

    expect(setActiveSession(session)).toEqual(session);
    expect(getActiveSession()).toEqual(session);
  });

  it('clears the active session snapshot when requested', () => {
    setActiveSession({
      accountId: 'acc_001',
      playerId: null,
      sessionToken: 'sess_001',
      hostPlatform: 'web',
      needsPlayerInitialization: true,
    });

    clearActiveSession();

    expect(getActiveSession()).toBeNull();
  });

  it('stores the authoritative player initialization snapshot separately', () => {
    const snapshot = {
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
    };

    expect(setPlayerInitSnapshot(snapshot)).toEqual(snapshot);
    expect(getPlayerInitSnapshot()).toEqual(snapshot);
  });

  it('stores the authoritative inventory snapshot separately from the init snapshot', () => {
    const snapshot = {
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
            itemType: 'consumable' as const,
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
    };

    expect(setInventorySnapshot(snapshot)).toEqual(snapshot);
    expect(getInventorySnapshot()).toEqual(snapshot);

    clearInventorySnapshot();

    expect(getInventorySnapshot()).toBeNull();
  });

  it('tracks the entry bootstrap state in a narrow subscribable boundary', () => {
    const states = [getAppBootstrapState().phase];
    const unsubscribe = subscribeAppBootstrapState((state) => {
      states.push(state.phase);
    });

    setAppBootstrapLoading('restoring-session', '正在恢复账号会话...');
    setAppBootstrapReady('一期主流程已就绪');
    unsubscribe();
    setAppBootstrapError({
      title: '进入失败',
      message: '不会再通知已取消订阅的监听器',
      retryable: true,
    });

    expect(states).toEqual(['idle', 'restoring-session', 'ready']);
  });

  it('stores a mapped bootstrap failure for the entry page to render', () => {
    setAppBootstrapError({
      title: '连接失败',
      message: '网络连接异常，请重试',
      traceId: 'trace-entry-001',
      retryable: true,
    });

    expect(getAppBootstrapState()).toEqual({
      phase: 'error',
      message: '网络连接异常，请重试',
      error: {
        title: '连接失败',
        message: '网络连接异常，请重试',
        traceId: 'trace-entry-001',
        retryable: true,
      },
    });
  });
});
