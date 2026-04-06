import {
  createInMemoryPlayerInitializationRepository,
  createInMemoryPlayerInventoryRepository,
  createInMemoryRewardAuditLogRepository,
} from '@workspace/db';
import {
  createBeastDetailQueryService,
  createBeastListQueryService,
  createDefaultTeamSetupService,
  createInventorySnapshotQueryService,
  createPlayerInitializationService,
  createResourceConsumeService,
  createRewardClaimService,
} from './application.js';

describe('createPlayerInitializationService', () => {
  function createTwoBeastState() {
    return {
      accountId: 'acc_0001',
      session: {
        accountId: 'acc_0001',
        playerId: 'player_0001',
        sessionToken: 'sess_0001',
        hostPlatform: 'web' as const,
        needsPlayerInitialization: false,
      },
      snapshot: {
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
        beasts: [
          {
            beastInstanceId: 'beast_inst_0001',
            beastId: 'starter-beast-001',
            beastName: '初始幻兽',
            level: 1,
            role: 'starter',
          },
          {
            beastInstanceId: 'beast_inst_0002',
            beastId: 'starter-beast-002',
            beastName: '风刃灵',
            level: 1,
            role: 'assault',
          },
        ],
        defaultTeam: {
          teamId: 'team_0001',
          name: '默认队伍',
          beastInstanceIds: ['beast_inst_0001'],
        },
      },
    };
  }

  it('initializes a new player once and returns the same snapshot on retry', () => {
    const repository = createInMemoryPlayerInitializationRepository();
    const inventoryRepository = createInMemoryPlayerInventoryRepository();
    let attachedPlayerId: string | null = null;

    const service = createPlayerInitializationService({
      repository,
      inventoryRepository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: attachedPlayerId,
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: attachedPlayerId === null,
        };
      },
      attachPlayer(accountId, playerId) {
        expect(accountId).toBe('acc_0001');
        attachedPlayerId = playerId;
      },
      now: () => '2026-04-06T00:00:00.000Z',
    });

    const first = service.initializePlayer({
      sessionToken: 'sess_0001',
      traceId: 'trace-001',
    });
    const second = service.initializePlayer({
      sessionToken: 'sess_0001',
      traceId: 'trace-002',
    });

    if (!first.ok || !second.ok) {
      throw new Error('Expected player initialization to succeed');
    }

    expect(first.snapshot.player.playerId).toBe('player_0001');
    expect(second.snapshot.player.playerId).toBe(first.snapshot.player.playerId);
    expect(second.snapshot.resources).toEqual(first.snapshot.resources);
    expect(second.session.needsPlayerInitialization).toBe(false);
    expect(
      inventoryRepository.findSnapshotByPlayerId(first.snapshot.player.playerId),
    ).toMatchObject({
      resources: first.snapshot.resources,
      bag: {
        capacity: {
          totalSlots: 20,
        },
      },
    });
  });

  it('returns the authoritative inventory snapshot for a valid session token', () => {
    const repository = createInMemoryPlayerInitializationRepository();
    const inventoryRepository = createInMemoryPlayerInventoryRepository();

    const initializationService = createPlayerInitializationService({
      repository,
      inventoryRepository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: null,
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: true,
        };
      },
      attachPlayer() {
        return undefined;
      },
      now: () => '2026-04-06T00:00:00.000Z',
    });

    const initResponse = initializationService.initializePlayer({
      sessionToken: 'sess_0001',
      traceId: 'trace-init-001',
    });
    if (!initResponse.ok) {
      throw new Error('Expected player initialization to succeed');
    }

    const queryService = createInventorySnapshotQueryService({
      inventoryRepository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: initResponse.snapshot.player.playerId,
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: false,
        };
      },
    });

    const inventoryResponse = queryService.getInventorySnapshot({
      sessionToken: 'sess_0001',
      traceId: 'trace-inventory-001',
    });

    expect(inventoryResponse).toMatchObject({
      ok: true,
      traceId: 'trace-inventory-001',
      snapshot: {
        playerId: initResponse.snapshot.player.playerId,
        resources: {
          gold: 1000,
          gem: 100,
          stamina: 20,
        },
        bag: {
          capacity: {
            totalSlots: 20,
          },
        },
      },
    });
  });

  it('returns the authoritative beast list for a valid session token and keeps repeat reads consistent', () => {
    const repository = createInMemoryPlayerInitializationRepository();
    const inventoryRepository = createInMemoryPlayerInventoryRepository();

    const initializationService = createPlayerInitializationService({
      repository,
      inventoryRepository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: null,
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: true,
        };
      },
      attachPlayer() {
        return undefined;
      },
      now: () => '2026-04-06T00:00:00.000Z',
    });

    const initResponse = initializationService.initializePlayer({
      sessionToken: 'sess_0001',
      traceId: 'trace-init-001',
    });
    if (!initResponse.ok) {
      throw new Error('Expected player initialization to succeed');
    }

    const queryService = createBeastListQueryService({
      repository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: initResponse.snapshot.player.playerId,
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: false,
        };
      },
    });

    const first = queryService.getBeastList({
      sessionToken: 'sess_0001',
      traceId: 'trace-beast-001',
    });
    const second = queryService.getBeastList({
      sessionToken: 'sess_0001',
      traceId: 'trace-beast-002',
    });

    expect(first).toMatchObject({
      ok: true,
      beasts: [
        {
          beastInstanceId: 'beast_inst_0001',
          beastName: '初始幻兽',
          inDefaultTeam: true,
          availableForBattle: true,
        },
      ],
    });
    expect(second).toMatchObject({
      ok: true,
      beasts: first.ok ? first.beasts : [],
    });
  });

  it('returns a stable invalid-session failure for beast list reads', () => {
    const repository = createInMemoryPlayerInitializationRepository();

    const queryService = createBeastListQueryService({
      repository,
      resolveSession() {
        return null;
      },
    });

    expect(
      queryService.getBeastList({
        sessionToken: 'sess_missing',
        traceId: 'trace-beast-003',
      }),
    ).toEqual({
      ok: false,
      traceId: 'trace-beast-003',
      error: {
        code: 'BEAST_LIST_INVALID_SESSION',
        message: '幻兽列表会话无效',
        retryable: false,
      },
    });
  });

  it('returns the authoritative beast detail for a valid session token', () => {
    const repository = createInMemoryPlayerInitializationRepository();
    repository.save(createTwoBeastState());

    const queryService = createBeastDetailQueryService({
      repository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: 'player_0001',
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: false,
        };
      },
    });

    expect(
      queryService.getBeastDetail({
        sessionToken: 'sess_0001',
        beastInstanceId: 'beast_inst_0001',
        traceId: 'trace-detail-001',
      }),
    ).toEqual({
      ok: true,
      traceId: 'trace-detail-001',
      beast: {
        beastInstanceId: 'beast_inst_0001',
        beastId: 'starter-beast-001',
        beastName: '初始幻兽',
        level: 1,
        role: 'starter',
        inDefaultTeam: true,
        availableForBattle: true,
        canSetAsDefault: false,
      },
      defaultTeam: {
        teamId: 'team_0001',
        name: '默认队伍',
        beastInstanceIds: ['beast_inst_0001'],
        capacity: 1,
      },
    });
  });

  it('updates the default team atomically and makes detail plus list reads reflect the new authoritative state', () => {
    const repository = createInMemoryPlayerInitializationRepository();
    repository.save(createTwoBeastState());

    const resolveSession = (sessionToken: string) => ({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      sessionToken,
      hostPlatform: 'web' as const,
      needsPlayerInitialization: false,
    });

    const setupService = createDefaultTeamSetupService({
      repository,
      resolveSession,
    });
    const detailService = createBeastDetailQueryService({
      repository,
      resolveSession,
    });
    const listService = createBeastListQueryService({
      repository,
      resolveSession,
    });

    const response = setupService.setupDefaultTeam({
      sessionToken: 'sess_0001',
      beastInstanceIds: ['beast_inst_0002'],
      traceId: 'trace-team-001',
    });

    expect(response).toEqual({
      ok: true,
      traceId: 'trace-team-001',
      message: '默认队伍已更新',
      beast: {
        beastInstanceId: 'beast_inst_0002',
        beastId: 'starter-beast-002',
        beastName: '风刃灵',
        level: 1,
        role: 'assault',
        inDefaultTeam: true,
        availableForBattle: true,
        canSetAsDefault: false,
      },
      defaultTeam: {
        teamId: 'team_0001',
        name: '默认队伍',
        beastInstanceIds: ['beast_inst_0002'],
        capacity: 1,
      },
    });

    expect(
      detailService.getBeastDetail({
        sessionToken: 'sess_0001',
        beastInstanceId: 'beast_inst_0001',
        traceId: 'trace-detail-002',
      }),
    ).toMatchObject({
      ok: true,
      beast: {
        beastInstanceId: 'beast_inst_0001',
        inDefaultTeam: false,
        canSetAsDefault: true,
      },
      defaultTeam: {
        beastInstanceIds: ['beast_inst_0002'],
      },
    });

    expect(
      detailService.getBeastDetail({
        sessionToken: 'sess_0001',
        beastInstanceId: 'beast_inst_0002',
        traceId: 'trace-detail-003',
      }),
    ).toMatchObject({
      ok: true,
      beast: {
        beastInstanceId: 'beast_inst_0002',
        inDefaultTeam: true,
        canSetAsDefault: false,
      },
    });

    expect(
      listService.getBeastList({
        sessionToken: 'sess_0001',
        traceId: 'trace-list-001',
      }),
    ).toMatchObject({
      ok: true,
      beasts: [
        expect.objectContaining({
          beastInstanceId: 'beast_inst_0001',
          inDefaultTeam: false,
        }),
        expect.objectContaining({
          beastInstanceId: 'beast_inst_0002',
          inDefaultTeam: true,
        }),
      ],
    });
  });

  it('rejects invalid default team configuration without mutating state', () => {
    const repository = createInMemoryPlayerInitializationRepository();
    repository.save(createTwoBeastState());

    const setupService = createDefaultTeamSetupService({
      repository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: 'player_0001',
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: false,
        };
      },
    });

    const before = repository.findByAccountId('acc_0001');

    expect(
      setupService.setupDefaultTeam({
        sessionToken: 'sess_0001',
        beastInstanceIds: ['beast_inst_0001', 'beast_inst_0002'],
        traceId: 'trace-team-002',
      }),
    ).toEqual({
      ok: false,
      traceId: 'trace-team-002',
      error: {
        code: 'DEFAULT_TEAM_SETUP_TEAM_CAPACITY_EXCEEDED',
        message: '默认队伍超出一期容量限制',
        retryable: false,
      },
    });

    expect(
      setupService.setupDefaultTeam({
        sessionToken: 'sess_0001',
        beastInstanceIds: ['beast_inst_missing'],
        traceId: 'trace-team-003',
      }),
    ).toEqual({
      ok: false,
      traceId: 'trace-team-003',
      error: {
        code: 'DEFAULT_TEAM_SETUP_BEAST_NOT_FOUND',
        message: '目标幻兽不存在',
        retryable: false,
      },
    });

    expect(
      setupService.setupDefaultTeam({
        sessionToken: 'sess_0001',
        beastInstanceIds: ['beast_inst_0002', 'beast_inst_0002'],
        traceId: 'trace-team-004',
      }),
    ).toEqual({
      ok: false,
      traceId: 'trace-team-004',
      error: {
        code: 'DEFAULT_TEAM_SETUP_DUPLICATE_BEAST',
        message: '默认队伍配置存在重复幻兽',
        retryable: false,
      },
    });

    expect(repository.findByAccountId('acc_0001')).toEqual(before);
  });

  it('returns a stable invalid-session failure for beast detail reads and default team setup', () => {
    const repository = createInMemoryPlayerInitializationRepository();

    const detailService = createBeastDetailQueryService({
      repository,
      resolveSession() {
        return null;
      },
    });
    const setupService = createDefaultTeamSetupService({
      repository,
      resolveSession() {
        return null;
      },
    });

    expect(
      detailService.getBeastDetail({
        sessionToken: 'sess_missing',
        beastInstanceId: 'beast_inst_0001',
        traceId: 'trace-detail-004',
      }),
    ).toEqual({
      ok: false,
      traceId: 'trace-detail-004',
      error: {
        code: 'BEAST_DETAIL_INVALID_SESSION',
        message: '幻兽详情会话无效',
        retryable: false,
      },
    });

    expect(
      setupService.setupDefaultTeam({
        sessionToken: 'sess_missing',
        beastInstanceIds: ['beast_inst_0001'],
        traceId: 'trace-team-005',
      }),
    ).toEqual({
      ok: false,
      traceId: 'trace-team-005',
      error: {
        code: 'DEFAULT_TEAM_SETUP_INVALID_SESSION',
        message: '默认队伍配置会话无效',
        retryable: false,
      },
    });
  });

  it('grants a controlled reward bundle, updates inventory and records a success audit event', () => {
    const inventoryRepository = createInMemoryPlayerInventoryRepository();
    const auditRepository = createInMemoryRewardAuditLogRepository();

    inventoryRepository.saveResourceState({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      resources: {
        gold: 1000,
        gem: 100,
        stamina: 20,
      },
      updatedAt: '2026-04-06T00:00:00.000Z',
    });
    inventoryRepository.saveBagState({
      accountId: 'acc_0001',
      playerId: 'player_0001',
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

    const service = createRewardClaimService({
      inventoryRepository,
      auditRepository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: 'player_0001',
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: false,
        };
      },
      now: () => '2026-04-06T00:05:00.000Z',
    });

    const response = service.claimReward({
      sessionToken: 'sess_0001',
      rewardBundleId: 'inventory-demo-single-reward',
      traceId: 'trace-reward-001',
    });

    expect(response).toMatchObject({
      ok: true,
      traceId: 'trace-reward-001',
      rewardBundleId: 'inventory-demo-single-reward',
      snapshot: {
        bag: {
          capacity: {
            usedSlots: 2,
            freeSlots: 18,
          },
        },
      },
    });
    expect(auditRepository.listByPlayerId('player_0001')).toEqual([
      expect.objectContaining({
        traceId: 'trace-reward-001',
        status: 'granted',
      }),
    ]);
  });

  it('blocks a reward bundle when bag capacity is insufficient, keeps inventory unchanged and records a blocked audit event', () => {
    const inventoryRepository = createInMemoryPlayerInventoryRepository();
    const auditRepository = createInMemoryRewardAuditLogRepository();

    inventoryRepository.saveResourceState({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      resources: {
        gold: 1000,
        gem: 100,
        stamina: 20,
      },
      updatedAt: '2026-04-06T00:00:00.000Z',
    });
    inventoryRepository.saveBagState({
      accountId: 'acc_0001',
      playerId: 'player_0001',
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

    const service = createRewardClaimService({
      inventoryRepository,
      auditRepository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: 'player_0001',
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: false,
        };
      },
      now: () => '2026-04-06T00:05:00.000Z',
    });

    const before = inventoryRepository.findSnapshotByPlayerId('player_0001');
    const response = service.claimReward({
      sessionToken: 'sess_0001',
      rewardBundleId: 'inventory-demo-overflow-reward',
      traceId: 'trace-reward-002',
    });
    const after = inventoryRepository.findSnapshotByPlayerId('player_0001');

    expect(response).toMatchObject({
      ok: false,
      traceId: 'trace-reward-002',
      error: {
        code: 'REWARD_CLAIM_CAPACITY_BLOCKED',
        details: {
          freeSlots: 19,
          requiredSlots: 20,
          missingSlots: 1,
        },
      },
    });
    expect(after).toEqual(before);
    expect(auditRepository.listByPlayerId('player_0001')).toEqual([
      expect.objectContaining({
        traceId: 'trace-reward-002',
        status: 'blocked',
        errorCode: 'REWARD_CLAIM_CAPACITY_BLOCKED',
      }),
    ]);
  });

  it('consumes one return scroll, updates inventory and records a success audit event', () => {
    const inventoryRepository = createInMemoryPlayerInventoryRepository();
    const auditRepository = createInMemoryRewardAuditLogRepository();

    inventoryRepository.saveResourceState({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      resources: {
        gold: 1000,
        gem: 100,
        stamina: 20,
      },
      updatedAt: '2026-04-06T00:00:00.000Z',
    });
    inventoryRepository.saveBagState({
      accountId: 'acc_0001',
      playerId: 'player_0001',
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

    const service = createResourceConsumeService({
      inventoryRepository,
      auditRepository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: 'player_0001',
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: false,
        };
      },
      now: () => '2026-04-06T00:10:00.000Z',
    });

    const response = service.consume({
      sessionToken: 'sess_0001',
      actionId: 'use-return-scroll',
      traceId: 'trace-consume-001',
    });

    expect(response).toMatchObject({
      ok: true,
      actionId: 'use-return-scroll',
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
    expect(auditRepository.listByPlayerId('player_0001')).toEqual([
      expect.objectContaining({
        traceId: 'trace-consume-001',
        eventType: 'resource.consume',
        status: 'granted',
      }),
    ]);
  });

  it('blocks a gold deduction when resources are insufficient, keeps inventory unchanged and records a blocked audit event', () => {
    const inventoryRepository = createInMemoryPlayerInventoryRepository();
    const auditRepository = createInMemoryRewardAuditLogRepository();

    inventoryRepository.saveResourceState({
      accountId: 'acc_0001',
      playerId: 'player_0001',
      resources: {
        gold: 100,
        gem: 100,
        stamina: 20,
      },
      updatedAt: '2026-04-06T00:00:00.000Z',
    });
    inventoryRepository.saveBagState({
      accountId: 'acc_0001',
      playerId: 'player_0001',
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

    const service = createResourceConsumeService({
      inventoryRepository,
      auditRepository,
      resolveSession(sessionToken) {
        return {
          accountId: 'acc_0001',
          playerId: 'player_0001',
          sessionToken,
          hostPlatform: 'web',
          needsPlayerInitialization: false,
        };
      },
      now: () => '2026-04-06T00:10:00.000Z',
    });

    const before = inventoryRepository.findSnapshotByPlayerId('player_0001');
    const response = service.consume({
      sessionToken: 'sess_0001',
      actionId: 'deduct-growth-gold',
      traceId: 'trace-consume-002',
    });
    const after = inventoryRepository.findSnapshotByPlayerId('player_0001');

    expect(response).toMatchObject({
      ok: false,
      error: {
        code: 'RESOURCE_CONSUME_RESOURCE_INSUFFICIENT',
      },
    });
    expect(after).toEqual(before);
    expect(auditRepository.listByPlayerId('player_0001')).toEqual([
      expect.objectContaining({
        traceId: 'trace-consume-002',
        eventType: 'resource.consume',
        status: 'blocked',
        errorCode: 'RESOURCE_CONSUME_RESOURCE_INSUFFICIENT',
      }),
    ]);
  });
});
