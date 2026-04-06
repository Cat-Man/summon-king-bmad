import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SESSION_AUTH_CONTRACT } from '@workspace/contracts';
import { parseSessionAuthResponse } from '@workspace/schemas';
import { AppModule } from '../../app/app.module';
import { configureGameServerApp } from '../../app/configure-app';

describe('SessionController', () => {
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

  it('returns one unified session shape for both web and wechat hosts', async () => {
    const webResponse = await fetch(`${baseUrl}${SESSION_AUTH_CONTRACT.path}`, {
      method: SESSION_AUTH_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'trace-web-001',
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

    const wechatResponse = await fetch(
      `${baseUrl}${SESSION_AUTH_CONTRACT.path}`,
      {
        method: SESSION_AUTH_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'trace-wx-001',
        },
        body: JSON.stringify({
          hostPlatform: 'wechat-miniapp',
          normalizedHostIdentity: {
            hostPlatform: 'wechat-miniapp',
            hostUserId: 'wx-open-id-001',
            sessionProof: 'wx-code-001',
            channel: 'wechat-shell',
            isDevelopmentFallback: false,
          },
        }),
      },
    );

    const webBody = parseSessionAuthResponse(await webResponse.json());
    const wechatBody = parseSessionAuthResponse(await wechatResponse.json());

    expect(webResponse.status).toBe(200);
    expect(wechatResponse.status).toBe(200);
    expect(webBody).toMatchObject({
      ok: true,
      traceId: 'trace-web-001',
      session: {
        accountId: expect.any(String),
        playerId: null,
        sessionToken: expect.any(String),
        hostPlatform: 'web',
        needsPlayerInitialization: true,
      },
    });
    expect(wechatBody).toMatchObject({
      ok: true,
      traceId: 'trace-wx-001',
      session: {
        accountId: expect.any(String),
        playerId: null,
        sessionToken: expect.any(String),
        hostPlatform: 'wechat-miniapp',
        needsPlayerInitialization: true,
      },
    });
  });

  it('issues opaque session tokens instead of predictable account-derived ids', async () => {
    const firstResponse = await fetch(`${baseUrl}${SESSION_AUTH_CONTRACT.path}`, {
      method: SESSION_AUTH_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'trace-web-token-001',
      },
      body: JSON.stringify({
        hostPlatform: 'web',
        normalizedHostIdentity: {
          hostPlatform: 'web',
          hostUserId: 'web-user-token-001',
          sessionProof: 'dev-proof',
          deviceId: 'browser-device-1',
          channel: 'web-portal',
          isDevelopmentFallback: false,
        },
      }),
    });
    const secondResponse = await fetch(`${baseUrl}${SESSION_AUTH_CONTRACT.path}`, {
      method: SESSION_AUTH_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'trace-web-token-002',
      },
      body: JSON.stringify({
        hostPlatform: 'web',
        normalizedHostIdentity: {
          hostPlatform: 'web',
          hostUserId: 'web-user-token-001',
          sessionProof: 'dev-proof',
          deviceId: 'browser-device-1',
          channel: 'web-portal',
          isDevelopmentFallback: false,
        },
      }),
    });

    const firstBody = parseSessionAuthResponse(await firstResponse.json());
    const secondBody = parseSessionAuthResponse(await secondResponse.json());
    if (!firstBody.ok || !secondBody.ok) {
      throw new Error('Expected session authentication to succeed');
    }

    expect(firstBody.session.sessionToken).toMatch(
      /^sess_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(firstBody.session.sessionToken).not.toContain(firstBody.session.accountId);
    expect(secondBody.session.sessionToken).not.toBe(firstBody.session.sessionToken);
  });

  it('returns a stable invalid-input error payload for bad requests', async () => {
    const response = await fetch(`${baseUrl}${SESSION_AUTH_CONTRACT.path}`, {
      method: SESSION_AUTH_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'trace-invalid-001',
      },
      body: JSON.stringify({
        hostPlatform: 'web',
        normalizedHostIdentity: {
          hostPlatform: 'wechat-miniapp',
          hostUserId: 'wx-open-id-001',
          isDevelopmentFallback: false,
        },
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      traceId: 'trace-invalid-001',
      error: {
        code: 'SESSION_AUTH_INVALID_INPUT',
        message: '统一会话请求无效',
        retryable: false,
      },
    });
  });
});
