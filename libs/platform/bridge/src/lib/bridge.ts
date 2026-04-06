import type { HostPlatform, NormalizedHostIdentity } from '@workspace/types';

export interface HostStorage {
  getItem(key: string): string | null;
  setItem?(key: string, value: string): void;
}

export interface HostOverrides {
  platform?: HostPlatform;
  web?: Partial<NormalizedHostIdentity>;
  wechat?: Partial<NormalizedHostIdentity>;
}

export interface WechatRuntime {
  getLaunchOptionsSync?(): {
    query?: Record<string, string | undefined>;
  };
}

export interface HostRuntime {
  __SUMMON_KING_HOST__?: HostOverrides;
  __wxjs_environment__?: string;
  wx?: WechatRuntime;
}

export interface HostEnvironment {
  search?: string;
  userAgent?: string;
  storage?: HostStorage;
  runtime?: HostRuntime;
}

export interface PlatformAdapter {
  readonly platform: HostPlatform;
  isSupported(environment: HostEnvironment): boolean;
  getNormalizedHostIdentity(
    environment: HostEnvironment,
  ): Promise<NormalizedHostIdentity>;
}

export interface PlatformBridge {
  detectHostPlatform(): HostPlatform;
  getNormalizedHostIdentity(): Promise<NormalizedHostIdentity>;
}

export function parseSearchParams(search?: string): URLSearchParams {
  if (!search) {
    return new URLSearchParams();
  }

  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

export function isWechatRuntime(environment: HostEnvironment): boolean {
  const requestedPlatform = environment.runtime?.__SUMMON_KING_HOST__?.platform;
  if (requestedPlatform === 'wechat-miniapp') {
    return true;
  }

  if (environment.runtime?.__wxjs_environment__ === 'miniprogram') {
    return true;
  }

  if (environment.runtime?.wx) {
    return true;
  }

  return environment.userAgent?.toLowerCase().includes('miniprogram') ?? false;
}

export function normalizeString(
  value: string | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function createPlatformBridge({
  adapters,
  environment = {},
}: {
  adapters: PlatformAdapter[];
  environment?: HostEnvironment;
}): PlatformBridge {
  const resolveAdapter = (): PlatformAdapter => {
    const adapter = adapters.find((candidate) =>
      candidate.isSupported(environment),
    );

    if (!adapter) {
      throw new Error('No supported platform adapter found');
    }

    return adapter;
  };

  return {
    detectHostPlatform() {
      return resolveAdapter().platform;
    },
    getNormalizedHostIdentity() {
      return resolveAdapter().getNormalizedHostIdentity(environment);
    },
  };
}
