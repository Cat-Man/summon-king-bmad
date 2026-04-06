export const HOST_PLATFORMS = ['web', 'wechat-miniapp'] as const;

export type HostPlatform = (typeof HOST_PLATFORMS)[number];

export const SESSION_AUTH_ERROR_CODES = [
  'SESSION_AUTH_INVALID_INPUT',
  'SESSION_AUTH_UNSUPPORTED_PLATFORM',
] as const;

export type SessionAuthErrorCode = (typeof SESSION_AUTH_ERROR_CODES)[number];

export const PLAYER_INIT_ERROR_CODES = [
  'PLAYER_INIT_INVALID_INPUT',
  'PLAYER_INIT_INVALID_SESSION',
] as const;

export type PlayerInitErrorCode = (typeof PLAYER_INIT_ERROR_CODES)[number];

export const INVENTORY_ITEM_TYPES = ['consumable'] as const;

export type InventoryItemType = (typeof INVENTORY_ITEM_TYPES)[number];

export const REWARD_BUNDLE_IDS = [
  'inventory-demo-single-reward',
  'inventory-demo-overflow-reward',
] as const;

export type RewardBundleId = (typeof REWARD_BUNDLE_IDS)[number];

export const RESOURCE_CONSUME_ACTION_IDS = [
  'use-return-scroll',
  'deduct-growth-gold',
] as const;

export type ResourceConsumeActionId =
  (typeof RESOURCE_CONSUME_ACTION_IDS)[number];

export const INVENTORY_ERROR_CODES = [
  'INVENTORY_INVALID_INPUT',
  'INVENTORY_INVALID_SESSION',
  'INVENTORY_STATE_MISSING',
] as const;

export type InventoryErrorCode = (typeof INVENTORY_ERROR_CODES)[number];

export const BEAST_LIST_ERROR_CODES = [
  'BEAST_LIST_INVALID_INPUT',
  'BEAST_LIST_INVALID_SESSION',
  'BEAST_LIST_STATE_MISSING',
] as const;

export type BeastListErrorCode = (typeof BEAST_LIST_ERROR_CODES)[number];

export const BEAST_DETAIL_ERROR_CODES = [
  'BEAST_DETAIL_INVALID_INPUT',
  'BEAST_DETAIL_INVALID_SESSION',
  'BEAST_DETAIL_STATE_MISSING',
  'BEAST_DETAIL_NOT_FOUND',
] as const;

export type BeastDetailErrorCode = (typeof BEAST_DETAIL_ERROR_CODES)[number];

export const DEFAULT_TEAM_SETUP_ERROR_CODES = [
  'DEFAULT_TEAM_SETUP_INVALID_INPUT',
  'DEFAULT_TEAM_SETUP_INVALID_SESSION',
  'DEFAULT_TEAM_SETUP_STATE_MISSING',
  'DEFAULT_TEAM_SETUP_BEAST_NOT_FOUND',
  'DEFAULT_TEAM_SETUP_TEAM_CAPACITY_EXCEEDED',
  'DEFAULT_TEAM_SETUP_DUPLICATE_BEAST',
] as const;

export type DefaultTeamSetupErrorCode =
  (typeof DEFAULT_TEAM_SETUP_ERROR_CODES)[number];

export const REWARD_CLAIM_ERROR_CODES = [
  'REWARD_CLAIM_INVALID_INPUT',
  'REWARD_CLAIM_INVALID_SESSION',
  'REWARD_CLAIM_STATE_MISSING',
  'REWARD_CLAIM_CAPACITY_BLOCKED',
] as const;

export type RewardClaimErrorCode = (typeof REWARD_CLAIM_ERROR_CODES)[number];

export const RESOURCE_CONSUME_ERROR_CODES = [
  'RESOURCE_CONSUME_INVALID_INPUT',
  'RESOURCE_CONSUME_INVALID_SESSION',
  'RESOURCE_CONSUME_STATE_MISSING',
  'RESOURCE_CONSUME_ACTION_NOT_ALLOWED',
  'RESOURCE_CONSUME_ITEM_INSUFFICIENT',
  'RESOURCE_CONSUME_RESOURCE_INSUFFICIENT',
] as const;

export type ResourceConsumeErrorCode =
  (typeof RESOURCE_CONSUME_ERROR_CODES)[number];

export interface NormalizedHostIdentity {
  hostPlatform: HostPlatform;
  hostUserId: string;
  sessionProof?: string;
  deviceId?: string;
  channel?: string;
  isDevelopmentFallback: boolean;
}

