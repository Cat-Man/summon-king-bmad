import {
  applyResourceConsumeAction,
  applyRewardBundleToInventory,
  buildStarterInventorySnapshot,
  buildStarterPlayerState,
} from '@workspace/domain';
import type {
  PlayerBagState,
  PlayerInitializationRepository,
  PlayerInventoryRepository,
  PlayerResourceState,
  RewardAuditLogRepository,
} from '@workspace/db';
import type {
  BeastDetailEntry,
  BeastDetailResponse,
  BeastListResponse,
  BeastTeamSummary,
  DefaultTeamSetupResponse,
  InventorySnapshotResponse,
  PlayerInitResponse,
  ResourceConsumeActionId,
  ResourceConsumeResponse,
  RewardBundleId,
  RewardClaimResponse,
  ResourceSnapshot,
  UnifiedSession,
} from '@workspace/types';

export interface PlayerInitializationService {
  initializePlayer(input: {
    sessionToken: string;
    traceId: string;
  }): PlayerInitResponse;
}

export interface InventorySnapshotQueryService {
  getInventorySnapshot(input: {
    sessionToken: string;
    traceId: string;
  }): InventorySnapshotResponse;
}

export interface BeastListQueryService {
  getBeastList(input: {
    sessionToken: string;
    traceId: string;
  }): BeastListResponse;
}

export interface BeastDetailQueryService {
  getBeastDetail(input: {
    sessionToken: string;
    beastInstanceId: string;
    traceId: string;
  }): BeastDetailResponse;
}

export interface DefaultTeamSetupService {
  setupDefaultTeam(input: {
    sessionToken: string;
    beastInstanceIds: string[];
    traceId: string;
  }): DefaultTeamSetupResponse;
}

export interface RewardClaimService {
  claimReward(input: {
    sessionToken: string;
    rewardBundleId: RewardBundleId;
    traceId: string;
  }): RewardClaimResponse;
}

export interface ResourceConsumeService {
  consume(input: {
    sessionToken: string;
    actionId: ResourceConsumeActionId;
    traceId: string;
  }): ResourceConsumeResponse;
}

function persistInventorySnapshot(
  inventoryRepository: PlayerInventoryRepository,
  input: {
    accountId: string;
    playerId: string;
    resources: ResourceSnapshot;
    now: string;
  },
): void {
  const inventory = buildStarterInventorySnapshot({
    accountId: input.accountId,
    playerId: input.playerId,
    resources: input.resources,
    now: input.now,
  });

  const resourceState: PlayerResourceState = {
    accountId: inventory.accountId,
    playerId: inventory.playerId,
    resources: inventory.resources,
    updatedAt: inventory.updatedAt,
  };
  const bagState: PlayerBagState = {
    accountId: inventory.accountId,
    playerId: inventory.playerId,
    bag: inventory.bag,
    updatedAt: inventory.updatedAt,
  };

  inventoryRepository.saveResourceState(resourceState);
  inventoryRepository.saveBagState(bagState);
}

function saveResolvedInventorySnapshot(
  inventoryRepository: PlayerInventoryRepository,
  snapshot: {
    accountId: string;
    playerId: string;
    resources: ResourceSnapshot;
    bag: PlayerBagState['bag'];
    updatedAt: string;
  },
): void {
  inventoryRepository.saveResourceState({
    accountId: snapshot.accountId,
    playerId: snapshot.playerId,
    resources: snapshot.resources,
    updatedAt: snapshot.updatedAt,
  });
  inventoryRepository.saveBagState({
    accountId: snapshot.accountId,
    playerId: snapshot.playerId,
    bag: snapshot.bag,
    updatedAt: snapshot.updatedAt,
  });
}

const DEFAULT_TEAM_CAPACITY = 1;

function buildDefaultTeamSummary(input: {
  teamId: string;
  name: string;
  beastInstanceIds: string[];
}): BeastTeamSummary {
  return {
    teamId: input.teamId,
    name: input.name,
    beastInstanceIds: [...input.beastInstanceIds],
    capacity: DEFAULT_TEAM_CAPACITY,
  };
}

