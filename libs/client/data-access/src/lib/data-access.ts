import {
  BEAST_DETAIL_CONTRACT,
  BEAST_LIST_CONTRACT,
  DEFAULT_TEAM_SETUP_CONTRACT,
  INVENTORY_SNAPSHOT_CONTRACT,
  PLAYER_INIT_CONTRACT,
  RESOURCE_CONSUME_CONTRACT,
  REWARD_CLAIM_CONTRACT,
  SESSION_AUTH_CONTRACT,
  buildBeastDetailUrl,
  buildBeastListUrl,
  buildDefaultTeamSetupUrl,
  buildInventorySnapshotUrl,
  buildPlayerInitUrl,
  buildResourceConsumeUrl,
  buildRewardClaimUrl,
  buildSessionAuthUrl,
} from '@workspace/contracts';
import {
  parseBeastDetailRequest,
  parseBeastDetailResponse,
  parseBeastListRequest,
  parseBeastListResponse,
  parseDefaultTeamSetupRequest,
  parseDefaultTeamSetupResponse,
  parseInventorySnapshotRequest,
  parseInventorySnapshotResponse,
  parsePlayerInitRequest,
  parsePlayerInitResponse,
  parseResourceConsumeRequest,
  parseResourceConsumeResponse,
  parseRewardClaimRequest,
  parseRewardClaimResponse,
  parseSessionAuthRequest,
  parseSessionAuthResponse,
} from '@workspace/schemas';
import type {
  BeastDetailRequest,
  BeastDetailResponse,
  BeastListRequest,
  BeastListResponse,
  DefaultTeamSetupRequest,
  DefaultTeamSetupResponse,
  InventorySnapshotRequest,
  InventorySnapshotResponse,
  PlayerInitRequest,
  PlayerInitResponse,
  ResourceConsumeRequest,
  ResourceConsumeResponse,
  RewardClaimRequest,
  RewardClaimResponse,
  SessionAuthRequest,
  SessionAuthResponse,
} from '@workspace/types';

interface JsonResponseLike {
  json(): Promise<unknown>;
}

export type FetchLike = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
  },
) => Promise<JsonResponseLike>;

export interface AuthenticateSessionOptions {
  baseUrl?: string;
  fetcher?: FetchLike;
}

export interface InitializePlayerOptions {
  baseUrl?: string;
  fetcher?: FetchLike;
}

export interface FetchInventorySnapshotOptions {
  baseUrl?: string;
  fetcher?: FetchLike;
}

export interface FetchBeastListOptions {
  baseUrl?: string;
  fetcher?: FetchLike;
}

export interface FetchBeastDetailOptions {
  baseUrl?: string;
  fetcher?: FetchLike;
}

export interface SetupDefaultTeamOptions {
  baseUrl?: string;
  fetcher?: FetchLike;
}

export interface ClaimRewardOptions {
  baseUrl?: string;
  fetcher?: FetchLike;
}

export interface ConsumeResourceOptions {
  baseUrl?: string;
  fetcher?: FetchLike;
}