export interface SessionAuthRequest {
  hostPlatform: HostPlatform;
  normalizedHostIdentity: NormalizedHostIdentity;
}

export interface UnifiedSession {
  accountId: string;
  playerId: string | null;
  sessionToken: string;
  hostPlatform: HostPlatform;
  needsPlayerInitialization: boolean;
}

export interface SessionAuthSuccessResponse {
  ok: true;
  traceId: string;
  session: UnifiedSession;
}

export interface SessionAuthError {
  code: SessionAuthErrorCode;
  message: string;
  retryable: boolean;
}

export interface SessionAuthErrorResponse {
  ok: false;
  traceId: string;
  error: SessionAuthError;
}

export type SessionAuthResponse =
  | SessionAuthSuccessResponse
  | SessionAuthErrorResponse;

export interface PlayerInitRequest {
  sessionToken: string;
}

export interface PlayerProfileSnapshot {
  playerId: string;
  playerName: string;
  level: number;
  initializedAt: string;
}

export interface ResourceSnapshot {
  gold: number;
  gem: number;
  stamina: number;
}

export const RESOURCE_TYPES = ['gold', 'gem', 'stamina'] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export interface StarterResourceSnapshot extends ResourceSnapshot {}

export interface StarterBeastSnapshot {
  beastInstanceId: string;
  beastId: string;
  beastName: string;
  level: number;
  role: string;
}

export interface DefaultTeamSnapshot {
  teamId: string;
  name: string;
  beastInstanceIds: string[];
}

export interface PlayerInitSnapshot {
  accountId: string;
  player: PlayerProfileSnapshot;
  resources: StarterResourceSnapshot;
  beasts: StarterBeastSnapshot[];
  defaultTeam: DefaultTeamSnapshot;
}

export interface InitializedPlayerState {
  accountId: string;
  session: UnifiedSession;
  snapshot: PlayerInitSnapshot;
}

export interface PlayerInitSuccessResponse {
  ok: true;
  traceId: string;
  session: UnifiedSession;
  snapshot: PlayerInitSnapshot;
}

export interface PlayerInitError {
  code: PlayerInitErrorCode;
  message: string;
  retryable: boolean;
}

export interface PlayerInitErrorResponse {
  ok: false;
  traceId: string;
  error: PlayerInitError;
}

export type PlayerInitResponse =
  | PlayerInitSuccessResponse
  | PlayerInitErrorResponse;

export interface InventorySnapshotRequest {
  sessionToken: string;
}

export interface InventoryItemSnapshot {
  slotId: string;
  itemId: string;
  itemName: string;
  itemType: InventoryItemType;
  quantity: number;
  stackable: boolean;
}

export interface InventoryBagCapacitySnapshot {
  usedSlots: number;
  totalSlots: number;
  freeSlots: number;
}

export interface InventoryBagSnapshot {
  items: InventoryItemSnapshot[];
  capacity: InventoryBagCapacitySnapshot;
}

export interface InventorySnapshot {
  accountId: string;
  playerId: string;
  resources: ResourceSnapshot;
  bag: InventoryBagSnapshot;
  updatedAt: string;
}

export interface InventorySnapshotSuccessResponse {
  ok: true;
  traceId: string;
  snapshot: InventorySnapshot;
}

export interface InventorySnapshotError {
  code: InventoryErrorCode;
  message: string;
  retryable: boolean;
}

export interface InventorySnapshotErrorResponse {
  ok: false;
  traceId: string;
  error: InventorySnapshotError;
}

export type InventorySnapshotResponse =
  | InventorySnapshotSuccessResponse
  | InventorySnapshotErrorResponse;

export interface BeastListRequest {
  sessionToken: string;
}

export interface BeastListEntry {
  beastInstanceId: string;
  beastId: string;
  beastName: string;
  level: number;
  role: string;
  inDefaultTeam: boolean;
  availableForBattle: boolean;
}

export interface BeastListSuccessResponse {
  ok: true;
  traceId: string;
  beasts: BeastListEntry[];
}

export interface BeastListError {
  code: BeastListErrorCode;
  message: string;
  retryable: boolean;
}

export interface BeastListErrorResponse {
  ok: false;
  traceId: string;
  error: BeastListError;
}

export type BeastListResponse =
  | BeastListSuccessResponse
  | BeastListErrorResponse;

export interface BeastDetailRequest {
  sessionToken: string;
  beastInstanceId: string;
}

export interface BeastTeamSummary {
  teamId: string;
  name: string;
  beastInstanceIds: string[];
  capacity: number;
}

