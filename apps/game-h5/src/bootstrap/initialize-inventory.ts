import { fetchInventorySnapshot as requestInventorySnapshot } from '@workspace/data-access';
import {
  clearInventorySnapshot,
  setInventorySnapshot,
} from '@workspace/state';
import type {
  InventorySnapshot,
  InventorySnapshotResponse,
  UnifiedSession,
} from '@workspace/types';

export interface InitializeInventoryDependencies {
  session: UnifiedSession;
  fetchInventory?: typeof requestInventorySnapshot;
  persistInventory?: (snapshot: InventorySnapshot) => InventorySnapshot;
  clearInventory?: () => void;
}

export async function initializeInventory(
  input: UnifiedSession | InitializeInventoryDependencies,
  dependencies: Omit<InitializeInventoryDependencies, 'session'> = {},
): Promise<InventorySnapshotResponse> {
  const {
    session,
    fetchInventory = requestInventorySnapshot,
    persistInventory = setInventorySnapshot,
    clearInventory = clearInventorySnapshot,
  } = 'session' in input ? input : { session: input, ...dependencies };

  try {
    const response = await fetchInventory({
      sessionToken: session.sessionToken,
    });

    if (response.ok) {
      persistInventory(response.snapshot);
      return response;
    }

    clearInventory();
    return response;
  } catch (error) {
    clearInventory();
    throw error;
  }
}
