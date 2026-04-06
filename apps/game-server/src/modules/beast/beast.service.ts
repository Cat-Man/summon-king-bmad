import { Inject, Injectable } from '@nestjs/common';
import {
  createBeastGrowthService,
  createBeastDetailQueryService,
  createBeastListQueryService,
  createDefaultTeamSetupService,
} from '@workspace/application';
import type {
  PlayerInitializationRepository,
  PlayerInventoryRepository,
  RewardAuditLogRepository,
} from '@workspace/db';
import type {
  BeastGrowthActionId,
  BeastGrowthResponse,
  BeastDetailResponse,
  BeastListResponse,
  DefaultTeamSetupResponse,
} from '@workspace/types';
import { PLAYER_INVENTORY_REPOSITORY } from '../inventory/inventory.service';
import { SessionService } from '../account/session.service';
import { PLAYER_INITIALIZATION_REPOSITORY } from '../player/player.service';
import { REWARD_AUDIT_LOG_REPOSITORY } from '../resource/resource.service';

@Injectable()
export class BeastService {
  constructor(
    @Inject(PLAYER_INITIALIZATION_REPOSITORY)
    private readonly playerInitializationRepository: PlayerInitializationRepository,
    @Inject(PLAYER_INVENTORY_REPOSITORY)
    private readonly inventoryRepository: PlayerInventoryRepository,
    @Inject(REWARD_AUDIT_LOG_REPOSITORY)
    private readonly auditRepository: RewardAuditLogRepository,
    private readonly sessionService: SessionService,
  ) {}

  getBeastList(sessionToken: string, traceId: string): BeastListResponse {
    return createBeastListQueryService({
      repository: this.playerInitializationRepository,
      resolveSession: (token) => this.sessionService.resolveSession(token),
    }).getBeastList({
      sessionToken,
      traceId,
    });
  }

  getBeastDetail(
    sessionToken: string,
    beastInstanceId: string,
    traceId: string,
  ): BeastDetailResponse {
    return createBeastDetailQueryService({
      repository: this.playerInitializationRepository,
      resolveSession: (token) => this.sessionService.resolveSession(token),
    }).getBeastDetail({
      sessionToken,
      beastInstanceId,
      traceId,
    });
  }

  setupDefaultTeam(
    sessionToken: string,
    beastInstanceIds: string[],
    traceId: string,
  ): DefaultTeamSetupResponse {
    return createDefaultTeamSetupService({
      repository: this.playerInitializationRepository,
      resolveSession: (token) => this.sessionService.resolveSession(token),
    }).setupDefaultTeam({
      sessionToken,
      beastInstanceIds,
      traceId,
    });
  }

  growBeast(
    sessionToken: string,
    beastInstanceId: string,
    actionId: BeastGrowthActionId,
    traceId: string,
  ): BeastGrowthResponse {
    return createBeastGrowthService({
      repository: this.playerInitializationRepository,
      inventoryRepository: this.inventoryRepository,
      auditRepository: this.auditRepository,
      resolveSession: (token) => this.sessionService.resolveSession(token),
    }).growBeast({
      sessionToken,
      beastInstanceId,
      actionId,
      traceId,
    });
  }
}
