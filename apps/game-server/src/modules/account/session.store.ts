import { Injectable } from '@nestjs/common';
import type { HostPlatform } from '@workspace/types';

interface AccountSessionRecord {
  accountId: string;
  playerId: string | null;
  hostPlatform: HostPlatform;
  hostUserId: string;
}

@Injectable()
export class InMemoryAccountSessionStore {
  private readonly accountsByHostKey = new Map<string, AccountSessionRecord>();
  private readonly accountsById = new Map<string, AccountSessionRecord>();
  private readonly accountIdsBySessionToken = new Map<string, string>();
  private accountSequence = 1;
  private sessionSequence = 1;

  findOrCreate(hostPlatform: HostPlatform, hostUserId: string): AccountSessionRecord {
    const hostKey = `${hostPlatform}:${hostUserId}`;
    const existing = this.accountsByHostKey.get(hostKey);
    if (existing) {
      return existing;
    }

    const created: AccountSessionRecord = {
      accountId: `acc_${this.accountSequence.toString().padStart(4, '0')}`,
      playerId: null,
      hostPlatform,
      hostUserId,
    };
    this.accountSequence += 1;
    this.accountsByHostKey.set(hostKey, created);
    this.accountsById.set(created.accountId, created);

    return created;
  }

  issueSession(accountId: string): string {
    const sessionToken = `sess_${crypto.randomUUID()}`;
    this.sessionSequence += 1;
    this.accountIdsBySessionToken.set(sessionToken, accountId);

    return sessionToken;
  }

  resolveSession(sessionToken: string): AccountSessionRecord | null {
    const accountId = this.accountIdsBySessionToken.get(sessionToken);
    if (!accountId) {
      return null;
    }

    return this.accountsById.get(accountId) ?? null;
  }

  attachPlayer(accountId: string, playerId: string): AccountSessionRecord | null {
    const account = this.accountsById.get(accountId);
    if (!account) {
      return null;
    }

    account.playerId = playerId;
    return account;
  }
}
