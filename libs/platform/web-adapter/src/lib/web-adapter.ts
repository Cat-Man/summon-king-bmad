import {
  isWechatRuntime,
  normalizeString,
  parseSearchParams,
  type HostEnvironment,
  type PlatformAdapter,
} from '@workspace/bridge';

export const WEB_HOST_STORAGE_KEY = 'summon-king:web-host-user-id';

export interface WebAdapterOptions {
  fallbackUserId?: string;
  fallbackDeviceId?: string;
}

export function createWebAdapter(
  options: WebAdapterOptions = {},
): PlatformAdapter {
  return {
    platform: 'web',
    isSupported(environment: HostEnvironment) {
      const requestedPlatform = environment.runtime?.__SUMMON_KING_HOST__?.platform;
      if (requestedPlatform === 'web') {
        return true;
      }

      if (requestedPlatform === 'wechat-miniapp') {
        return false;
      }

      return !isWechatRuntime(environment);
    },
    async getNormalizedHostIdentity(environment: HostEnvironment) {
      const params = parseSearchParams(environment.search);
      const override = environment.runtime?.__SUMMON_KING_HOST__?.web;
      const queryUserId = normalizeString(params.get('hostUserId'));
      const storedUserId = normalizeString(
        environment.storage?.getItem(WEB_HOST_STORAGE_KEY),
      );
      const hostUserId =
        normalizeString(override?.hostUserId) ??
        queryUserId ??
        storedUserId ??
        options.fallbackUserId ??
        'dev-web-user';
      const sessionProof =
        normalizeString(override?.sessionProof) ??
        normalizeString(params.get('sessionProof'));
      const deviceId =
        normalizeString(override?.deviceId) ??
        normalizeString(params.get('deviceId')) ??
        options.fallbackDeviceId;
      const channel =
        normalizeString(override?.channel) ??
        normalizeString(params.get('channel')) ??
        'web';
      const isDevelopmentFallback =
        !normalizeString(override?.hostUserId) &&
        !queryUserId &&
        !storedUserId;

      environment.storage?.setItem?.(WEB_HOST_STORAGE_KEY, hostUserId);

      return {
        hostPlatform: 'web',
        hostUserId,
        ...(sessionProof ? { sessionProof } : {}),
        ...(deviceId ? { deviceId } : {}),
        channel,
        isDevelopmentFallback,
      };
    },
  };
}