function buildBeastDetailEntry(input: {
  beast: {
    beastInstanceId: string;
    beastId: string;
    beastName: string;
    level: number;
    role: string;
  };
  defaultTeamSet: Set<string>;
}): BeastDetailEntry {
  const inDefaultTeam = input.defaultTeamSet.has(input.beast.beastInstanceId);

  return {
    beastInstanceId: input.beast.beastInstanceId,
    beastId: input.beast.beastId,
    beastName: input.beast.beastName,
    level: input.beast.level,
    role: input.beast.role,
    inDefaultTeam,
    availableForBattle: true,
    canSetAsDefault: !inDefaultTeam,
  };
}

export function createPlayerInitializationService({
  repository,
  inventoryRepository,
  resolveSession,
  attachPlayer,
  now = () => new Date().toISOString(),
}: {
  repository: PlayerInitializationRepository;
  inventoryRepository: PlayerInventoryRepository;
  resolveSession(sessionToken: string): UnifiedSession | null;
  attachPlayer(accountId: string, playerId: string): void;
  now?: () => string;
}): PlayerInitializationService {
  return {
    initializePlayer({ sessionToken, traceId }) {
      const session = resolveSession(sessionToken);

      if (!session) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'PLAYER_INIT_INVALID_SESSION',
            message: '初始化会话无效',
            retryable: false,
          },
        };
      }

      const existing = repository.findByAccountId(session.accountId);
      if (existing) {
        const playerId = existing.snapshot.player.playerId;
        if (!inventoryRepository.findSnapshotByPlayerId(playerId)) {
          persistInventorySnapshot(inventoryRepository, {
            accountId: existing.accountId,
            playerId,
            resources: existing.snapshot.resources,
            now: now(),
          });
        }

        return {
          ok: true,
          traceId,
          session: {
            ...existing.session,
            sessionToken,
            hostPlatform: session.hostPlatform,
          },
          snapshot: existing.snapshot,
        };
      }

      const initialized = buildStarterPlayerState({
        accountId: session.accountId,
        hostPlatform: session.hostPlatform,
        sessionToken,
        now: now(),
      });

      repository.save(initialized);
      persistInventorySnapshot(inventoryRepository, {
        accountId: initialized.accountId,
        playerId: initialized.snapshot.player.playerId,
        resources: initialized.snapshot.resources,
        now: now(),
      });
      attachPlayer(session.accountId, initialized.snapshot.player.playerId);

      return {
        ok: true,
        traceId,
        session: initialized.session,
        snapshot: initialized.snapshot,
      };
    },
  };
}

export function createInventorySnapshotQueryService({
  inventoryRepository,
  resolveSession,
}: {
  inventoryRepository: PlayerInventoryRepository;
  resolveSession(sessionToken: string): UnifiedSession | null;
}): InventorySnapshotQueryService {
  return {
    getInventorySnapshot({ sessionToken, traceId }) {
      const session = resolveSession(sessionToken);
      if (!session || !session.playerId) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'INVENTORY_INVALID_SESSION',
            message: '库存会话无效',
            retryable: false,
          },
        };
      }

      const snapshot = inventoryRepository.findSnapshotByPlayerId(
        session.playerId,
      );
      if (!snapshot) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'INVENTORY_STATE_MISSING',
            message: '库存状态不存在',
            retryable: false,
          },
        };
      }

      return {
        ok: true,
        traceId,
        snapshot,
      };
    },
  };
}

export function createBeastListQueryService({
  repository,
  resolveSession,
}: {
  repository: PlayerInitializationRepository;
  resolveSession(sessionToken: string): UnifiedSession | null;
}): BeastListQueryService {
  return {
    getBeastList({ sessionToken, traceId }) {
      const session = resolveSession(sessionToken);
      if (!session) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'BEAST_LIST_INVALID_SESSION',
            message: '幻兽列表会话无效',
            retryable: false,
          },
        };
      }

      const playerState = repository.findByAccountId(session.accountId);
      if (!playerState) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'BEAST_LIST_STATE_MISSING',
            message: '幻兽列表状态不存在',
            retryable: false,
          },
        };
      }

      const defaultTeamSet = new Set(
        playerState.snapshot.defaultTeam.beastInstanceIds,
      );

      return {
        ok: true,
        traceId,
        beasts: playerState.snapshot.beasts.map((beast) =>
          buildBeastDetailEntry({
            beast,
            defaultTeamSet,
          }),
        ),
      };
    },
  };
}

