import { initializePlayer as requestPlayerInitialization } from '@workspace/data-access';
import {
  clearActiveSession,
  clearPlayerInitSnapshot,
  setActiveSession,
  setPlayerInitSnapshot,
} from '@workspace/state';
import type {
  PlayerInitResponse,
  PlayerInitSnapshot,
  UnifiedSession,
} from '@workspace/types';

export interface InitializePlayerDependencies {
  session: UnifiedSession;
  initPlayer?: typeof requestPlayerInitialization;
  persistSession?: (session: UnifiedSession) => UnifiedSession;
  persistSnapshot?: (snapshot: PlayerInitSnapshot) => PlayerInitSnapshot;
  clearSession?: () => void;
  clearSnapshot?: () => void;
}

export async function initializePlayer(
  input: UnifiedSession | InitializePlayerDependencies,
  dependencies: Omit<InitializePlayerDependencies, 'session'> = {},
): Promise<PlayerInitResponse> {
  const {
    session,
    initPlayer = requestPlayerInitialization,
    persistSession = setActiveSession,
    persistSnapshot = setPlayerInitSnapshot,
    clearSession = clearActiveSession,
    clearSnapshot = clearPlayerInitSnapshot,
  } = 'session' in input ? input : { session: input, ...dependencies };

  try {
    const response = await initPlayer({
      sessionToken: session.sessionToken,
    });

    if (response.ok) {
      persistSession(response.session);
      persistSnapshot(response.snapshot);
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
