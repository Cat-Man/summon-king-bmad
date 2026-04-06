export const SESSION_AUTH_CONTRACT = {
  method: 'POST',
  path: '/api/v1/session/auth',
} as const;

export const PLAYER_INIT_CONTRACT = {
  method: 'POST',
  path: '/api/v1/player/init',
} as const;

export const INVENTORY_SNAPSHOT_CONTRACT = {
  method: 'GET',
  path: '/api/v1/inventory',
} as const;

export const BEAST_LIST_CONTRACT = {
  method: 'GET',
  path: '/api/v1/beast',
} as const;

export const BEAST_DETAIL_CONTRACT = {
  method: 'GET',
  path: '/api/v1/beast/:beastInstanceId',
} as const;

export const DEFAULT_TEAM_SETUP_CONTRACT = {
  method: 'POST',
  path: '/api/v1/beast/team/default',
} as const;

export const REWARD_CLAIM_CONTRACT = {
  method: 'POST',
  path: '/api/v1/resource/rewards/claim',
} as const;

export const RESOURCE_CONSUME_CONTRACT = {
  method: 'POST',
  path: '/api/v1/resource/consume',
} as const;

export function buildSessionAuthUrl(baseUrl?: string): string {
  if (!baseUrl) {
    return SESSION_AUTH_CONTRACT.path;
  }

  return `${baseUrl.replace(/\/$/, '')}${SESSION_AUTH_CONTRACT.path}`;
}

export function isSessionAuthRoute(method: string, path: string): boolean {
  return (
    method.toUpperCase() === SESSION_AUTH_CONTRACT.method &&
    path === SESSION_AUTH_CONTRACT.path
  );
}

export function buildPlayerInitUrl(baseUrl?: string): string {
  if (!baseUrl) {
    return PLAYER_INIT_CONTRACT.path;
  }

  return `${baseUrl.replace(/\/$/, '')}${PLAYER_INIT_CONTRACT.path}`;
}

export function buildInventorySnapshotUrl(baseUrl?: string): string {
  if (!baseUrl) {
    return INVENTORY_SNAPSHOT_CONTRACT.path;
  }

  return `${baseUrl.replace(/\/$/, '')}${INVENTORY_SNAPSHOT_CONTRACT.path}`;
}

export function buildBeastListUrl(baseUrl?: string): string {
  if (!baseUrl) {
    return BEAST_LIST_CONTRACT.path;
  }

  return `${baseUrl.replace(/\/$/, '')}${BEAST_LIST_CONTRACT.path}`;
}

export function buildBeastDetailUrl(
  beastInstanceId: string,
  baseUrl?: string,
): string {
  const path = `/api/v1/beast/${encodeURIComponent(beastInstanceId)}`;

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export function buildDefaultTeamSetupUrl(baseUrl?: string): string {
  if (!baseUrl) {
    return DEFAULT_TEAM_SETUP_CONTRACT.path;
  }

  return `${baseUrl.replace(/\/$/, '')}${DEFAULT_TEAM_SETUP_CONTRACT.path}`;
}

export function buildRewardClaimUrl(baseUrl?: string): string {
  if (!baseUrl) {
    return REWARD_CLAIM_CONTRACT.path;
  }

  return `${baseUrl.replace(/\/$/, '')}${REWARD_CLAIM_CONTRACT.path}`;
}

export function buildResourceConsumeUrl(baseUrl?: string): string {
  if (!baseUrl) {
    return RESOURCE_CONSUME_CONTRACT.path;
  }

  return `${baseUrl.replace(/\/$/, '')}${RESOURCE_CONSUME_CONTRACT.path}`;
}

export function isPlayerInitRoute(method: string, path: string): boolean {
  return (
    method.toUpperCase() === PLAYER_INIT_CONTRACT.method &&
    path === PLAYER_INIT_CONTRACT.path
  );
}

export function isInventorySnapshotRoute(method: string, path: string): boolean {
  return (
    method.toUpperCase() === INVENTORY_SNAPSHOT_CONTRACT.method &&
    path === INVENTORY_SNAPSHOT_CONTRACT.path
  );
}

export function isBeastListRoute(method: string, path: string): boolean {
  return (
    method.toUpperCase() === BEAST_LIST_CONTRACT.method &&
    path === BEAST_LIST_CONTRACT.path
  );
}

export function isBeastDetailRoute(method: string, path: string): boolean {
  return (
    method.toUpperCase() === BEAST_DETAIL_CONTRACT.method &&
    /^\/api\/v1\/beast\/[^/]+$/.test(path)
  );
}

export function isDefaultTeamSetupRoute(method: string, path: string): boolean {
  return (
    method.toUpperCase() === DEFAULT_TEAM_SETUP_CONTRACT.method &&
    path === DEFAULT_TEAM_SETUP_CONTRACT.path
  );
}

export function isRewardClaimRoute(method: string, path: string): boolean {
  return (
    method.toUpperCase() === REWARD_CLAIM_CONTRACT.method &&
    path === REWARD_CLAIM_CONTRACT.path
  );
}

export function isResourceConsumeRoute(method: string, path: string): boolean {
  return (
    method.toUpperCase() === RESOURCE_CONSUME_CONTRACT.method &&
    path === RESOURCE_CONSUME_CONTRACT.path
  );
}
