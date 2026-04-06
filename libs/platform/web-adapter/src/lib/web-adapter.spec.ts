import {
  WEB_HOST_STORAGE_KEY,
  createWebAdapter,
} from './web-adapter.js';

function createMemoryStorage() {
  const store = new Map<string, string>();

  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('web adapter', () => {
  it('normalizes browser identity from query params and persists the user id', async () => {
    const storage = createMemoryStorage();
    const adapter = createWebAdapter();

    const identity = await adapter.getNormalizedHostIdentity({
      search:
        '?hostUserId=web-user-001&sessionProof=dev-proof&deviceId=device-001&channel=web-portal',
      storage,
    });

    expect(identity).toEqual({
      hostPlatform: 'web',
      hostUserId: 'web-user-001',
      sessionProof: 'dev-proof',
      deviceId: 'device-001',
      channel: 'web-portal',
      isDevelopmentFallback: false,
    });
    expect(storage.getItem(WEB_HOST_STORAGE_KEY)).toBe('web-user-001');
  });

  it('provides a local development fallback when no host identity is present', async () => {
    const adapter = createWebAdapter({
      fallbackUserId: 'dev-web-user',
      fallbackDeviceId: 'dev-browser',
    });

    const identity = await adapter.getNormalizedHostIdentity({
      storage: createMemoryStorage(),
    });

    expect(identity).toEqual({
      hostPlatform: 'web',
      hostUserId: 'dev-web-user',
      deviceId: 'dev-browser',
      channel: 'web',
      isDevelopmentFallback: true,
    });
  });
});
