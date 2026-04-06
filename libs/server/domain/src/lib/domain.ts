import type {
  BeastGrowthActionId,
  BeastGrowthError,
  ConsumedItemChange,
  ConsumedResourceChange,
  InventorySnapshot,
  InitializedPlayerState,
  HostPlatform,
  PlayerInitSnapshot,
  ResourceConsumeActionId,
  ResourceConsumeError,
  RewardBundleId,
  RewardClaimError,
  RewardGrantedItem,
  ResourceSnapshot,
} from '@workspace/types';

const STARTER_RESOURCES: ResourceSnapshot = {
  gold: 1000,
  gem: 100,
  stamina: 20,
};

const STARTER_BAG_ITEM = {
  slotId: 'bag-slot-0001',
  itemId: 'item_1027',
  itemName: '回城符',
  itemType: 'consumable',
  quantity: 5,
  stackable: true,
} as const;

const STARTER_BAG_TOTAL_SLOTS = 20;
const RETURN_SCROLL_ITEM_ID = 'item_1027';
const RETURN_SCROLL_ITEM_NAME = '回城符';
const GROWTH_GOLD_COST = 200;

const STARTER_BEAST = {
  beastId: 'starter-beast-001',
  beastName: '初始幻兽',
  role: 'starter',
} as const;

interface RewardBundleEntry extends RewardGrantedItem {
  requiredSlots?: number;
}

const REWARD_BUNDLES: Record<
  RewardBundleId,
  {
    items: RewardBundleEntry[];
  }
> = {
  'inventory-demo-single-reward': {
    items: [
      {
        itemId: 'item_reward_001',
        itemName: '战利箱',
        itemType: 'consumable',
        quantity: 1,
        stackable: false,
      },
    ],
  },
  'inventory-demo-overflow-reward': {
    items: [
      {
        itemId: 'item_reward_001',
        itemName: '战利箱',
        itemType: 'consumable',
        quantity: 1,
        stackable: false,
        requiredSlots: 20,
      },
    ],
  },
};

function extractAccountSuffix(accountId: string): string {
  const rawSuffix = accountId.split('_').at(-1) ?? '0001';
  return rawSuffix.padStart(4, '0');
}

function extractNextSlotNumber(snapshot: InventorySnapshot): number {
  return snapshot.bag.items.reduce((maxValue, item) => {
    const current = Number(item.slotId.replace('bag-slot-', ''));
    return Number.isNaN(current) ? maxValue : Math.max(maxValue, current);
  }, 0);
}

function formatBagSlotId(index: number): string {
  return `bag-slot-${String(index).padStart(4, '0')}`;
}

function expandBundleEntryToBagItems(
  entry: RewardBundleEntry,
  nextSlotNumber: number,
): InventorySnapshot['bag']['items'] {
  if (entry.stackable) {
    return [
      {
        slotId: formatBagSlotId(nextSlotNumber),
        itemId: entry.itemId,
        itemName: entry.itemName,
        itemType: entry.itemType,
        quantity: entry.quantity,
        stackable: true,
      },
    ];
  }

  const slotCount = entry.requiredSlots ?? entry.quantity;
  return Array.from({ length: slotCount }, (_, index) => ({
    slotId: formatBagSlotId(nextSlotNumber + index),
    itemId: entry.itemId,
    itemName: entry.itemName,
    itemType: entry.itemType,
    quantity: 1,
    stackable: false,
  }));
}

function calculateRequiredSlots(entry: RewardBundleEntry): number {
  if (entry.stackable) {
    return 1;
  }

  return entry.requiredSlots ?? entry.quantity;
}

export type RewardBundleApplicationResult =
  | {
      ok: true;
      rewardBundleId: RewardBundleId;
      grantedItems: RewardGrantedItem[];
      snapshot: InventorySnapshot;
    }
  | {
      ok: false;
      error: RewardClaimError;
    };

export type ResourceConsumeActionResult =
  | {
      ok: true;
      actionId: ResourceConsumeActionId;
      message: string;
      consumedItems: ConsumedItemChange[];
      consumedResources: ConsumedResourceChange[];
      snapshot: InventorySnapshot;
    }
  | {
      ok: false;
      error: ResourceConsumeError;
    };

