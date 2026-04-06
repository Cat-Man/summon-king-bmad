import {
  createInMemoryPlayerInitializationRepository,
  createInMemoryPlayerInventoryRepository,
  createInMemoryRewardAuditLogRepository,
} from './db.js';

describe('createInMemoryPlayerInitializationRepository', () => {
  it('stores and retrieves initialized player state by account id', () => {
    const repository = createInMemoryPlayerInitializationRepository();

    expect(repository.findByAccountId('acc_001')).toBeNull();

    repository.save({
      accountId: 'acc_001',
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

    expect(repository.findByAccountId('acc_001')).toMatchObject({
      snapshot: {
        player: {
          playerId: 'player_001',
        },
      },
    });
  });
});

describe('createInMemoryPlayerInventoryRepository', () => {
  it('stores resource and bag state separately and rehydrates an inventory snapshot by player id', () => {
    const repository = createInMemoryPlayerInventoryRepository();

    expect(repository.findResourceState('player_001')).toBeNull();
    expect(repository.findBagState('player_001')).toBeNull();
    expect(repository.findSnapshotByPlayerId('player_001')).toBeNull();

    repository.saveResourceState({
      accountId: 'acc_001',
      playerId: 'player_001',
      resources: {
        gold: 1000,
        gem: 100,
        stamina: 20,
      },
      updatedAt: '2026-04-06T00:00:00.000Z',
    });
    repository.saveBagState({
      accountId: 'acc_001',
      playerId: 'player_001',
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
    });

    expect(repository.findResourceState('player_001')).toMatchObject({
      resources: {
        gold: 1000,
      },
    });
    expect(repository.findBagState('player_001')).toMatchObject({
      bag: {
        capacity: {
          totalSlots: 20,
        },
      },
    });
    expect(repository.findSnapshotByPlayerId('player_001')).toMatchObject({
      playerId: 'player_001',
      resources: {
        gem: 100,
      },
      bag: {
        items: [
          {
            itemName: '回城符',
          },
        ],
      },
    });
  });
});

describe('createInMemoryRewardAuditLogRepository', () => {
  it('stores queryable reward audit records by player id', () => {
    const repository = createInMemoryRewardAuditLogRepository();

    expect(repository.listByPlayerId('player_001')).toEqual([]);

    repository.save({
      traceId: 'trace-reward-001',
      accountId: 'acc_001',
      playerId: 'player_001',
      rewardBundleId: 'inventory-demo-overflow-reward',
      eventType: 'reward.claim',
      status: 'blocked',
      errorCode: 'REWARD_CLAIM_CAPACITY_BLOCKED',
      freeSlots: 0,
      requiredSlots: 2,
      createdAt: '2026-04-06T00:00:00.000Z',
    });

    expect(repository.listByPlayerId('player_001')).toEqual([
      expect.objectContaining({
        traceId: 'trace-reward-001',
        status: 'blocked',
        errorCode: 'REWARD_CLAIM_CAPACITY_BLOCKED',
      }),
    ]);
  });

  it('stores queryable resource consume audit records by player id', () => {
    const repository = createInMemoryRewardAuditLogRepository();

    repository.save({
      traceId: 'trace-consume-001',
      accountId: 'acc_001',
      playerId: 'player_001',
      eventType: 'resource.consume',
      status: 'granted',
      actionId: 'use-return-scroll',
      itemId: 'item_1027',
      itemDelta: -1,
      createdAt: '2026-04-06T00:10:00.000Z',
    });

    expect(repository.listByPlayerId('player_001')).toEqual([
      expect.objectContaining({
        traceId: 'trace-consume-001',
        eventType: 'resource.consume',
        actionId: 'use-return-scroll',
      }),
    ]);
  });
});
