import type {
  BeastGrowthActionId,
  BeastGrowthErrorCode,
  InitializedPlayerState,
  InventoryBagSnapshot,
  InventorySnapshot,
  ResourceConsumeActionId,
  ResourceConsumeErrorCode,
  ResourceType,
  RewardBundleId,
  RewardClaimErrorCode,
  ResourceSnapshot,
} from '@workspace/types';

export interface PlayerInitializationRepository {
  findByAccountId(accountId: string): InitializedPlayerState | null;
  save(state: InitializedPlayerState): InitializedPlayerState;
}

export interface PlayerResourceState {
  accountId: string;
  playerId: string;
  resources: ResourceSnapshot;
  updatedAt: string;
}

export interface PlayerBagState {
  accountId: string;
  playerId: string;
  bag: InventoryBagSnapshot;
  updatedAt: string;
}

export interface PlayerInventoryRepository {
  findResourceState(playerId: string): PlayerResourceState | null;
  saveResourceState(state: PlayerResourceState): PlayerResourceState;
  findBagState(playerId: string): PlayerBagState | null;
  saveBagState(state: PlayerBagState): PlayerBagState;
  findSnapshotByPlayerId(playerId: string): InventorySnapshot | null;
}

export interface RewardAuditLogRecord {
  traceId: string;
  accountId: string;
  playerId: string;
  rewardBundleId?: RewardBundleId;
  actionId?: ResourceConsumeActionId | BeastGrowthActionId;
  eventType: 'reward.claim' | 'resource.consume' | 'beast.growth';
  status: 'granted' | 'blocked';
  errorCode?:
    | RewardClaimErrorCode
    | ResourceConsumeErrorCode
    | BeastGrowthErrorCode;
  freeSlots?: number;
  requiredSlots?: number;
  resourceType?: ResourceType;
  resourceAmount?: number;
  itemId?: string;
  itemDelta?: number;
  beastInstanceId?: string;
  createdAt: string;
}

export interface RewardAuditLogRepository {
  save(record: RewardAuditLogRecord): RewardAuditLogRecord;
  listByPlayerId(playerId: string): RewardAuditLogRecord[];
}

class InMemoryPlayerInitializationRepository
  implements PlayerInitializationRepository
{
  private readonly statesByAccountId = new Map<string, InitializedPlayerState>();

  findByAccountId(accountId: string): InitializedPlayerState | null {
    return this.statesByAccountId.get(accountId) ?? null;
  }

  save(state: InitializedPlayerState): InitializedPlayerState {
    this.statesByAccountId.set(state.accountId, state);
    return state;
  }
}

export function createInMemoryPlayerInitializationRepository(): PlayerInitializationRepository {
  return new InMemoryPlayerInitializationRepository();
}

class InMemoryPlayerInventoryRepository implements PlayerInventoryRepository {
  private readonly resourcesByPlayerId = new Map<string, PlayerResourceState>();
  private readonly bagsByPlayerId = new Map<string, PlayerBagState>();

  findResourceState(playerId: string): PlayerResourceState | null {
    return this.resourcesByPlayerId.get(playerId) ?? null;
  }

  saveResourceState(state: PlayerResourceState): PlayerResourceState {
    this.resourcesByPlayerId.set(state.playerId, state);
    return state;
  }

  findBagState(playerId: string): PlayerBagState | null {
    return this.bagsByPlayerId.get(playerId) ?? null;
  }

  saveBagState(state: PlayerBagState): PlayerBagState {
    this.bagsByPlayerId.set(state.playerId, state);
    return state;
  }

  findSnapshotByPlayerId(playerId: string): InventorySnapshot | null {
    const resourceState = this.findResourceState(playerId);
    const bagState = this.findBagState(playerId);
    if (!resourceState || !bagState) {
      return null;
    }

    return {
      accountId: resourceState.accountId,
      playerId,
      resources: {
        ...resourceState.resources,
      },
      bag: {
        items: bagState.bag.items.map((item) => ({ ...item })),
        capacity: {
          ...bagState.bag.capacity,
        },
      },
      updatedAt:
        resourceState.updatedAt >= bagState.updatedAt
          ? resourceState.updatedAt
          : bagState.updatedAt,
    };
  }
}

export function createInMemoryPlayerInventoryRepository(): PlayerInventoryRepository {
  return new InMemoryPlayerInventoryRepository();
}

class InMemoryRewardAuditLogRepository implements RewardAuditLogRepository {
  private readonly records: RewardAuditLogRecord[] = [];

  save(record: RewardAuditLogRecord): RewardAuditLogRecord {
    this.records.push({ ...record });
    return record;
  }

  listByPlayerId(playerId: string): RewardAuditLogRecord[] {
    return this.records
      .filter((record) => record.playerId === playerId)
      .map((record) => ({ ...record }));
  }
}

export function createInMemoryRewardAuditLogRepository(): RewardAuditLogRepository {
  return new InMemoryRewardAuditLogRepository();
}
