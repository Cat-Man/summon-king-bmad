import {
  applyResourceConsumeAction,
  applyRewardBundleToInventory,
  buildStarterInventorySnapshot,
  buildStarterPlayerState,
} from './domain.js';

describe('buildStarterPlayerState', () => {
  it('builds a complete starter snapshot for a new account', () => {
    const initialized = buildStarterPlayerState({
      accountId: 'acc_0001',
      hostPlatform: 'web',
      sessionToken: 'sess_0001',
      now: '2026-04-06T00:00:00.000Z',
    });

    expect(initialized.snapshot).toMatchObject({
      accountId: 'acc_0001',
      player: {
        playerId: 'player_0001',
        playerName: '召唤师0001',
        level: 1,
        initializedAt: '2026-04-06T00:00:00.000Z',
      },
      resources: {
        gold: 1000,
        gem: 100,
        stamina: 20,
      },
      defaultTeam: {
        teamId: 'team_0001',
        name: '默认队伍',
        beastInstanceIds: ['beast_inst_0001'],
      },
    });
    expect(initialized.session).toMatchObject({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      sessionToken: 'sess_0001',
      hostPlatform: 'web',
      needsPlayerInitialization: false,
    });
  });

  it('builds a starter inventory snapshot with separate resources, bag items and capacity', () => {
    const inventory = buildStarterInventorySnapshot({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      now: '2026-04-06T00:00:00.000Z',
    });

    expect(inventory).toMatchObject({
      accountId: 'acc_0001',
      playerId: 'player_0001',
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
    });
  });

  it('applies a controlled single reward bundle into the authoritative inventory snapshot', () => {
    const inventory = buildStarterInventorySnapshot({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      now: '2026-04-06T00:00:00.000Z',
    });

    const result = applyRewardBundleToInventory({
      snapshot: inventory,
      rewardBundleId: 'inventory-demo-single-reward',
      now: '2026-04-06T00:10:00.000Z',
    });

    expect(result).toMatchObject({
      ok: true,
      rewardBundleId: 'inventory-demo-single-reward',
      grantedItems: [
        {
          itemName: '战利箱',
          quantity: 1,
        },
      ],
      snapshot: {
        bag: {
          capacity: {
            usedSlots: 2,
            totalSlots: 20,
            freeSlots: 18,
          },
        },
      },
    });
  });

  it('returns blocked capacity details without mutating the original snapshot when bag space is insufficient', () => {
    const inventory = buildStarterInventorySnapshot({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      now: '2026-04-06T00:00:00.000Z',
    });

    const result = applyRewardBundleToInventory({
      snapshot: inventory,
      rewardBundleId: 'inventory-demo-overflow-reward',
      now: '2026-04-06T00:10:00.000Z',
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'REWARD_CLAIM_CAPACITY_BLOCKED',
        details: {
          storage: 'bag',
          freeSlots: 19,
          requiredSlots: 20,
          missingSlots: 1,
        },
      },
    });
    expect(inventory.bag.items).toHaveLength(1);
    expect(inventory.bag.capacity.freeSlots).toBe(19);
  });

  it('consumes one return scroll from the authoritative inventory snapshot', () => {
    const inventory = buildStarterInventorySnapshot({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      now: '2026-04-06T00:00:00.000Z',
    });

    const result = applyResourceConsumeAction({
      snapshot: inventory,
      actionId: 'use-return-scroll',
      now: '2026-04-06T00:10:00.000Z',
    });

    expect(result).toMatchObject({
      ok: true,
      actionId: 'use-return-scroll',
      consumedItems: [
        {
          itemId: 'item_1027',
          itemName: '回城符',
          quantityConsumed: 1,
          quantityRemaining: 4,
        },
      ],
      snapshot: {
        bag: {
          items: [
            {
              itemId: 'item_1027',
              quantity: 4,
            },
          ],
        },
      },
    });
  });

  it('deducts controlled growth gold from the authoritative resource snapshot', () => {
    const inventory = buildStarterInventorySnapshot({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      now: '2026-04-06T00:00:00.000Z',
    });

    const result = applyResourceConsumeAction({
      snapshot: inventory,
      actionId: 'deduct-growth-gold',
      now: '2026-04-06T00:10:00.000Z',
    });

    expect(result).toMatchObject({
      ok: true,
      actionId: 'deduct-growth-gold',
      consumedResources: [
        {
          resourceType: 'gold',
          amountConsumed: 200,
          amountRemaining: 800,
        },
      ],
      snapshot: {
        resources: {
          gold: 800,
          gem: 100,
          stamina: 20,
        },
      },
    });
  });

  it('returns an item-insufficient result without mutating the snapshot when the consumable is unavailable', () => {
    const inventory = buildStarterInventorySnapshot({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      now: '2026-04-06T00:00:00.000Z',
    });
    inventory.bag.items = [];
    inventory.bag.capacity.usedSlots = 0;
    inventory.bag.capacity.freeSlots = 20;

    const result = applyResourceConsumeAction({
      snapshot: inventory,
      actionId: 'use-return-scroll',
      now: '2026-04-06T00:10:00.000Z',
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'RESOURCE_CONSUME_ITEM_INSUFFICIENT',
        details: {
          reason: 'item_insufficient',
          itemId: 'item_1027',
          availableQuantity: 0,
          requiredQuantity: 1,
        },
      },
    });
    expect(inventory.bag.items).toEqual([]);
    expect(inventory.bag.capacity.freeSlots).toBe(20);
  });

  it('returns a resource-insufficient result without mutating the snapshot when gold is not enough', () => {
    const inventory = buildStarterInventorySnapshot({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      now: '2026-04-06T00:00:00.000Z',
      resources: {
        gold: 100,
        gem: 100,
        stamina: 20,
      },
    });

    const result = applyResourceConsumeAction({
      snapshot: inventory,
      actionId: 'deduct-growth-gold',
      now: '2026-04-06T00:10:00.000Z',
    });

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: 'RESOURCE_CONSUME_RESOURCE_INSUFFICIENT',
        details: {
          reason: 'resource_insufficient',
          resourceType: 'gold',
          currentAmount: 100,
          requiredAmount: 200,
        },
      },
    });
    expect(inventory.resources.gold).toBe(100);
  });
});