export type BeastGrowthActionResult =
  | {
      ok: true;
      actionId: BeastGrowthActionId;
      message: string;
      beast: PlayerInitSnapshot['beasts'][number];
      consumedResources: ConsumedResourceChange[];
      snapshot: PlayerInitSnapshot;
    }
  | {
      ok: false;
      error: BeastGrowthError;
    };

function cloneInventorySnapshot(snapshot: InventorySnapshot): InventorySnapshot {
  return {
    ...snapshot,
    resources: {
      ...snapshot.resources,
    },
    bag: {
      items: snapshot.bag.items.map((item) => ({ ...item })),
      capacity: {
        ...snapshot.bag.capacity,
      },
    },
  };
}

function clonePlayerInitSnapshot(snapshot: PlayerInitSnapshot): PlayerInitSnapshot {
  return {
    ...snapshot,
    player: {
      ...snapshot.player,
    },
    resources: {
      ...snapshot.resources,
    },
    beasts: snapshot.beasts.map((beast) => ({ ...beast })),
    defaultTeam: {
      ...snapshot.defaultTeam,
      beastInstanceIds: [...snapshot.defaultTeam.beastInstanceIds],
    },
  };
}

function buildItemInsufficientError({
  actionId,
  availableQuantity,
}: {
  actionId: ResourceConsumeActionId;
  availableQuantity: number;
}): ResourceConsumeError {
  return {
    code: 'RESOURCE_CONSUME_ITEM_INSUFFICIENT',
    message: '回城符不足，无法执行当前消耗动作',
    retryable: true,
    details: {
      reason: 'item_insufficient',
      actionId,
      guidance: '请先补充回城符后再尝试。',
      itemId: RETURN_SCROLL_ITEM_ID,
      itemName: RETURN_SCROLL_ITEM_NAME,
      availableQuantity,
      requiredQuantity: 1,
    },
  };
}

function buildGoldInsufficientError(
  actionId: ResourceConsumeActionId,
  currentAmount: number,
): ResourceConsumeError {
  return {
    code: 'RESOURCE_CONSUME_RESOURCE_INSUFFICIENT',
    message: '金币不足，无法完成当前扣减动作',
    retryable: true,
    details: {
      reason: 'resource_insufficient',
      actionId,
      guidance: '请先获取更多金币后再尝试。',
      resourceType: 'gold',
      currentAmount,
      requiredAmount: GROWTH_GOLD_COST,
    },
  };
}

function buildBeastGrowthGoldInsufficientError(
  actionId: BeastGrowthActionId,
  currentAmount: number,
): BeastGrowthError {
  return {
    code: 'BEAST_GROWTH_RESOURCE_INSUFFICIENT',
    message: '金币不足，无法完成本次培养',
    retryable: true,
    details: {
      reason: 'resource_insufficient',
      actionId,
      guidance: '请先获取更多金币后再尝试培养。',
      resourceType: 'gold',
      currentAmount,
      requiredAmount: GROWTH_GOLD_COST,
    },
  };
}

export function buildStarterPlayerState({
  accountId,
  hostPlatform,
  sessionToken,
  now,
}: {
  accountId: string;
  hostPlatform: HostPlatform;
  sessionToken: string;
  now: string;
}): InitializedPlayerState {
  const suffix = extractAccountSuffix(accountId);
  const playerId = `player_${suffix}`;
  const beastInstanceId = `beast_inst_${suffix}`;
  const teamId = `team_${suffix}`;

  return {
    accountId,
    session: {
      accountId,
      playerId,
      sessionToken,
      hostPlatform,
      needsPlayerInitialization: false,
    },
    snapshot: {
      accountId,
      player: {
        playerId,
        playerName: `召唤师${suffix}`,
        level: 1,
        initializedAt: now,
      },
      resources: {
        ...STARTER_RESOURCES,
      },
      beasts: [
        {
          beastInstanceId,
          beastId: STARTER_BEAST.beastId,
          beastName: STARTER_BEAST.beastName,
          level: 1,
          role: STARTER_BEAST.role,
        },
      ],
      defaultTeam: {
        teamId,
        name: '默认队伍',
        beastInstanceIds: [beastInstanceId],
      },
    },
  };
}

