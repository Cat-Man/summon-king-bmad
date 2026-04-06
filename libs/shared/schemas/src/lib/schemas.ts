import { z } from 'zod';
import {
  BEAST_GROWTH_ACTION_IDS,
  BEAST_GROWTH_ERROR_CODES,
  BEAST_DETAIL_ERROR_CODES,
  BEAST_LIST_ERROR_CODES,
  DEFAULT_TEAM_SETUP_ERROR_CODES,
  HOST_PLATFORMS,
  INVENTORY_ERROR_CODES,
  INVENTORY_ITEM_TYPES,
  PLAYER_INIT_ERROR_CODES,
  RESOURCE_CONSUME_ACTION_IDS,
  RESOURCE_CONSUME_ERROR_CODES,
  RESOURCE_TYPES,
  REWARD_BUNDLE_IDS,
  REWARD_CLAIM_ERROR_CODES,
  SESSION_AUTH_ERROR_CODES,
  type BeastGrowthRequest,
  type BeastGrowthResponse,
  type BeastDetailRequest,
  type BeastDetailResponse,
  type BeastListRequest,
  type BeastListResponse,
  type DefaultTeamSetupRequest,
  type DefaultTeamSetupResponse,
  type ResourceConsumeRequest,
  type ResourceConsumeResponse,
  type InventorySnapshotRequest,
  type InventorySnapshotResponse,
  type PlayerInitRequest,
  type PlayerInitResponse,
  type RewardClaimRequest,
  type RewardClaimResponse,
  type SessionAuthRequest,
  type SessionAuthResponse,
} from '@workspace/types';

export const hostPlatformSchema = z.enum(HOST_PLATFORMS);

export const normalizedHostIdentitySchema = z.object({
  hostPlatform: hostPlatformSchema,
  hostUserId: z.string().min(1),
  sessionProof: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),
  channel: z.string().min(1).optional(),
  isDevelopmentFallback: z.boolean(),
});

export const sessionAuthRequestSchema = z
  .object({
    hostPlatform: hostPlatformSchema,
    normalizedHostIdentity: normalizedHostIdentitySchema,
  })
  .superRefine((value, ctx) => {
    if (value.hostPlatform !== value.normalizedHostIdentity.hostPlatform) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['normalizedHostIdentity', 'hostPlatform'],
        message: 'normalizedHostIdentity.hostPlatform must match hostPlatform',
      });
    }
  });

export const unifiedSessionSchema = z.object({
  accountId: z.string().min(1),
  playerId: z.string().min(1).nullable(),
  sessionToken: z.string().min(1),
  hostPlatform: hostPlatformSchema,
  needsPlayerInitialization: z.boolean(),
});

export const sessionAuthSuccessResponseSchema = z.object({
  ok: z.literal(true),
  traceId: z.string().min(1),
  session: unifiedSessionSchema,
});

