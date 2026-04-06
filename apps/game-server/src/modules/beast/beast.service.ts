import { Inject, Injectable } from '@nestjs/common';
import {
  createBeastDetailQueryService,
  createBeastListQueryService,
  createDefaultTeamSetupService,
} from '@workspace/application';
import type { PlayerInitializationRepository } from '@workspace/db';
import type {
  BeastDetailResponse,
  BeastListResponse,
  DefaultTeamSetupResponse,
} from '@workspace/types';
import { SessionService } from '../account/session.service';
import { PLAYER_INITIALIZATION_REPOSITORY } from '../player/player.service';

@Injectable()
export class BeastService {
  constructor(
    @Inject(PLAYER_INITIALIZATION_REPOSITORY)
    private readonly repository: PlayerInitializationRepository,
    private readonly sessionService: SessionService,
  ) {}

  getBeastList(sessionToken: string, traceId: string): BeastListResponse {
    return createBeastListQueryService({
      repository: this.repository,
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
      repository: this.repository,
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
      repository: this.repository,
      resolveSession: (token) => this.sessionService.resolveSession(token),
    }).setupDefaultTeam({
      sessionToken,
      beastInstanceIds,
      traceId,
    });
  }
}
