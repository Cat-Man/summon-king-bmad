import { createWechatAdapter } from './wechat-adapter.js';

describe('wechat adapter', () => {
  it('normalizes a mini program host identity into the shared shape', async () => {
    const adapter = createWechatAdapter();

    const identity = await adapter.getNormalizedHostIdentity({
      runtime: {
        __wxjs_environment__: 'miniprogram',
        __SUMMON_KING_HOST__: {
          platform: 'wechat-miniapp',
          wechat: {
            hostUserId: 'wx-open-id-001',
            sessionProof: 'wx-code-001',
            deviceId: 'wx-device-001',
            channel: 'wechat-shell',
          },
        },
      },
    });

    expect(identity).toEqual({
      hostPlatform: 'wechat-miniapp',
      hostUserId: 'wx-open-id-001',
      sessionProof: 'wx-code-001',
      deviceId: 'wx-device-001',
      channel: 'wechat-shell',
      isDevelopmentFallback: false,
    });
  });

  it('supports a mock fallback without a real mini program login flow', async () => {
    const adapter = createWechatAdapter({
      fallbackUserId: 'mock-open-id',
      fallbackSessionProof: 'mock-code',
    });

    const identity = await adapter.getNormalizedHostIdentity({
      runtime: {
        __wxjs_environment__: 'miniprogram',
      },
    });

    expect(identity).toEqual({
      hostPlatform: 'wechat-miniapp',
      hostUserId: 'mock-open-id',
      sessionProof: 'mock-code',
      channel: 'wechat-miniapp',
      isDevelopmentFallback: true,
    });
  });
});