export const sessionAuthErrorResponseSchema = z.object({
  ok: z.literal(false),
  traceId: z.string().min(1),
  error: z.object({
    code: z.enum(SESSION_AUTH_ERROR_CODES),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
});

export const sessionAuthResponseSchema = z.union([
  sessionAuthSuccessResponseSchema,
  sessionAuthErrorResponseSchema,
]);

export const playerInitRequestSchema = z.object({
  sessionToken: z.string().min(1),
});

export const playerProfileSnapshotSchema = z.object({
  playerId: z.string().min(1),
  playerName: z.string().min(1),
  level: z.number().int().positive(),
  initializedAt: z.string().datetime(),
});

export const resourceSnapshotSchema = z.object({
  gold: z.number().int().nonnegative(),
  gem: z.number().int().nonnegative(),
  stamina: z.number().int().nonnegative(),
});

export const starterResourceSnapshotSchema = resourceSnapshotSchema;

export const starterBeastSnapshotSchema = z.object({
  beastInstanceId: z.string().min(1),
  beastId: z.string().min(1),
  beastName: z.string().min(1),
  level: z.number().int().positive(),
  role: z.string().min(1),
});

export const defaultTeamSnapshotSchema = z.object({
  teamId: z.string().min(1),
  name: z.string().min(1),
  beastInstanceIds: z.array(z.string().min(1)).min(1),
});

export const playerInitSnapshotSchema = z.object({
  accountId: z.string().min(1),
  player: playerProfileSnapshotSchema,
  resources: starterResourceSnapshotSchema,
  beasts: z.array(starterBeastSnapshotSchema).min(1),
  defaultTeam: defaultTeamSnapshotSchema,
});

export const playerInitSuccessResponseSchema = z.object({
  ok: z.literal(true),
  traceId: z.string().min(1),
  session: unifiedSessionSchema,
  snapshot: playerInitSnapshotSchema,
});

export const playerInitErrorResponseSchema = z.object({
  ok: z.literal(false),
  traceId: z.string().min(1),
  error: z.object({
    code: z.enum(PLAYER_INIT_ERROR_CODES),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
});

export const playerInitResponseSchema = z.union([
  playerInitSuccessResponseSchema,
  playerInitErrorResponseSchema,
]);

export const inventorySnapshotRequestSchema = z.object({
  sessionToken: z.string().min(1),
});

export const beastListRequestSchema = z.object({
  sessionToken: z.string().min(1),
});

export const beastDetailRequestSchema = z.object({
  sessionToken: z.string().min(1),
  beastInstanceId: z.string().min(1),
});

export const defaultTeamSetupRequestSchema = z
  .object({
    sessionToken: z.string().min(1),
    beastInstanceIds: z.array(z.string().min(1)).min(1),
  })
  .superRefine((value, ctx) => {
    const uniqueCount = new Set(value.beastInstanceIds).size;
    if (uniqueCount !== value.beastInstanceIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['beastInstanceIds'],
        message: 'duplicate beastInstanceIds are not allowed',
      });
    }
  });

export const inventoryItemSnapshotSchema = z.object({
  slotId: z.string().min(1),
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  itemType: z.enum(INVENTORY_ITEM_TYPES),
  quantity: z.number().int().positive(),
  stackable: z.boolean(),
});

export const inventoryBagCapacitySnapshotSchema = z.object({
  usedSlots: z.number().int().nonnegative(),
  totalSlots: z.number().int().positive(),
  freeSlots: z.number().int().nonnegative(),
});

export const inventoryBagSnapshotSchema = z.object({
  items: z.array(inventoryItemSnapshotSchema),
  capacity: inventoryBagCapacitySnapshotSchema,
});

export const inventorySnapshotSchema = z.object({
  accountId: z.string().min(1),
  playerId: z.string().min(1),
  resources: resourceSnapshotSchema,
  bag: inventoryBagSnapshotSchema,
  updatedAt: z.string().datetime(),
});

export const inventorySnapshotSuccessResponseSchema = z.object({
  ok: z.literal(true),
  traceId: z.string().min(1),
  snapshot: inventorySnapshotSchema,
});

export const inventorySnapshotErrorResponseSchema = z.object({
  ok: z.literal(false),
  traceId: z.string().min(1),
  error: z.object({
    code: z.enum(INVENTORY_ERROR_CODES),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
});

export const inventorySnapshotResponseSchema = z.union([
  inventorySnapshotSuccessResponseSchema,
  inventorySnapshotErrorResponseSchema,
]);

export const beastListEntrySchema = z.object({
  beastInstanceId: z.string().min(1),
  beastId: z.string().min(1),
  beastName: z.string().min(1),
  level: z.number().int().positive(),
  role: z.string().min(1),
  inDefaultTeam: z.boolean(),
  availableForBattle: z.boolean(),
});

export const beastListSuccessResponseSchema = z.object({
  ok: z.literal(true),
  traceId: z.string().min(1),
  beasts: z.array(beastListEntrySchema),
});

export const beastListErrorResponseSchema = z.object({
  ok: z.literal(false),
  traceId: z.string().min(1),
  error: z.object({
    code: z.enum(BEAST_LIST_ERROR_CODES),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
});

export const beastListResponseSchema = z.union([
  beastListSuccessResponseSchema,
  beastListErrorResponseSchema,
]);

export const beastTeamSummarySchema = z.object({
  teamId: z.string().min(1),
  name: z.string().min(1),
  beastInstanceIds: z.array(z.string().min(1)).min(1),
  capacity: z.number().int().positive(),
});

export const beastDetailEntrySchema = beastListEntrySchema.extend({
  canSetAsDefault: z.boolean(),
});

export const beastDetailSuccessResponseSchema = z.object({
  ok: z.literal(true),
  traceId: z.string().min(1),
  beast: beastDetailEntrySchema,
  defaultTeam: beastTeamSummarySchema,
});

export const beastDetailErrorResponseSchema = z.object({
  ok: z.literal(false),
  traceId: z.string().min(1),
  error: z.object({
    code: z.enum(BEAST_DETAIL_ERROR_CODES),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
});

export const beastDetailResponseSchema = z.union([
  beastDetailSuccessResponseSchema,
  beastDetailErrorResponseSchema,
]);

export const defaultTeamSetupSuccessResponseSchema = z.object({
  ok: z.literal(true),
  traceId: z.string().min(1),
  message: z.string().min(1),
  beast: beastDetailEntrySchema,
  defaultTeam: beastTeamSummarySchema,
});

export const defaultTeamSetupErrorResponseSchema = z.object({
  ok: z.literal(false),
  traceId: z.string().min(1),
  error: z.object({
    code: z.enum(DEFAULT_TEAM_SETUP_ERROR_CODES),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
});

export const defaultTeamSetupResponseSchema = z.union([
  defaultTeamSetupSuccessResponseSchema,
  defaultTeamSetupErrorResponseSchema,
]);

export const beastGrowthRequestSchema = z.object({
  sessionToken: z.string().min(1),
  beastInstanceId: z.string().min(1),
  actionId: z.enum(BEAST_GROWTH_ACTION_IDS),
});

export const beastGrowthErrorDetailsSchema = z.discriminatedUnion('reason', [
  z.object({
    reason: z.literal('action_not_allowed'),
    actionId: z.enum(BEAST_GROWTH_ACTION_IDS),
    guidance: z.string().min(1),
  }),
  z.object({
    reason: z.literal('resource_insufficient'),
    actionId: z.enum(BEAST_GROWTH_ACTION_IDS),
    guidance: z.string().min(1),
    resourceType: z.enum(RESOURCE_TYPES),
    currentAmount: z.number().int().nonnegative(),
    requiredAmount: z.number().int().positive(),
  }),
]);

export const beastGrowthSuccessResponseSchema = z.object({
  ok: z.literal(true),
  traceId: z.string().min(1),
  actionId: z.enum(BEAST_GROWTH_ACTION_IDS),
  message: z.string().min(1),
  beast: beastDetailEntrySchema,
  resources: resourceSnapshotSchema,
});

export const beastGrowthErrorResponseSchema = z.object({
  ok: z.literal(false),
  traceId: z.string().min(1),
  error: z.object({
    code: z.enum(BEAST_GROWTH_ERROR_CODES),
    message: z.string().min(1),
    retryable: z.boolean(),
    details: beastGrowthErrorDetailsSchema.optional(),
  }),
});

export const beastGrowthResponseSchema = z.union([
  beastGrowthSuccessResponseSchema,
  beastGrowthErrorResponseSchema,
]);

export const rewardClaimRequestSchema = z.object({
  sessionToken: z.string().min(1),
  rewardBundleId: z.enum(REWARD_BUNDLE_IDS),
});

export const rewardGrantedItemSchema = z.object({
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  itemType: z.enum(INVENTORY_ITEM_TYPES),
  quantity: z.number().int().positive(),
  stackable: z.boolean(),
});

export const rewardCapacityBlockedDetailsSchema = z.object({
  storage: z.literal('bag'),
  freeSlots: z.number().int().nonnegative(),
  requiredSlots: z.number().int().positive(),
  missingSlots: z.number().int().positive(),
  guidance: z.string().min(1),
  blockedItems: z.array(rewardGrantedItemSchema).min(1),
});

export const rewardClaimSuccessResponseSchema = z.object({
  ok: z.literal(true),
  traceId: z.string().min(1),
  rewardBundleId: z.enum(REWARD_BUNDLE_IDS),
  grantedItems: z.array(rewardGrantedItemSchema).min(1),
  snapshot: inventorySnapshotSchema,
});

export const rewardClaimErrorResponseSchema = z.object({
  ok: z.literal(false),
  traceId: z.string().min(1),
  error: z.object({
    code: z.enum(REWARD_CLAIM_ERROR_CODES),
    message: z.string().min(1),
    retryable: z.boolean(),
    details: rewardCapacityBlockedDetailsSchema.optional(),
  }),
});

export const rewardClaimResponseSchema = z.union([
  rewardClaimSuccessResponseSchema,
  rewardClaimErrorResponseSchema,
]);

export const resourceConsumeRequestSchema = z.object({
  sessionToken: z.string().min(1),
  actionId: z.enum(RESOURCE_CONSUME_ACTION_IDS),
});

export const consumedItemChangeSchema = z.object({
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  quantityConsumed: z.number().int().positive(),
  quantityRemaining: z.number().int().nonnegative(),
});

export const consumedResourceChangeSchema = z.object({
  resourceType: z.enum(RESOURCE_TYPES),
  amountConsumed: z.number().int().positive(),
  amountRemaining: z.number().int().nonnegative(),
});

export const resourceConsumeErrorDetailsSchema = z.discriminatedUnion(
  'reason',
  [
    z.object({
      reason: z.literal('action_not_allowed'),
      actionId: z.enum(RESOURCE_CONSUME_ACTION_IDS),
      guidance: z.string().min(1),
    }),
    z.object({
      reason: z.literal('item_insufficient'),
      actionId: z.enum(RESOURCE_CONSUME_ACTION_IDS),
      guidance: z.string().min(1),
      itemId: z.string().min(1),
      itemName: z.string().min(1),
      availableQuantity: z.number().int().nonnegative(),
      requiredQuantity: z.number().int().positive(),
    }),
    z.object({
      reason: z.literal('resource_insufficient'),
      actionId: z.enum(RESOURCE_CONSUME_ACTION_IDS),
      guidance: z.string().min(1),
      resourceType: z.enum(RESOURCE_TYPES),
      currentAmount: z.number().int().nonnegative(),
      requiredAmount: z.number().int().positive(),
    }),
  ],
);

export const resourceConsumeSuccessResponseSchema = z.object({
  ok: z.literal(true),
  traceId: z.string().min(1),
  actionId: z.enum(RESOURCE_CONSUME_ACTION_IDS),
  message: z.string().min(1),
  consumedItems: z.array(consumedItemChangeSchema),
  consumedResources: z.array(consumedResourceChangeSchema),
  snapshot: inventorySnapshotSchema,
});

export const resourceConsumeErrorResponseSchema = z.object({
  ok: z.literal(false),
  traceId: z.string().min(1),
  error: z.object({
    code: z.enum(RESOURCE_CONSUME_ERROR_CODES),
    message: z.string().min(1),
    retryable: z.boolean(),
    details: resourceConsumeErrorDetailsSchema.optional(),
  }),
});

export const resourceConsumeResponseSchema = z.union([
  resourceConsumeSuccessResponseSchema,
  resourceConsumeErrorResponseSchema,
]);

export function parseSessionAuthRequest(input: unknown): SessionAuthRequest {
  return sessionAuthRequestSchema.parse(input);
}

export function parseSessionAuthResponse(input: unknown): SessionAuthResponse {
  return sessionAuthResponseSchema.parse(input);
}

export function parsePlayerInitRequest(input: unknown): PlayerInitRequest {
  return playerInitRequestSchema.parse(input);
}

export function parsePlayerInitResponse(input: unknown): PlayerInitResponse {
  return playerInitResponseSchema.parse(input);
}

export function parseInventorySnapshotRequest(
  input: unknown,
): InventorySnapshotRequest {
  return inventorySnapshotRequestSchema.parse(input);
}

export function parseBeastListRequest(input: unknown): BeastListRequest {
  return beastListRequestSchema.parse(input);
}

export function parseBeastDetailRequest(input: unknown): BeastDetailRequest {
  return beastDetailRequestSchema.parse(input);
}

export function parseDefaultTeamSetupRequest(
  input: unknown,
): DefaultTeamSetupRequest {
  return defaultTeamSetupRequestSchema.parse(input);
}

export function parseInventorySnapshotResponse(
  input: unknown,
): InventorySnapshotResponse {
  return inventorySnapshotResponseSchema.parse(input);
}

export function parseBeastListResponse(input: unknown): BeastListResponse {
  return beastListResponseSchema.parse(input);
}

export function parseBeastDetailResponse(input: unknown): BeastDetailResponse {
  return beastDetailResponseSchema.parse(input);
}

export function parseDefaultTeamSetupResponse(
  input: unknown,
): DefaultTeamSetupResponse {
  return defaultTeamSetupResponseSchema.parse(input);
}

export function parseBeastGrowthRequest(input: unknown): BeastGrowthRequest {
  return beastGrowthRequestSchema.parse(input);
}

export function parseBeastGrowthResponse(input: unknown): BeastGrowthResponse {
  return beastGrowthResponseSchema.parse(input);
}

export function parseRewardClaimRequest(input: unknown): RewardClaimRequest {
  return rewardClaimRequestSchema.parse(input);
}

export function parseRewardClaimResponse(input: unknown): RewardClaimResponse {
  return rewardClaimResponseSchema.parse(input);
}

export function parseResourceConsumeRequest(
  input: unknown,
): ResourceConsumeRequest {
  return resourceConsumeRequestSchema.parse(input);
}

export function parseResourceConsumeResponse(
  input: unknown,
): ResourceConsumeResponse {
  return resourceConsumeResponseSchema.parse(input);
}