export function createBeastDetailQueryService({
  repository,
  resolveSession,
}: {
  repository: PlayerInitializationRepository;
  resolveSession(sessionToken: string): UnifiedSession | null;
}): BeastDetailQueryService {
  return {
    getBeastDetail({ sessionToken, beastInstanceId, traceId }) {
      const session = resolveSession(sessionToken);
      if (!session) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'BEAST_DETAIL_INVALID_SESSION',
            message: '幻兽详情会话无效',
            retryable: false,
          },
        };
      }

      const playerState = repository.findByAccountId(session.accountId);
      if (!playerState) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'BEAST_DETAIL_STATE_MISSING',
            message: '幻兽详情状态不存在',
            retryable: false,
          },
        };
      }

      const beast = playerState.snapshot.beasts.find(
        (item) => item.beastInstanceId === beastInstanceId,
      );
      if (!beast) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'BEAST_DETAIL_NOT_FOUND',
            message: '目标幻兽不存在',
            retryable: false,
          },
        };
      }

      const defaultTeamSet = new Set(
        playerState.snapshot.defaultTeam.beastInstanceIds,
      );

      return {
        ok: true,
        traceId,
        beast: buildBeastDetailEntry({
          beast,
          defaultTeamSet,
        }),
        defaultTeam: buildDefaultTeamSummary(playerState.snapshot.defaultTeam),
      };
    },
  };
}

export function createDefaultTeamSetupService({
  repository,
  resolveSession,
}: {
  repository: PlayerInitializationRepository;
  resolveSession(sessionToken: string): UnifiedSession | null;
}): DefaultTeamSetupService {
  return {
    setupDefaultTeam({ sessionToken, beastInstanceIds, traceId }) {
      const session = resolveSession(sessionToken);
      if (!session) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'DEFAULT_TEAM_SETUP_INVALID_SESSION',
            message: '默认队伍配置会话无效',
            retryable: false,
          },
        };
      }

      const playerState = repository.findByAccountId(session.accountId);
      if (!playerState) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'DEFAULT_TEAM_SETUP_STATE_MISSING',
            message: '默认队伍配置状态不存在',
            retryable: false,
          },
        };
      }

      if (new Set(beastInstanceIds).size !== beastInstanceIds.length) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'DEFAULT_TEAM_SETUP_DUPLICATE_BEAST',
            message: '默认队伍配置存在重复幻兽',
            retryable: false,
          },
        };
      }

      if (beastInstanceIds.length > DEFAULT_TEAM_CAPACITY) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'DEFAULT_TEAM_SETUP_TEAM_CAPACITY_EXCEEDED',
            message: '默认队伍超出一期容量限制',
            retryable: false,
          },
        };
      }

      const beastMap = new Map(
        playerState.snapshot.beasts.map((beast) => [beast.beastInstanceId, beast]),
      );
      const selectedBeast = beastMap.get(beastInstanceIds[0] ?? '');
      if (!selectedBeast) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'DEFAULT_TEAM_SETUP_BEAST_NOT_FOUND',
            message: '目标幻兽不存在',
            retryable: false,
          },
        };
      }

      const updatedState = repository.save({
        ...playerState,
        session: {
          ...playerState.session,
          sessionToken,
          hostPlatform: session.hostPlatform,
        },
        snapshot: {
          ...playerState.snapshot,
          defaultTeam: {
            ...playerState.snapshot.defaultTeam,
            beastInstanceIds: [...beastInstanceIds],
          },
        },
      });
      const defaultTeamSet = new Set(
        updatedState.snapshot.defaultTeam.beastInstanceIds,
      );

      return {
        ok: true,
        traceId,
        message: '默认队伍已更新',
        beast: buildBeastDetailEntry({
          beast: selectedBeast,
          defaultTeamSet,
        }),
        defaultTeam: buildDefaultTeamSummary(updatedState.snapshot.defaultTeam),
      };
    },
  };
}

