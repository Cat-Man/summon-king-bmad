import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  INVENTORY_SNAPSHOT_CONTRACT,
  PLAYER_INIT_CONTRACT,
  SESSION_AUTH_CONTRACT,
} from '@workspace/contracts';
import {
  parseInventorySnapshotResponse,
  parsePlayerInitResponse,
  parseSessionAuthResponse,
} from '@workspace/schemas';
import { AppModule } from '../../app/app.module';
import { configureGameServerApp } from '../../app/configure-app';

describe('InventoryController', () => {
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

  it('returns the authoritative inventory snapshot after player initialization', async () => {
    const authResponse = await fetch(`${baseUrl}${SESSION_AUTH_CONTRACT.path}`, {
      method: SESSION_AUTH_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        hostPlatform: 'web',
        normalizedHostIdentity: {
          hostPlatform: 'web',
          hostUserId: 'web-user-inventory-001',
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

    const inventoryResponse = await fetch(
      `${baseUrl}${INVENTORY_SNAPSHOT_CONTRACT.path}`,
      {
        method: INVENTORY_SNAPSHOT_CONTRACT.method,
        headers: {
          'x-session-token': authBody.session.sessionToken,
        },
      },
    );
    const inventoryBody = parseInventorySnapshotResponse(
      await inventoryResponse.json(),
    );

    expect(inventoryResponse.status).toBe(200);
    expect(inventoryBody).toMatchObject({
      ok: true,
      snapshot: {
        accountId: initBody.snapshot.accountId,
        playerId: initBody.snapshot.player.playerId,
        resources: {
          gold: 1000,
          gem: 100,
          stamina: 20,
        },
        bag: {
          capacity: {
            totalSlots: 20,
          },
          items: [
            {
              itemName: '回城符',
              quantity: 5,
            },
          ],
        },
      },
    });
  });

  it('returns a stable invalid-session payload for unknown inventory sessions', async () => {
    const response = await fetch(`${baseUrl}${INVENTORY_SNAPSHOT_CONTRACT.path}`, {
      method: INVENTORY_SNAPSHOT_CONTRACT.method,
      headers: {
        'x-session-token': 'sess_missing',
      },
    });
    const body = parseInventorySnapshotResponse(await response.json());

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      traceId: expect.any(String),
      error: {
        code: 'INVENTORY_INVALID_SESSION',
        message: '库存会话无效',
        retryable: false,
      },
    });
  });
});
