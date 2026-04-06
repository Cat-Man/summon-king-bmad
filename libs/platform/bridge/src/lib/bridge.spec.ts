import type { NormalizedHostIdentity } from '@workspace/types';
import {
  createPlatformBridge,
  type HostEnvironment,
  type PlatformAdapter,
} from './bridge.js';

function createAdapter(
  platform: 'web' | 'wechat-miniapp',
  predicate: (environment: HostEnvironment) => boolean,
  identity: NormalizedHostIdentity,
): PlatformAdapter {
  return {
    platform,
    isSupported: predicate,
    async getNormalizedHostIdentity() {
      return identity;
    },
  };
}

describe('platform bridge', () => {
  it('selects the supported adapter and exposes its platform', async () => {
    const bridge = createPlatformBridge({
      adapters: [
        createAdapter(
          'web',
          (environment) => environment.runtime?.__wxjs_environment__ !== 'miniprogram',
          {
            hostPlatform: 'web',
            hostUserId: 'web-user-001',
            deviceId: 'browser-device-1',
            channel: 'web-portal',
            isDevelopmentFallback: false,
          },
        ),
        createAdapter(
          'wechat-miniapp',
          (environment) => environment.runtime?.__wxjs_environment__ === 'miniprogram',
          {
            hostPlatform: 'wechat-miniapp',
            hostUserId: 'wx-open-id-001',
            sessionProof: 'wx-code-001',
            channel: 'wechat-shell',
            isDevelopmentFallback: false,
          },
        ),
      ],
      environment: {
        runtime: {
          __wxjs_environment__: 'miniprogram',
        },
      },
    });

    expect(bridge.detectHostPlatform()).toBe('wechat-miniapp');
    await expect(bridge.getNormalizedHostIdentity()).resolves.toMatchObject({
      hostPlatform: 'wechat-miniapp',
      hostUserId: 'wx-open-id-001',
      sessionProof: 'wx-code-001',
    });
  });

  it('falls back to the browser adapter when no mini program runtime is present', async () => {
    const bridge = createPlatformBridge({
      adapters: [
        createAdapter(
          'web',
          (environment) => environment.runtime?.__wxjs_environment__ !== 'miniprogram',
          {
            hostPlatform: 'web',
            hostUserId: 'web-user-001',
            deviceId: 'browser-device-1',
            channel: 'web-portal',
            isDevelopmentFallback: false,
          },
        ),
      ],
      environment: {
        userAgent: 'Mozilla/5.0',
      },
    });

    expect(bridge.detectHostPlatform()).toBe('web');
    await expect(bridge.getNormalizedHostIdentity()).resolves.toMatchObject({
      hostPlatform: 'web',
      hostUserId: 'web-user-001',
    });
  });
});