export function createRewardClaimService({
  inventoryRepository,
  auditRepository,
  resolveSession,
  now = () => new Date().toISOString(),
}: {
  inventoryRepository: PlayerInventoryRepository;
  auditRepository: RewardAuditLogRepository;
  resolveSession(sessionToken: string): UnifiedSession | null;
  now?: () => string;
}): RewardClaimService {
  return {
    claimReward({ sessionToken, rewardBundleId, traceId }) {
      const session = resolveSession(sessionToken);
      if (!session || !session.playerId) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'REWARD_CLAIM_INVALID_SESSION',
            message: '奖励领取会话无效',
            retryable: false,
          },
        };
      }

      const snapshot = inventoryRepository.findSnapshotByPlayerId(session.playerId);
      if (!snapshot) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'REWARD_CLAIM_STATE_MISSING',
            message: '奖励领取所需库存状态不存在',
            retryable: false,
          },
        };
      }

      const result = applyRewardBundleToInventory({
        snapshot,
        rewardBundleId,
        now: now(),
      });

      if (!result.ok) {
        auditRepository.save({
          traceId,
          accountId: snapshot.accountId,
          playerId: snapshot.playerId,
          rewardBundleId,
          eventType: 'reward.claim',
          status: 'blocked',
          errorCode: result.error.code,
          freeSlots: result.error.details?.freeSlots,
          requiredSlots: result.error.details?.requiredSlots,
          createdAt: now(),
        });

        return {
          ok: false,
          traceId,
          error: result.error,
        };
      }

      saveResolvedInventorySnapshot(inventoryRepository, result.snapshot);

      auditRepository.save({
        traceId,
        accountId: result.snapshot.accountId,
        playerId: result.snapshot.playerId,
        rewardBundleId,
        eventType: 'reward.claim',
        status: 'granted',
        createdAt: now(),
      });

      return {
        ok: true,
        traceId,
        rewardBundleId,
        grantedItems: result.grantedItems,
        snapshot:
          inventoryRepository.findSnapshotByPlayerId(result.snapshot.playerId) ??
          result.snapshot,
      };
    },
  };
}

export function createResourceConsumeService({
  inventoryRepository,
  auditRepository,
  resolveSession,
  now = () => new Date().toISOString(),
}: {
  inventoryRepository: PlayerInventoryRepository;
  auditRepository: RewardAuditLogRepository;
  resolveSession(sessionToken: string): UnifiedSession | null;
  now?: () => string;
}): ResourceConsumeService {
  return {
    consume({ sessionToken, actionId, traceId }) {
      const session = resolveSession(sessionToken);
      if (!session || !session.playerId) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'RESOURCE_CONSUME_INVALID_SESSION',
            message: '资源消耗会话无效',
            retryable: false,
          },
        };
      }

      const snapshot = inventoryRepository.findSnapshotByPlayerId(session.playerId);
      if (!snapshot) {
        return {
          ok: false,
          traceId,
          error: {
            code: 'RESOURCE_CONSUME_STATE_MISSING',
            message: '资源消耗所需库存状态不存在',
            retryable: false,
          },
        };
      }

      const result = applyResourceConsumeAction({
        snapshot,
        actionId,
        now: now(),
      });

      if (!result.ok) {
        auditRepository.save({
          traceId,
          accountId: snapshot.accountId,
          playerId: snapshot.playerId,
          actionId,
          eventType: 'resource.consume',
          status: 'blocked',
          errorCode: result.error.code,
          resourceType:
            result.error.details?.reason === 'resource_insufficient'
              ? result.error.details.resourceType
              : undefined,
          resourceAmount:
            result.error.details?.reason === 'resource_insufficient'
              ? result.error.details.requiredAmount
              : undefined,
          itemId:
            result.error.details?.reason === 'item_insufficient'
              ? result.error.details.itemId
              : undefined,
          itemDelta:
            result.error.details?.reason === 'item_insufficient' ? -1 : undefined,
          createdAt: now(),
        });

        return {
          ok: false,
          traceId,
          error: result.error,
        };
      }

      saveResolvedInventorySnapshot(inventoryRepository, result.snapshot);

      auditRepository.save({
        traceId,
        accountId: result.snapshot.accountId,
        playerId: result.snapshot.playerId,
        actionId,
        eventType: 'resource.consume',
        status: 'granted',
        resourceType: result.consumedResources[0]?.resourceType,
        resourceAmount: result.consumedResources[0]?.amountConsumed,
        itemId: result.consumedItems[0]?.itemId,
        itemDelta: result.consumedItems[0]
          ? -result.consumedItems[0].quantityConsumed
          : undefined,
        createdAt: now(),
      });

      return {
        ok: true,
        traceId,
        actionId,
        message: result.message,
        consumedItems: result.consumedItems,
        consumedResources: result.consumedResources,
        snapshot:
          inventoryRepository.findSnapshotByPlayerId(result.snapshot.playerId) ??
          result.snapshot,
      };
    },
  };
}
