import { restoreSession } from './restore-session';

describe('restoreSession', () => {
  it('uses platform bridge and data-access to restore the unified session', async () => {
    const bridge = {
      getNormalizedHostIdentity: vi.fn().mockResolvedValue({
        hostPlatform: 'web',
        hostUserId: 'web-user-001',
        deviceId: 'browser-device-1',
        channel: 'web-portal',
        isDevelopmentFallback: false,
      }),
    };
    const authSession = vi.fn().mockResolvedValue({
      ok: true,
      traceId: 'trace-001',
      session: {
        accountId: 'acc_001',
        playerId: null,
        sessionToken: 'sess_001',
        hostPlatform: 'web',
        needsPlayerInitialization: true,
      },
    });
    const persistSession = vi.fn();

    const response = await restoreSession({
      bridge,
      authSession,
      persistSession,
    });

    if (!response.ok) {
      throw new Error('Expected session restoration to succeed');
    }

    expect(bridge.getNormalizedHostIdentity).toHaveBeenCalledTimes(1);
    expect(authSession).toHaveBeenCalledWith({
      hostPlatform: 'web',
      normalizedHostIdentity: {
        hostPlatform: 'web',
        hostUserId: 'web-user-001',
        deviceId: 'browser-device-1',
        channel: 'web-portal',
        isDevelopmentFallback: false,
      },
    });
    expect(persistSession).toHaveBeenCalledWith(response.session);
  });

  it('does not persist state when unified session auth fails', async () => {
    const persistSession = vi.fn();
    const clearSession = vi.fn();
    const clearSnapshot = vi.fn();

    const response = await restoreSession({
      bridge: {
        getNormalizedHostIdentity: vi.fn().mockResolvedValue({
          hostPlatform: 'wechat-miniapp',
          hostUserId: 'mock-open-id',
          channel: 'wechat-miniapp',
          isDevelopmentFallback: true,
        }),
      },
      authSession: vi.fn().mockResolvedValue({
        ok: false,
        traceId: 'trace-002',
        error: {
          code: 'SESSION_AUTH_INVALID_INPUT',
          message: '统一会话请求无效',
          retryable: false,
        },
      }),
      persistSession,
      clearSession,
      clearSnapshot,
    });

    expect(response.ok).toBe(false);
    expect(persistSession).not.toHaveBeenCalled();
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(clearSnapshot).toHaveBeenCalledTimes(1);
  });
});
