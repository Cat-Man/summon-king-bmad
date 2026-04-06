import { initializeInventory } from './initialize-inventory';

describe('initializeInventory', () => {
  it('requests the authoritative inventory snapshot and persists it for later routes', async () => {
    const persistInventory = vi.fn();

    const response = await initializeInventory({
      session: {
        accountId: 'acc_001',
        playerId: 'player_001',
        sessionToken: 'sess_001',
        hostPlatform: 'web',
        needsPlayerInitialization: false,
      },
      fetchInventory: vi.fn().mockResolvedValue({
        ok: true,
        traceId: 'trace-inventory-001',
        snapshot: {
          accountId: 'acc_001',
          playerId: 'player_001',
          resources: {
            gold: 1000,
            gem: 100,
            stamina: 20,
          },
          bag: {
            items: [
              {
                slotId: 'bag-slot-0001',
                itemId: 'item_1027',
                itemName: '回城符',
                itemType: 'consumable',
                quantity: 5,
                stackable: true,
              },
            ],
            capacity: {
              usedSlots: 1,
              totalSlots: 20,
              freeSlots: 19,
            },
          },
          updatedAt: '2026-04-06T00:00:00.000Z',
        },
      }),
      persistInventory,
    });

    expect(response.ok).toBe(true);
    expect(persistInventory).toHaveBeenCalledWith(
      expect.objectContaining({
        playerId: 'player_001',
        bag: expect.objectContaining({
          capacity: expect.objectContaining({
            totalSlots: 20,
          }),
          items: [
            expect.objectContaining({
              itemName: '回城符',
            }),
          ],
        }),
      }),
    );
  });

  it('clears stale inventory state and surfaces an inventory failure to callers', async () => {
    const clearInventory = vi.fn();

    const response = await initializeInventory(
      {
        accountId: 'acc_001',
        playerId: 'player_001',
        sessionToken: 'sess_001',
        hostPlatform: 'web',
        needsPlayerInitialization: false,
      },
      {
        fetchInventory: vi.fn().mockResolvedValue({
          ok: false,
          traceId: 'trace-inventory-err',
          error: {
            code: 'INVENTORY_INVALID_SESSION',
            message: '库存会话无效',
            retryable: false,
          },
        }),
        clearInventory,
      },
    );

    expect(response.ok).toBe(false);
    expect(clearInventory).toHaveBeenCalledTimes(1);
  });
});
