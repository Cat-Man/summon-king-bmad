import {
  createPlatformBridge,
  type HostRuntime,
  type PlatformBridge,
} from '@workspace/bridge';
import {
  setAppBootstrapError,
  setAppBootstrapLoading,
  setAppBootstrapReady,
  type AppBootstrapError,
  type AppBootstrapState,
} from '@workspace/state';
import type {
  InventorySnapshotResponse,
  PlayerInitResponse,
  UnifiedSession,
} from '@workspace/types';
import { createWebAdapter } from '@workspace/web-adapter';
import { createWechatAdapter } from '@workspace/wechat-adapter';
import { initializeInventory } from './initialize-inventory';
import { initializePlayer } from './initialize-player';
import { restoreSession } from './restore-session';

export interface InitializeAppSessionOptions {
  createBridge?: () => Pick<PlatformBridge, 'getNormalizedHostIdentity'>;
  restoreSession?: typeof restoreSession;
  initializePlayer?: (session: UnifiedSession) => Promise<PlayerInitResponse>;
  initializeInventory?: (
    session: UnifiedSession,
  ) => Promise<InventorySnapshotResponse>;
  setBootstrapState?: (state: AppBootstrapState) => void;
  onError?: (error: unknown) => void;
}

function createDefaultBridge(): Pick<PlatformBridge, 'getNormalizedHostIdentity'> {
  return createPlatformBridge({
    adapters: [createWechatAdapter(), createWebAdapter()],
    environment: {
      search: window.location.search,
      userAgent: window.navigator.userAgent,
      storage: window.localStorage,
      runtime: window as Window & HostRuntime,
    },
  });
}

function isBootstrapFailure(
  error: unknown,
): error is {
  ok: false;
  traceId: string;
  error: {
    message: string;
    retryable: boolean;
  };
} {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return (
    'ok' in error &&
    (error as { ok?: boolean }).ok === false &&
    'traceId' in error &&
    'error' in error
  );
}

function mapBootstrapError(error: unknown): AppBootstrapError {
  if (isBootstrapFailure(error)) {
    return {
      title: '进入失败',
      message: error.error.message,
      traceId: error.traceId,
      retryable: error.error.retryable,
    };
  }

  return {
    title: '连接失败',
    message: '网络连接异常，请重试',
    retryable: true,
  };
}

function applyBootstrapState(state: AppBootstrapState): void {
  switch (state.phase) {
    case 'restoring-session':
    case 'initializing-player':
      setAppBootstrapLoading(state.phase, state.message);
      return;
    case 'ready':
      setAppBootstrapReady(state.message);
      return;
    case 'error':
      setAppBootstrapError(state.error ?? mapBootstrapError(undefined));
      return;
    case 'idle':
      setAppBootstrapReady(state.message);
      return;
  }
}

export async function initializeAppSession(
  options: InitializeAppSessionOptions = {},
): Promise<void> {
  const createBridge = options.createBridge ?? createDefaultBridge;
  const restoreSessionAction = options.restoreSession ?? restoreSession;
  const initializePlayerAction =
    options.initializePlayer ?? initializePlayer;
  const initializeInventoryAction =
    options.initializeInventory ?? initializeInventory;
  const setBootstrapState = options.setBootstrapState ?? applyBootstrapState;

  setBootstrapState({
    phase: 'restoring-session',
    message: '正在连接账号会话...',
    error: null,
  });
  try {
    const restoreResponse = await restoreSessionAction({
      bridge: createBridge(),
    });

    if (!restoreResponse.ok) {
      throw restoreResponse;
    }

    setBootstrapState({
      phase: 'initializing-player',
      message: '正在同步角色与开局数据...',
      error: null,
    });
    const initResponse = await initializePlayerAction(restoreResponse.session);
    if (!initResponse.ok) {
      throw initResponse;
    }

    setBootstrapState({
      phase: 'initializing-player',
      message: '正在同步背包与资源...',
      error: null,
    });
    const inventoryResponse = await initializeInventoryAction(
      initResponse.session,
    );
    if (!inventoryResponse.ok) {
      throw inventoryResponse;
    }

    setBootstrapState({
      phase: 'ready',
      message: '一期主流程已就绪',
      error: null,
    });
  } catch (error) {
    const mappedError = mapBootstrapError(error);
    setBootstrapState({
      phase: 'error',
      message: mappedError.message,
      error: mappedError,
    });
    options.onError?.(error);
  }
}