export async function authenticateSession(
  request: SessionAuthRequest,
  options: AuthenticateSessionOptions = {},
): Promise<SessionAuthResponse> {
  const payload = parseSessionAuthRequest(request);
  const fetcher = options.fetcher ?? (globalThis.fetch as FetchLike | undefined);

  if (!fetcher) {
    throw new Error('No fetch implementation available for session auth');
  }

  const response = await fetcher(buildSessionAuthUrl(options.baseUrl), {
    method: SESSION_AUTH_CONTRACT.method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseSessionAuthResponse(await response.json());
}

export async function initializePlayer(
  request: PlayerInitRequest,
  options: InitializePlayerOptions = {},
): Promise<PlayerInitResponse> {
  const payload = parsePlayerInitRequest(request);
  const fetcher = options.fetcher ?? (globalThis.fetch as FetchLike | undefined);

  if (!fetcher) {
    throw new Error('No fetch implementation available for player init');
  }

  const response = await fetcher(buildPlayerInitUrl(options.baseUrl), {
    method: PLAYER_INIT_CONTRACT.method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parsePlayerInitResponse(await response.json());
}

export async function fetchInventorySnapshot(
  request: InventorySnapshotRequest,
  options: FetchInventorySnapshotOptions = {},
): Promise<InventorySnapshotResponse> {
  const payload = parseInventorySnapshotRequest(request);
  const fetcher = options.fetcher ?? (globalThis.fetch as FetchLike | undefined);

  if (!fetcher) {
    throw new Error('No fetch implementation available for inventory snapshot');
  }

  const response = await fetcher(buildInventorySnapshotUrl(options.baseUrl), {
    method: INVENTORY_SNAPSHOT_CONTRACT.method,
    headers: {
      'x-session-token': payload.sessionToken,
    },
  });

  return parseInventorySnapshotResponse(await response.json());
}

export async function fetchBeastList(
  request: BeastListRequest,
  options: FetchBeastListOptions = {},
): Promise<BeastListResponse> {
  const payload = parseBeastListRequest(request);
  const fetcher = options.fetcher ?? (globalThis.fetch as FetchLike | undefined);

  if (!fetcher) {
    throw new Error('No fetch implementation available for beast list');
  }

  const response = await fetcher(buildBeastListUrl(options.baseUrl), {
    method: BEAST_LIST_CONTRACT.method,
    headers: {
      'x-session-token': payload.sessionToken,
    },
  });

  return parseBeastListResponse(await response.json());
}

export async function fetchBeastDetail(
  request: BeastDetailRequest,
  options: FetchBeastDetailOptions = {},
): Promise<BeastDetailResponse> {
  const payload = parseBeastDetailRequest(request);
  const fetcher = options.fetcher ?? (globalThis.fetch as FetchLike | undefined);

  if (!fetcher) {
    throw new Error('No fetch implementation available for beast detail');
  }

  const response = await fetcher(
    buildBeastDetailUrl(payload.beastInstanceId, options.baseUrl),
    {
      method: BEAST_DETAIL_CONTRACT.method,
      headers: {
        'x-session-token': payload.sessionToken,
      },
    },
  );

  return parseBeastDetailResponse(await response.json());
}

export async function setupDefaultTeam(
  request: DefaultTeamSetupRequest,
  options: SetupDefaultTeamOptions = {},
): Promise<DefaultTeamSetupResponse> {
  const payload = parseDefaultTeamSetupRequest(request);
  const fetcher = options.fetcher ?? (globalThis.fetch as FetchLike | undefined);

  if (!fetcher) {
    throw new Error('No fetch implementation available for default team setup');
  }

  const response = await fetcher(buildDefaultTeamSetupUrl(options.baseUrl), {
    method: DEFAULT_TEAM_SETUP_CONTRACT.method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseDefaultTeamSetupResponse(await response.json());
}

export async function claimReward(
  request: RewardClaimRequest,
  options: ClaimRewardOptions = {},
): Promise<RewardClaimResponse> {
  const payload = parseRewardClaimRequest(request);
  const fetcher = options.fetcher ?? (globalThis.fetch as FetchLike | undefined);

  if (!fetcher) {
    throw new Error('No fetch implementation available for reward claim');
  }

  const response = await fetcher(buildRewardClaimUrl(options.baseUrl), {
    method: REWARD_CLAIM_CONTRACT.method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseRewardClaimResponse(await response.json());
}

export async function consumeResource(
  request: ResourceConsumeRequest,
  options: ConsumeResourceOptions = {},
): Promise<ResourceConsumeResponse> {
  const payload = parseResourceConsumeRequest(request);
  const fetcher = options.fetcher ?? (globalThis.fetch as FetchLike | undefined);

  if (!fetcher) {
    throw new Error('No fetch implementation available for resource consume');
  }

  const response = await fetcher(buildResourceConsumeUrl(options.baseUrl), {
    method: RESOURCE_CONSUME_CONTRACT.method,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResourceConsumeResponse(await response.json());
}