export function buildStarterInventorySnapshot({
  accountId,
  playerId,
  now,
  resources = STARTER_RESOURCES,
}: {
  accountId: string;
  playerId: string;
  now: string;
  resources?: ResourceSnapshot;
}): InventorySnapshot {
  const items = [{ ...STARTER_BAG_ITEM }];
  const usedSlots = items.length;

  return {
    accountId,
    playerId,
    resources: {
      ...resources,
    },
    bag: {
      items,
      capacity: {
        usedSlots,
        totalSlots: STARTER_BAG_TOTAL_SLOTS,
        freeSlots: STARTER_BAG_TOTAL_SLOTS - usedSlots,
      },
    },
    updatedAt: now,
  };
}

export function applyRewardBundleToInventory({
  snapshot,
  rewardBundleId,
  now,
}: {
  snapshot: InventorySnapshot;
  rewardBundleId: RewardBundleId;
  now: string;
}): RewardBundleApplicationResult {
  const rewardBundle = REWARD_BUNDLES[rewardBundleId];
  const grantedItems = rewardBundle.items.map((item) => ({
    itemId: item.itemId,
    itemName: item.itemName,
    itemType: item.itemType,
    quantity: item.quantity,
    stackable: item.stackable,
  }));
  const requiredSlots = rewardBundle.items.reduce(
    (sum, item) => sum + calculateRequiredSlots(item),
    0,
  );

  if (snapshot.bag.capacity.freeSlots < requiredSlots) {
    return {
      ok: false,
      error: {
        code: 'REWARD_CLAIM_CAPACITY_BLOCKED',
        message: '背包容量不足，奖励已被阻断',
        retryable: true,
        details: {
          storage: 'bag',
          freeSlots: snapshot.bag.capacity.freeSlots,
          requiredSlots,
          missingSlots: requiredSlots - snapshot.bag.capacity.freeSlots,
          guidance: '请先整理、消耗或清出背包空位后再继续领取奖励。',
          blockedItems: grantedItems,
        },
      },
    };
  }

  const nextSlotStart = extractNextSlotNumber(snapshot) + 1;
  const appendedItems = rewardBundle.items.flatMap((item, index) =>
    expandBundleEntryToBagItems(
      item,
      nextSlotStart +
        rewardBundle.items
          .slice(0, index)
          .reduce((sum, previous) => sum + calculateRequiredSlots(previous), 0),
    ),
  );
  const items = [...snapshot.bag.items.map((item) => ({ ...item })), ...appendedItems];
  const usedSlots = snapshot.bag.capacity.usedSlots + requiredSlots;

  return {
    ok: true,
    rewardBundleId,
    grantedItems,
    snapshot: {
      ...snapshot,
      bag: {
        items,
        capacity: {
          usedSlots,
          totalSlots: snapshot.bag.capacity.totalSlots,
          freeSlots: snapshot.bag.capacity.totalSlots - usedSlots,
        },
      },
      updatedAt: now,
    },
  };
}

