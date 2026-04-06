import { Inject, Injectable } from '@nestjs/common';
import {
  createResourceConsumeService,
  createRewardClaimService,
} from '@workspace/application';
import {
  createInMemoryRewardAuditLogRepository,
  type PlayerInventoryRepository,
  type RewardAuditLogRepository,
} from '@workspace/db';
import type {
  ResourceConsumeActionId,
  ResourceConsumeResponse,
  RewardBundleId,
  RewardClaimResponse,
} from '@workspace/types';
import { SessionService } from '../account/session.service';
import { PLAYER_INVENTORY_REPOSITORY } from '../inventory/inventory.service';

export const REWARD_AUDIT_LOG_REPOSITORY = Symbol(
  'REWARD_AUDIT_LOG_REPOSITORY',
);

@Injectable()
export class ResourceService {
  constructor(
    @Inject(PLAYER_INVENTORY_REPOSITORY)
    private readonly inventoryRepository: PlayerInventoryRepository,
    @Inject(REWARD_AUDIT_LOG_REPOSITORY)
    private readonly auditRepository: RewardAuditLogRepository,
    private readonly sessionService: SessionService,
  ) {}

  claimReward(
    sessionToken: string,
    rewardBundleId: RewardBundleId,
    traceId: string,
  ): RewardClaimResponse {
    return createRewardClaimService({
      inventoryRepository: this.inventoryRepository,
      auditRepository: this.auditRepository,
      resolveSession: (token) => this.sessionService.resolveSession(token),
    }).claimReward({
      sessionToken,
      rewardBundleId,
      traceId,
    });
  }

  consumeResource(
    sessionToken: string,
    actionId: ResourceConsumeActionId,
    traceId: string,
  ): ResourceConsumeResponse {
    return createResourceConsumeService({
      inventoryRepository: this.inventoryRepository,
      auditRepository: this.auditRepository,
      resolveSession: (token) => this.sessionService.resolveSession(token),
    }).consume({
      sessionToken,
      actionId,
      traceId,
    });
  }
}

export function createRewardAuditLogRepository(): RewardAuditLogRepository {
  return createInMemoryRewardAuditLogRepository();
}
