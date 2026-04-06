import { Inject, Injectable } from '@nestjs/common';
import { createInventorySnapshotQueryService } from '@workspace/application';
import type { PlayerInventoryRepository } from '@workspace/db';
import type { InventorySnapshotResponse } from '@workspace/types';
import { SessionService } from '../account/session.service';

export const PLAYER_INVENTORY_REPOSITORY = Symbol(
  'PLAYER_INVENTORY_REPOSITORY',
);

@Injectable()
export class InventoryService {
  constructor(
    @Inject(PLAYER_INVENTORY_REPOSITORY)
    private readonly repository: PlayerInventoryRepository,
    private readonly sessionService: SessionService,
  ) {}

  getInventorySnapshot(
    sessionToken: string,
    traceId: string,
  ): InventorySnapshotResponse {
    return createInventorySnapshotQueryService({
      inventoryRepository: this.repository,
      resolveSession: (token) => this.sessionService.resolveSession(token),
    }).getInventorySnapshot({
      sessionToken,
      traceId,
    });
  }
}