export interface BeastDetailEntry extends BeastListEntry {
  canSetAsDefault: boolean;
}

export interface BeastDetailSuccessResponse {
  ok: true;
  traceId: string;
  beast: BeastDetailEntry;
  defaultTeam: BeastTeamSummary;
}

export interface BeastDetailError {
  code: BeastDetailErrorCode;
  message: string;
  retryable: boolean;
}

export interface BeastDetailErrorResponse {
  ok: false;
  traceId: string;
  error: BeastDetailError;
}

export type BeastDetailResponse =
  | BeastDetailSuccessResponse
  | BeastDetailErrorResponse;

export interface DefaultTeamSetupRequest {
  sessionToken: string;
  beastInstanceIds: string[];
}

export interface DefaultTeamSetupSuccessResponse {
  ok: true;
  traceId: string;
  message: string;
  beast: BeastDetailEntry;
  defaultTeam: BeastTeamSummary;
}

export interface DefaultTeamSetupError {
  code: DefaultTeamSetupErrorCode;
  message: string;
  retryable: boolean;
}

export interface DefaultTeamSetupErrorResponse {
  ok: false;
  traceId: string;
  error: DefaultTeamSetupError;
}

export type DefaultTeamSetupResponse =
  | DefaultTeamSetupSuccessResponse
  | DefaultTeamSetupErrorResponse;

export interface RewardClaimRequest {
  sessionToken: string;
  rewardBundleId: RewardBundleId;
}

export interface RewardGrantedItem {
  itemId: string;
  itemName: string;
  itemType: InventoryItemType;
  quantity: number;
  stackable: boolean;
}

export interface RewardCapacityBlockedDetails {
  storage: 'bag';
  freeSlots: number;
  requiredSlots: number;
  missingSlots: number;
  guidance: string;
  blockedItems: RewardGrantedItem[];
}

export interface RewardClaimSuccessResponse {
  ok: true;
  traceId: string;
  rewardBundleId: RewardBundleId;
  grantedItems: RewardGrantedItem[];
  snapshot: InventorySnapshot;
}

export interface RewardClaimError {
  code: RewardClaimErrorCode;
  message: string;
  retryable: boolean;
  details?: RewardCapacityBlockedDetails;
}

export interface RewardClaimErrorResponse {
  ok: false;
  traceId: string;
  error: RewardClaimError;
}

export type RewardClaimResponse =
  | RewardClaimSuccessResponse
  | RewardClaimErrorResponse;

export interface ResourceConsumeRequest {
  sessionToken: string;
  actionId: ResourceConsumeActionId;
}

export interface ConsumedItemChange {
  itemId: string;
  itemName: string;
  quantityConsumed: number;
  quantityRemaining: number;
}

export interface ConsumedResourceChange {
  resourceType: ResourceType;
  amountConsumed: number;
  amountRemaining: number;
}

export interface ResourceConsumeActionNotAllowedDetails {
  reason: 'action_not_allowed';
  actionId: ResourceConsumeActionId;
  guidance: string;
}

export interface ResourceConsumeItemInsufficientDetails {
  reason: 'item_insufficient';
  actionId: ResourceConsumeActionId;
  guidance: string;
  itemId: string;
  itemName: string;
  availableQuantity: number;
  requiredQuantity: number;
}

export interface ResourceConsumeResourceInsufficientDetails {
  reason: 'resource_insufficient';
  actionId: ResourceConsumeActionId;
  guidance: string;
  resourceType: ResourceType;
  currentAmount: number;
  requiredAmount: number;
}

export type ResourceConsumeErrorDetails =
  | ResourceConsumeActionNotAllowedDetails
  | ResourceConsumeItemInsufficientDetails
  | ResourceConsumeResourceInsufficientDetails;

export interface ResourceConsumeSuccessResponse {
  ok: true;
  traceId: string;
  actionId: ResourceConsumeActionId;
  message: string;
  consumedItems: ConsumedItemChange[];
  consumedResources: ConsumedResourceChange[];
  snapshot: InventorySnapshot;
}

export interface ResourceConsumeError {
  code: ResourceConsumeErrorCode;
  message: string;
  retryable: boolean;
  details?: ResourceConsumeErrorDetails;
}

export interface ResourceConsumeErrorResponse {
  ok: false;
  traceId: string;
  error: ResourceConsumeError;
}

export type ResourceConsumeResponse =
  | ResourceConsumeSuccessResponse
  | ResourceConsumeErrorResponse;
