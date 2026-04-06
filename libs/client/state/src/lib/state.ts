import type {
  InventorySnapshot,
  PlayerInitSnapshot,
  UnifiedSession,
} from '@workspace/types';

let activeSession: UnifiedSession | null = null;
let activeInventorySnapshot: InventorySnapshot | null = null;
let activePlayerInitSnapshot: PlayerInitSnapshot | null = null;
const bootstrapListeners = new Set<(state: AppBootstrapState) => void>();

export type AppBootstrapPhase =
  | 'idle'
  | 'restoring-session'
  | 'initializing-player'
  | 'ready'
  | 'error';

export interface AppBootstrapError {
  title: string;
  message: string;
  traceId?: string;
  retryable: boolean;
}

export interface AppBootstrapState {
  phase: AppBootstrapPhase;
  message: string;
  error: AppBootstrapError | null;
}

const INITIAL_APP_BOOTSTRAP_STATE: AppBootstrapState = {
  phase: 'idle',
  message: '准备进入召唤之王',
  error: null,
};

let appBootstrapState: AppBootstrapState = INITIAL_APP_BOOTSTRAP_STATE;

function notifyBootstrapListeners(): void {
  for (const listener of bootstrapListeners) {
    listener(appBootstrapState);
  }
}

export function getActiveSession(): UnifiedSession | null {
  return activeSession;
}

export function setActiveSession(session: UnifiedSession): UnifiedSession {
  activeSession = session;
  return activeSession;
}

export function clearActiveSession(): void {
  activeSession = null;
}

export function getPlayerInitSnapshot(): PlayerInitSnapshot | null {
  return activePlayerInitSnapshot;
}

export function setPlayerInitSnapshot(
  snapshot: PlayerInitSnapshot,
): PlayerInitSnapshot {
  activePlayerInitSnapshot = snapshot;
  return activePlayerInitSnapshot;
}

export function clearPlayerInitSnapshot(): void {
  activePlayerInitSnapshot = null;
}

export function getInventorySnapshot(): InventorySnapshot | null {
  return activeInventorySnapshot;
}

export function setInventorySnapshot(
  snapshot: InventorySnapshot,
): InventorySnapshot {
  activeInventorySnapshot = snapshot;
  return activeInventorySnapshot;
}

export function clearInventorySnapshot(): void {
  activeInventorySnapshot = null;
}

export function getAppBootstrapState(): AppBootstrapState {
  return appBootstrapState;
}

export function subscribeAppBootstrapState(
  listener: (state: AppBootstrapState) => void,
): () => void {
  bootstrapListeners.add(listener);
  return () => {
    bootstrapListeners.delete(listener);
  };
}

export function setAppBootstrapState(
  state: AppBootstrapState,
): AppBootstrapState {
  appBootstrapState = state;
  notifyBootstrapListeners();
  return appBootstrapState;
}

export function setAppBootstrapLoading(
  phase: Extract<AppBootstrapPhase, 'restoring-session' | 'initializing-player'>,
  message: string,
): AppBootstrapState {
  return setAppBootstrapState({
    phase,
    message,
    error: null,
  });
}

export function setAppBootstrapReady(
  message: string,
): AppBootstrapState {
  return setAppBootstrapState({
    phase: 'ready',
    message,
    error: null,
  });
}

export function setAppBootstrapError(
  error: AppBootstrapError,
): AppBootstrapState {
  return setAppBootstrapState({
    phase: 'error',
    message: error.message,
    error,
  });
}

export function clearAppBootstrapState(): void {
  appBootstrapState = { ...INITIAL_APP_BOOTSTRAP_STATE };
  notifyBootstrapListeners();
}
