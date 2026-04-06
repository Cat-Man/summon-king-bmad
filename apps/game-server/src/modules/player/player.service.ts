import { Inject, Injectable } from '@nestjs/common';
import { createPlayerInitializationService } from '@workspace/application';
import type {
  PlayerInitializationRepository,
  PlayerInventoryRepository,
} from '@workspace/db';
import type { PlayerInitRequest, PlayerInitResponse } from '@workspace/types';
import { SessionService } from '../account/session.service';
import { PLAYER_INVENTORY_REPOSITORY } from '../inventory/inventory.service';

export const PLAYER_INITIALIZATION_REPOSITORY = Symbol(
  'PLAYER_INITIALIZATION_REPOSITORY',
);

@Injectable()
export class PlayerService {
  constructor(
    @Inject(PLAYER_INITIALIZATION_REPOSITORY)
    private readonly repository: PlayerInitializationRepository,
    @Inject(PLAYER_INVENTORY_REPOSITORY)
    private readonly inventoryRepository: PlayerInventoryRepository,
    private readonly sessionService: SessionService,
  ) {}

  initializePlayer(
    request: PlayerInitRequest,
    traceId: string,
  ): PlayerInitResponse {
    return createPlayerInitializationService({
      repository: this.repository,
      inventoryRepository: this.inventoryRepository,
      resolveSession: (sessionToken) =>
        this.sessionService.resolveSession(sessionToken),
      attachPlayer: (accountId, playerId) =>
        this.sessionService.attachPlayer(accountId, playerId),
    }).initializePlayer({
      sessionToken: request.sessionToken,
      traceId,
    });
  }
}
