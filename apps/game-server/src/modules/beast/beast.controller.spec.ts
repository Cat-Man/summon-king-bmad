import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  BEAST_GROWTH_CONTRACT,
  BEAST_DETAIL_CONTRACT,
  BEAST_LIST_CONTRACT,
  DEFAULT_TEAM_SETUP_CONTRACT,
  PLAYER_INIT_CONTRACT,
  SESSION_AUTH_CONTRACT,
  buildBeastDetailUrl,
} from '@workspace/contracts';
import {
  parseBeastGrowthResponse,
  parseBeastDetailResponse,
  parseBeastListResponse,
  parseDefaultTeamSetupResponse,
  parsePlayerInitResponse,
  parseSessionAuthResponse,
} from '@workspace/schemas';
import type { PlayerInitializationRepository } from '@workspace/db';
import { AppModule } from '../../app/app.module';
import { configureGameServerApp } from '../../app/configure-app';
import { PLAYER_INITIALIZATION_REPOSITORY } from '../player/player.service';

describe('BeastController', () => {
  let app: INestApplication;
  let baseUrl: string;
  let playerInitializationRepository: PlayerInitializationRepository;

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
    playerInitializationRepository = app.get(PLAYER_INITIALIZATION_REPOSITORY);
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

    const initializedState = playerInitializationRepository.findByAccountId(
      authBody.session.accountId,
    );
    if (!initializedState) {
      throw new Error('Expected initialized player state');
    }

    return {
      accountId: authBody.session.accountId,
      sessionToken: authBody.session.sessionToken,
      defaultBeastInstanceId:
        initializedState.snapshot.defaultTeam.beastInstanceIds[0],
      defaultTeamId: initializedState.snapshot.defaultTeam.teamId,
    };
  }

  function addSecondBeastToPlayer(accountId: string, sessionToken: string) {
    const state = playerInitializationRepository.findByAccountId(accountId);
    if (!state) {
      throw new Error('Expected initialized player state');
    }

    playerInitializationRepository.save({
      ...state,
      session: {
        ...state.session,
        sessionToken,
      },
      snapshot: {
        ...state.snapshot,
        beasts: [
          ...state.snapshot.beasts,
          {
            beastInstanceId: 'beast_inst_extra_001',
            beastId: 'starter-beast-002',
            beastName: '风刃灵',
            level: 1,
            role: 'assault',
          },
        ],
      },
    });
  }

  it('returns the authoritative beast list for an initialized session', async () => {
    const session = await createInitializedSession('web-user-beast-001');

    const response = await fetch(`${baseUrl}${BEAST_LIST_CONTRACT.path}`, {
      method: BEAST_LIST_CONTRACT.method,
      headers: {
        'x-session-token': session.sessionToken,
      },
    });
    const body = parseBeastListResponse(await response.json());

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      beasts: [
        {
          beastInstanceId: expect.stringMatching(/^beast_inst_/),
          beastName: '初始幻兽',
          inDefaultTeam: true,
          availableForBattle: true,
        },
      ],
    });
  });

  it('returns the same authoritative beast list on repeated reads', async () => {
    const session = await createInitializedSession('web-user-beast-002');

    const firstResponse = await fetch(`${baseUrl}${BEAST_LIST_CONTRACT.path}`, {
      method: BEAST_LIST_CONTRACT.method,
      headers: {
        'x-session-token': session.sessionToken,
      },
    });
    const secondResponse = await fetch(`${baseUrl}${BEAST_LIST_CONTRACT.path}`, {
      method: BEAST_LIST_CONTRACT.method,
      headers: {
        'x-session-token': session.sessionToken,
      },
    });

    const firstBody = parseBeastListResponse(await firstResponse.json());
    const secondBody = parseBeastListResponse(await secondResponse.json());

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondBody).toEqual(firstBody);
  });

  it('returns a stable invalid-session payload for unknown beast list sessions', async () => {
    const response = await fetch(`${baseUrl}${BEAST_LIST_CONTRACT.path}`, {
      method: BEAST_LIST_CONTRACT.method,
      headers: {
        'x-session-token': 'sess_missing',
      },
    });
    const body = parseBeastListResponse(await response.json());

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      traceId: expect.any(String),
      error: {
        code: 'BEAST_LIST_INVALID_SESSION',
        message: '幻兽列表会话无效',
        retryable: false,
      },
    });
  });

  it('returns the authoritative beast detail for an initialized session', async () => {
    const session = await createInitializedSession('web-user-beast-detail-001');

    const response = await fetch(
      `${baseUrl}${buildBeastDetailUrl(session.defaultBeastInstanceId)}`,
      {
        method: BEAST_DETAIL_CONTRACT.method,
        headers: {
          'x-session-token': session.sessionToken,
        },
      },
    );
    const body = parseBeastDetailResponse(await response.json());

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      traceId: expect.any(String),
      beast: {
        beastInstanceId: session.defaultBeastInstanceId,
        beastId: 'starter-beast-001',
        beastName: '初始幻兽',
        level: 1,
        role: 'starter',
        inDefaultTeam: true,
        availableForBattle: true,
        canSetAsDefault: false,
      },
      defaultTeam: {
        teamId: session.defaultTeamId,
        name: '默认队伍',
        beastInstanceIds: [session.defaultBeastInstanceId],
        capacity: 1,
      },
    });
  });

  it('returns the same authoritative beast detail on repeated reads', async () => {
    const session = await createInitializedSession('web-user-beast-detail-002');

    const firstResponse = await fetch(
      `${baseUrl}${buildBeastDetailUrl(session.defaultBeastInstanceId)}`,
      {
        method: BEAST_DETAIL_CONTRACT.method,
        headers: {
          'x-session-token': session.sessionToken,
        },
      },
    );
    const secondResponse = await fetch(
      `${baseUrl}${buildBeastDetailUrl(session.defaultBeastInstanceId)}`,
      {
        method: BEAST_DETAIL_CONTRACT.method,
        headers: {
          'x-session-token': session.sessionToken,
        },
      },
    );

    const firstBody = parseBeastDetailResponse(await firstResponse.json());
    const secondBody = parseBeastDetailResponse(await secondResponse.json());

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondBody).toEqual(firstBody);
  });

  it('updates the default team and makes follow-up beast reads reflect the new authoritative state', async () => {
    const session = await createInitializedSession('web-user-beast-team-001');
    addSecondBeastToPlayer(session.accountId, session.sessionToken);

    const setupResponse = await fetch(
      `${baseUrl}${DEFAULT_TEAM_SETUP_CONTRACT.path}`,
      {
        method: DEFAULT_TEAM_SETUP_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: session.sessionToken,
          beastInstanceIds: ['beast_inst_extra_001'],
        }),
      },
    );
    const setupBody = parseDefaultTeamSetupResponse(await setupResponse.json());

    expect(setupResponse.status).toBe(200);
    expect(setupBody).toEqual({
      ok: true,
      traceId: expect.any(String),
      message: '默认队伍已更新',
      beast: {
        beastInstanceId: 'beast_inst_extra_001',
        beastId: 'starter-beast-002',
        beastName: '风刃灵',
        level: 1,
        role: 'assault',
        inDefaultTeam: true,
        availableForBattle: true,
        canSetAsDefault: false,
      },
      defaultTeam: {
        teamId: session.defaultTeamId,
        name: '默认队伍',
        beastInstanceIds: ['beast_inst_extra_001'],
        capacity: 1,
      },
    });

    const detailResponse = await fetch(
      `${baseUrl}${buildBeastDetailUrl(session.defaultBeastInstanceId)}`,
      {
        method: BEAST_DETAIL_CONTRACT.method,
        headers: {
          'x-session-token': session.sessionToken,
        },
      },
    );
    const detailBody = parseBeastDetailResponse(await detailResponse.json());

    expect(detailResponse.status).toBe(200);
    expect(detailBody).toMatchObject({
      ok: true,
      beast: {
        beastInstanceId: session.defaultBeastInstanceId,
        inDefaultTeam: false,
        canSetAsDefault: true,
      },
      defaultTeam: {
        beastInstanceIds: ['beast_inst_extra_001'],
      },
    });
  });

  it('settles beast growth through the beast boundary and makes follow-up detail reads reflect the new level', async () => {
    const session = await createInitializedSession('web-user-beast-growth-001');

    const growthResponse = await fetch(`${baseUrl}${BEAST_GROWTH_CONTRACT.path}`, {
      method: BEAST_GROWTH_CONTRACT.method,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sessionToken: session.sessionToken,
        beastInstanceId: session.defaultBeastInstanceId,
        actionId: 'basic-level-up',
      }),
    });
    const growthBody = parseBeastGrowthResponse(await growthResponse.json());

    expect(growthResponse.status).toBe(200);
    expect(growthBody).toEqual({
      ok: true,
      traceId: expect.any(String),
      actionId: 'basic-level-up',
      message: '培养成功，初始幻兽提升到 Lv.2。',
      beast: {
        beastInstanceId: session.defaultBeastInstanceId,
        beastId: 'starter-beast-001',
        beastName: '初始幻兽',
        level: 2,
        role: 'starter',
        inDefaultTeam: true,
        availableForBattle: true,
        canSetAsDefault: false,
      },
      resources: {
        gold: 800,
        gem: 100,
        stamina: 20,
      },
    });

    const detailResponse = await fetch(
      `${baseUrl}${buildBeastDetailUrl(session.defaultBeastInstanceId)}`,
      {
        method: BEAST_DETAIL_CONTRACT.method,
        headers: {
          'x-session-token': session.sessionToken,
        },
      },
    );
    const detailBody = parseBeastDetailResponse(await detailResponse.json());

    expect(detailResponse.status).toBe(200);
    expect(detailBody).toMatchObject({
      ok: true,
      beast: {
        beastInstanceId: session.defaultBeastInstanceId,
        level: 2,
      },
    });
  });

  it('returns stable failures for invalid beast detail or default team setup requests', async () => {
    const detailResponse = await fetch(
      `${baseUrl}${buildBeastDetailUrl('beast_inst_missing')}`,
      {
        method: BEAST_DETAIL_CONTRACT.method,
        headers: {
          'x-session-token': 'sess_missing',
        },
      },
    );
    const detailBody = parseBeastDetailResponse(await detailResponse.json());

    expect(detailResponse.status).toBe(401);
    expect(detailBody).toEqual({
      ok: false,
      traceId: expect.any(String),
      error: {
        code: 'BEAST_DETAIL_INVALID_SESSION',
        message: '幻兽详情会话无效',
        retryable: false,
      },
    });

    const setupResponse = await fetch(
      `${baseUrl}${DEFAULT_TEAM_SETUP_CONTRACT.path}`,
      {
        method: DEFAULT_TEAM_SETUP_CONTRACT.method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: 'sess_missing',
          beastInstanceIds: ['beast_inst_0001'],
        }),
      },
    );
    const setupBody = parseDefaultTeamSetupResponse(await setupResponse.json());

    expect(setupResponse.status).toBe(401);
    expect(setupBody).toEqual({
      ok: false,
      traceId: expect.any(String),
      error: {
        code: 'DEFAULT_TEAM_SETUP_INVALID_SESSION',
        message: '默认队伍配置会话无效',
        retryable: false,
      },
    });
  });
});
