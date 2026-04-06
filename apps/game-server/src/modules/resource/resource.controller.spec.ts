import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  PLAYER_INIT_CONTRACT,
  RESOURCE_CONSUME_CONTRACT,
  REWARD_CLAIM_CONTRACT,
  SESSION_AUTH_CONTRACT,
} from '@workspace/contracts';
import {
  parsePlayerInitResponse,
  parseResourceConsumeResponse,
  parseRewardClaimResponse,
  parseSessionAuthResponse,
} from '@workspace/schemas';
import { AppModule } from '../../app/app.module';
import { configureGameServerApp } from '../../app/configure-app';

describe('ResourceController', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureGameServerApp(app);
    await app.listen(0);

    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected an address object from Nest HTTP server');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  async function createInitializedSession(hostUserId: string) {
    const authResponse = await fetch(`${baseUrl}${SESSION_AUTH_CONTRACT.path}`, {
      method: SESSION_AUTH_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        hostPlatform: 'web',
        normalizedHostIdentity: {
          hostPlatform: 'web',
          hostUserId,
          sessionProof: 'dev-proof',
          deviceId: 'browser-device-1',
          channel: 'web-portal',
          isDevelopmentFallback: false,
        },
      }),
    });
    const authBody = parseSessionAuthResponse(await authResponse.json());
    if (!authBody.ok) {
      throw new Error('Expected session authentication to succeed');
    }

    const initResponse = await fetch(`${baseUrl}${PLAYER_INIT_CONTRACT.path}`, {
      method: PLAYER_INIT_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sessionToken: authBody.session.sessionToken,
      }),
    });
    const initBody = parsePlayerInitResponse(await initResponse.json());
    if (!initBody.ok) {
      throw new Error('Expected player initialization to succeed');
    }

    return {
      sessionToken: authBody.session.sessionToken,
      playerId: initBody.snapshot.player.playerId,
    };
  }

  it('grants a controlled reward bundle and returns the updated authoritative inventory snapshot', async () => {
    const session = await createInitializedSession('web-user-resource-001');

    const response = await fetch(`${baseUrl}${REWARD_CLAIM_CONTRACT.path}`, {
      method: REWARD_CLAIM_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sessionToken: session.sessionToken,
        rewardBundleId: 'inventory-demo-single-reward',
      }),
    });
    const body = parseRewardClaimResponse(await response.json());

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      rewardBundleId: 'inventory-demo-single-reward',
      snapshot: {
        playerId: session.playerId,
        bag: {
          capacity: {
            usedSlots: 2,
            freeSlots: 18,
          },
        },
      },
    });
  });

  it('returns a stable capacity-blocked payload when the reward bundle cannot fit into the bag', async () => {
    const session = await createInitializedSession('web-user-resource-002');

    const response = await fetch(`${baseUrl}${REWARD_CLAIM_CONTRACT.path}`, {
      method: REWARD_CLAIM_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sessionToken: session.sessionToken,
        rewardBundleId: 'inventory-demo-overflow-reward',
      }),
    });
    const body = parseRewardClaimResponse(await response.json());

    expect(response.status).toBe(409);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: 'REWARD_CLAIM_CAPACITY_BLOCKED',
        details: {
          storage: 'bag',
          freeSlots: 19,
          requiredSlots: 20,
          missingSlots: 1,
        },
      },
    });
  });

  it('returns a stable invalid-session payload for unknown reward claim sessions', async () => {
    const response = await fetch(`${baseUrl}${REWARD_CLAIM_CONTRACT.path}`, {
      method: REWARD_CLAIM_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sessionToken: 'sess_missing',
        rewardBundleId: 'inventory-demo-single-reward',
      }),
    });
    const body = parseRewardClaimResponse(await response.json());

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      traceId: expect.any(String),
      error: {
        code: 'REWARD_CLAIM_INVALID_SESSION',
        message: '奖励领取会话无效',
        retryable: false,
      },
    });
  });

  it('consumes one return scroll and returns the updated authoritative inventory snapshot', async () => {
    const session = await createInitializedSession('web-user-resource-003');

    const response = await fetch(`${baseUrl}${RESOURCE_CONSUME_CONTRACT.path}`, {
      method: RESOURCE_CONSUME_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sessionToken: session.sessionToken,
        actionId: 'use-return-scroll',
      }),
    });
    const body = parseResourceConsumeResponse(await response.json());

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      actionId: 'use-return-scroll',
      consumedItems: [
        {
          itemId: 'item_1027',
          quantityConsumed: 1,
          quantityRemaining: 4,
        },
      ],
      snapshot: {
        playerId: session.playerId,
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
  });

  it('returns a stable resource-insufficient payload when the controlled gold deduction cannot be completed', async () => {
    const session = await createInitializedSession('web-user-resource-004');

    for (let index = 0; index < 5; index += 1) {
      const response = await fetch(`${baseUrl}${RESOURCE_CONSUME_CONTRACT.path}`, {
        method: RESOURCE_CONSUME_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: session.sessionToken,
          actionId: 'deduct-growth-gold',
        }),
      });

      expect(response.status).toBe(200);
    }

    const blockedResponse = await fetch(
      `${baseUrl}${RESOURCE_CONSUME_CONTRACT.path}`,
      {
        method: RESOURCE_CONSUME_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: session.sessionToken,
          actionId: 'deduct-growth-gold',
        }),
      },
    );
    const blockedBody = parseResourceConsumeResponse(await blockedResponse.json());

    expect(blockedResponse.status).toBe(409);
    expect(blockedBody).toMatchObject({
      ok: false,
      error: {
        code: 'RESOURCE_CONSUME_RESOURCE_INSUFFICIENT',
        details: {
          reason: 'resource_insufficient',
          resourceType: 'gold',
          currentAmount: 0,
          requiredAmount: 200,
        },
      },
    });
  });

  it('returns a stable invalid-session payload for unknown resource consume sessions', async () => {
    const response = await fetch(`${baseUrl}${RESOURCE_CONSUME_CONTRACT.path}`, {
      method: RESOURCE_CONSUME_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sessionToken: 'sess_missing',
        actionId: 'use-return-scroll',
      }),
    });
    const body = parseResourceConsumeResponse(await response.json());

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      traceId: expect.any(String),
      error: {
        code: 'RESOURCE_CONSUME_INVALID_SESSION',
        message: '资源消耗会话无效',
        retryable: false,
      },
    });
  });
});