export function applyResourceConsumeAction({
  snapshot,
  actionId,
  now,
}: {
  snapshot: InventorySnapshot;
  actionId: ResourceConsumeActionId;
  now: string;
}): ResourceConsumeActionResult {
  const nextSnapshot = cloneInventorySnapshot(snapshot);

  switch (actionId) {
    case 'use-return-scroll': {
      const targetIndex = nextSnapshot.bag.items.findIndex(
        (item) => item.itemId === RETURN_SCROLL_ITEM_ID,
      );

      if (targetIndex === -1) {
        return {
          ok: false,
          error: buildItemInsufficientError({
            actionId,
            availableQuantity: 0,
          }),
        };
      }

      const targetItem = nextSnapshot.bag.items[targetIndex];

      if (!targetItem || targetItem.quantity < 1) {
        return {
          ok: false,
          error: buildItemInsufficientError({
            actionId,
            availableQuantity: targetItem?.quantity ?? 0,
          }),
        };
      }

      const quantityRemaining = targetItem.quantity - 1;
      if (quantityRemaining === 0) {
        nextSnapshot.bag.items.splice(targetIndex, 1);
      } else {
        nextSnapshot.bag.items[targetIndex] = {
          ...targetItem,
          quantity: quantityRemaining,
        };
      }

      const usedSlots = nextSnapshot.bag.items.length;
      nextSnapshot.bag.capacity = {
        usedSlots,
        totalSlots: nextSnapshot.bag.capacity.totalSlots,
        freeSlots: nextSnapshot.bag.capacity.totalSlots - usedSlots,
      };
      nextSnapshot.updatedAt = now;

      return {
        ok: true,
        actionId,
        message: `已使用 ${RETURN_SCROLL_ITEM_NAME} x1，当前剩余 ${quantityRemaining}。`,
        consumedItems: [
          {
            itemId: RETURN_SCROLL_ITEM_ID,
            itemName: RETURN_SCROLL_ITEM_NAME,
            quantityConsumed: 1,
            quantityRemaining,
          },
        ],
        consumedResources: [],
        snapshot: nextSnapshot,
      };
    }

    case 'deduct-growth-gold': {
      if (nextSnapshot.resources.gold < GROWTH_GOLD_COST) {
        return {
          ok: false,
          error: buildGoldInsufficientError(actionId, nextSnapshot.resources.gold),
        };
      }

      const amountRemaining = nextSnapshot.resources.gold - GROWTH_GOLD_COST;
      nextSnapshot.resources = {
        ...nextSnapshot.resources,
        gold: amountRemaining,
      };
      nextSnapshot.updatedAt = now;

      return {
        ok: true,
        actionId,
        message: `已扣除 ${GROWTH_GOLD_COST} 金币，当前剩余 ${amountRemaining}。`,
        consumedItems: [],
        consumedResources: [
          {
            resourceType: 'gold',
            amountConsumed: GROWTH_GOLD_COST,
            amountRemaining,
          },
        ],
        snapshot: nextSnapshot,
      };
    }

    default: {
      return {
        ok: false,
        error: {
          code: 'RESOURCE_CONSUME_ACTION_NOT_ALLOWED',
          message: '当前动作未开放',
          retryable: false,
          details: {
            reason: 'action_not_allowed',
            actionId,
            guidance: '请使用一期已开放的消耗动作。',
          },
        },
      };
    }
  }
}

export function applyBeastGrowthAction({
  snapshot,
  beastInstanceId,
  actionId,
}: {
  snapshot: PlayerInitSnapshot;
  beastInstanceId: string;
  actionId: BeastGrowthActionId;
  now: string;
}): BeastGrowthActionResult {
  const nextSnapshot = clonePlayerInitSnapshot(snapshot);

  switch (actionId) {
    case 'basic-level-up': {
      const beastIndex = nextSnapshot.beasts.findIndex(
        (beast) => beast.beastInstanceId === beastInstanceId,
      );
      if (beastIndex === -1) {
        return {
          ok: false,
          error: {
            code: 'BEAST_GROWTH_BEAST_NOT_FOUND',
            message: '目标幻兽不存在',
            retryable: false,
          },
        };
      }

      if (nextSnapshot.resources.gold < GROWTH_GOLD_COST) {
        return {
          ok: false,
          error: buildBeastGrowthGoldInsufficientError(
            actionId,
            nextSnapshot.resources.gold,
          ),
        };
      }

      nextSnapshot.resources = {
        ...nextSnapshot.resources,
        gold: nextSnapshot.resources.gold - GROWTH_GOLD_COST,
      };
      nextSnapshot.beasts[beastIndex] = {
        ...nextSnapshot.beasts[beastIndex],
        level: nextSnapshot.beasts[beastIndex].level + 1,
      };

      return {
        ok: true,
        actionId,
        message: `培养成功，${nextSnapshot.beasts[beastIndex].beastName}提升到 Lv.${nextSnapshot.beasts[beastIndex].level}。`,
        beast: nextSnapshot.beasts[beastIndex],
        consumedResources: [
          {
            resourceType: 'gold',
            amountConsumed: GROWTH_GOLD_COST,
            amountRemaining: nextSnapshot.resources.gold,
          },
        ],
        snapshot: nextSnapshot,
      };
    }

    default: {
      return {
        ok: false,
        error: {
          code: 'BEAST_GROWTH_ACTION_NOT_ALLOWED',
          message: '当前培养动作未开放',
          retryable: false,
          details: {
            reason: 'action_not_allowed',
            actionId,
            guidance: '请使用一期已开放的培养动作。',
          },
        },
      };
    }
  }
}
