import {
  isWechatRuntime,
  normalizeString,
  parseSearchParams,
  type HostEnvironment,
  type PlatformAdapter,
} from '@workspace/bridge';

export interface WechatAdapterOptions {
  fallbackUserId?: string;
  fallbackSessionProof?: string;
}

export function createWechatAdapter(
  options: WechatAdapterOptions = {},
): PlatformAdapter {
  return {
    platform: 'wechat-miniapp',
    isSupported(environment: HostEnvironment) {
      const requestedPlatform = environment.runtime?.__SUMMON_KING_HOST__?.platform;
      if (requestedPlatform === 'wechat-miniapp') {
        return true;
      }

      if (requestedPlatform === 'web') {
        return false;
      }

      return isWechatRuntime(environment);
    },
    async getNormalizedHostIdentity(environment: HostEnvironment) {
      const params = parseSearchParams(environment.search);
      const override = environment.runtime?.__SUMMON_KING_HOST__?.wechat;
      const launchQuery =
        environment.runtime?.wx?.getLaunchOptionsSync?.().query ?? {};
      const launchOpenId = normalizeString(launchQuery.openId);
      const queryOpenId =
        normalizeString(params.get('openId')) ??
        normalizeString(params.get('hostUserId'));
      const hostUserId =
        normalizeString(override?.hostUserId) ??
        launchOpenId ??
        queryOpenId ??
        options.fallbackUserId ??
        'mock-wechat-open-id';
      const sessionProof =
        normalizeString(override?.sessionProof) ??
        normalizeString(launchQuery.code) ??
        normalizeString(params.get('code')) ??
        options.fallbackSessionProof;
      const deviceId =
        normalizeString(override?.deviceId) ??
        normalizeString(launchQuery.deviceId) ??
        normalizeString(params.get('deviceId'));
      const channel =
        normalizeString(override?.channel) ??
        normalizeString(launchQuery.channel) ??
        normalizeString(params.get('channel')) ??
        'wechat-miniapp';
      const isDevelopmentFallback =
        !normalizeString(override?.hostUserId) &&
        !launchOpenId &&
        !queryOpenId;

      return {
        hostPlatform: 'wechat-miniapp',
        hostUserId,
        ...(sessionProof ? { sessionProof } : {}),
        ...(deviceId ? { deviceId } : {}),
        channel,
        isDevelopmentFallback,
      };
    },
  };
}
