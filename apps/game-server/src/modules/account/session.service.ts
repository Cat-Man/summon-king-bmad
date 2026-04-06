import { Injectable } from '@nestjs/common';
import type {
  SessionAuthRequest,
  SessionAuthSuccessResponse,
  UnifiedSession,
} from '@workspace/types';
import { InMemoryAccountSessionStore } from './session.store';

@Injectable()
export class SessionService {
  constructor(
    private readonly accountSessionStore: InMemoryAccountSessionStore,
  ) {}

  authenticate(
    request: SessionAuthRequest,
    traceId: string,
  ): SessionAuthSuccessResponse {
    const accountRecord = this.accountSessionStore.findOrCreate(
      request.hostPlatform,
      request.normalizedHostIdentity.hostUserId,
    );
    const sessionToken = this.accountSessionStore.issueSession(
      accountRecord.accountId,
    );

    return {
      ok: true,
      traceId,
      session: {
        accountId: accountRecord.accountId,
        playerId: accountRecord.playerId,
        sessionToken,
        hostPlatform: request.hostPlatform,
        needsPlayerInitialization: accountRecord.playerId === null,
      },
    };
  }

  resolveSession(sessionToken: string): UnifiedSession | null {
    const accountRecord = this.accountSessionStore.resolveSession(sessionToken);
    if (!accountRecord) {
      return null;
    }

    return {
      accountId: accountRecord.accountId,
      playerId: accountRecord.playerId,
      sessionToken,
      hostPlatform: accountRecord.hostPlatform,
      needsPlayerInitialization: accountRecord.playerId === null,
    };
  }

  attachPlayer(accountId: string, playerId: string): void {
    this.accountSessionStore.attachPlayer(accountId, playerId);
  }
}
