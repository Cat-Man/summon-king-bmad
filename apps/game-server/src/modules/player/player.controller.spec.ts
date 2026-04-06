import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  PLAYER_INIT_CONTRACT,
  SESSION_AUTH_CONTRACT,
} from '@workspace/contracts';
import {
  parsePlayerInitResponse,
  parseSessionAuthResponse,
} from '@workspace/schemas';
import { AppModule } from '../../app/app.module';
import { configureGameServerApp } from '../../app/configure-app';

describe('PlayerController', () => {
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

  it('initializes a player once and returns the same snapshot on retry', async () => {
    const authResponse = await fetch(`${baseUrl}${SESSION_AUTH_CONTRACT.path}`, {
      method: SESSION_AUTH_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        hostPlatform: 'web',
        normalizedHostIdentity: {
          hostPlatform: 'web',
          hostUserId: 'web-user-001',
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

    const firstResponse = await fetch(`${baseUrl}${PLAYER_INIT_CONTRACT.path}`, {
      method: PLAYER_INIT_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'trace-init-001',
      },
      body: JSON.stringify({
        sessionToken: authBody.session.sessionToken,
      }),
    });
    const secondResponse = await fetch(`${baseUrl}${PLAYER_INIT_CONTRACT.path}`, {
      method: PLAYER_INIT_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'trace-init-002',
      },
      body: JSON.stringify({
        sessionToken: authBody.session.sessionToken,
      }),
    });

    const firstBody = parsePlayerInitResponse(await firstResponse.json());
    const secondBody = parsePlayerInitResponse(await secondResponse.json());
    if (!firstBody.ok || !secondBody.ok) {
      throw new Error('Expected player initialization to succeed');
    }

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstBody).toMatchObject({
      ok: true,
      traceId: 'trace-init-001',
      session: {
        accountId: 'acc_0001',
        playerId: 'player_0001',
        sessionToken: authBody.session.sessionToken,
        hostPlatform: 'web',
        needsPlayerInitialization: false,
      },
      snapshot: {
        resources: {
          gold: 1000,
          gem: 100,
          stamina: 20,
        },
        beasts: [
          {
            beastId: 'starter-beast-001',
            beastName: '初始幻兽',
          },
        ],
      },
    });
    expect(secondBody.snapshot).toEqual(firstBody.snapshot);
    expect(secondBody.session.playerId).toBe(firstBody.session.playerId);
  });

  it('returns a stable invalid-session payload for unknown session tokens', async () => {
    const response = await fetch(`${baseUrl}${PLAYER_INIT_CONTRACT.path}`, {
      method: PLAYER_INIT_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'trace-init-invalid',
      },
      body: JSON.stringify({
        sessionToken: 'sess_missing',
      }),
    });
    const body = parsePlayerInitResponse(await response.json());

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      traceId: 'trace-init-invalid',
      error: {
        code: 'PLAYER_INIT_INVALID_SESSION',
        message: '初始化会话无效',
        retryable: false,
      },
    });
  });
});
