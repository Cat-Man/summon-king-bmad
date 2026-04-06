import type { PlatformBridge } from '@workspace/bridge';
import { authenticateSession } from '@workspace/data-access';
import {
  clearActiveSession,
  clearPlayerInitSnapshot,
  setActiveSession,
} from '@workspace/state';
import type { SessionAuthResponse, UnifiedSession } from '@workspace/types';

export interface RestoreSessionDependencies {
  bridge: Pick<PlatformBridge, 'getNormalizedHostIdentity'>;
  authSession?: typeof authenticateSession;
  persistSession?: (session: UnifiedSession) => UnifiedSession;
  clearSession?: () => void;
  clearSnapshot?: () => void;
}

export async function restoreSession({
  bridge,
  authSession = authenticateSession,
  persistSession = setActiveSession,
  clearSession = clearActiveSession,
  clearSnapshot = clearPlayerInitSnapshot,
}: RestoreSessionDependencies): Promise<SessionAuthResponse> {
  try {
    const normalizedHostIdentity = await bridge.getNormalizedHostIdentity();
    const response = await authSession({
      hostPlatform: normalizedHostIdentity.hostPlatform,
      normalizedHostIdentity,
    });

    if (response.ok) {
      persistSession(response.session);
      return response;
    }

    clearSession();
    clearSnapshot();
    return response;
  } catch (error) {
    clearSession();
    clearSnapshot();
    throw error;
  }
}
