import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type {
  InventorySnapshot,
  ResourceConsumeResponse,
  RewardClaimResponse,
} from '@workspace/types';
import { InventoryPage } from './inventory-page';

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

describe('InventoryPage', () => {
  function createSnapshot(
    overrides: Partial<InventorySnapshot> = {},
  ): InventorySnapshot {
    return {
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
      ...overrides,
    };
  }

  it('renders an understandable empty state when the bag has no items', () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <InventoryPage
          snapshot={createSnapshot({
            bag: {
              items: [],
              capacity: {
                usedSlots: 0,
                totalSlots: 20,
                freeSlots: 20,
              },
            },
          })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '背包总览' })).toBeTruthy();
    expect(screen.getByText('当前背包为空')).toBeTruthy();
    expect(screen.getByText('可以继续挑战、领取奖励或准备后续成长。')).toBeTruthy();
    expect(screen.getByText('已用 0 / 20')).toBeTruthy();
  });

  it('renders resource summary, item cards and capacity overview from the authoritative snapshot', () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <InventoryPage snapshot={createSnapshot()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('金币')).toBeTruthy();
    expect(screen.getByText('灵玉')).toBeTruthy();
    expect(screen.getByText('体力')).toBeTruthy();
    expect(screen.getByText('回城符')).toBeTruthy();
    expect(screen.getByText('消耗品')).toBeTruthy();
    expect(screen.getByText('数量 x5')).toBeTruthy();
    expect(screen.getByText('可叠加')).toBeTruthy();
    expect(screen.getByText('已用 1 / 20')).toBeTruthy();
    expect(screen.getByText('剩余 19 格')).toBeTruthy();
  });

  it('claims a controlled reward bundle, refreshes the snapshot and shows success feedback', async () => {
    const persistInventory = vi.fn();
    const claimReward = vi.fn(async () => ({
      ok: true,
      traceId: 'trace-reward-001',
      rewardBundleId: 'inventory-demo-single-reward',
      grantedItems: [
        {
          itemId: 'item_reward_001',
          itemName: '战利箱',
          itemType: 'consumable',
          quantity: 1,
          stackable: false,
        },
      ],
      snapshot: createSnapshot({
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
            {
              slotId: 'bag-slot-0002',
              itemId: 'item_reward_001',
              itemName: '战利箱',
              itemType: 'consumable',
              quantity: 1,
              stackable: false,
            },
          ],
          capacity: {
            usedSlots: 2,
            totalSlots: 20,
            freeSlots: 18,
          },
        },
      }),
    } satisfies RewardClaimResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <InventoryPage
          snapshot={createSnapshot()}
          sessionToken="sess_001"
          claimReward={claimReward}
          persistInventory={persistInventory}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '领取单格奖励' }));

    await waitFor(() => {
      expect(claimReward).toHaveBeenCalledWith({
        sessionToken: 'sess_001',
        rewardBundleId: 'inventory-demo-single-reward',
      });
    });

    expect(await screen.findByText('领取成功')).toBeTruthy();
    expect(screen.getByText('战利箱')).toBeTruthy();
    expect(screen.getByText('已用 2 / 20')).toBeTruthy();
    expect(persistInventory).toHaveBeenCalledTimes(1);
  });

  it('shows the server-provided capacity blocking feedback when a reward cannot fit into the bag', async () => {
    const claimReward = vi.fn(async () => ({
      ok: false,
      traceId: 'trace-reward-002',
      error: {
        code: 'REWARD_CLAIM_CAPACITY_BLOCKED',
        message: '背包容量不足，奖励已被阻断',
        retryable: true,
        details: {
          storage: 'bag',
          freeSlots: 19,
          requiredSlots: 20,
          missingSlots: 1,
          guidance: '请先整理、消耗或清出背包空位后再继续领取奖励。',
          blockedItems: [
            {
              itemId: 'item_reward_001',
              itemName: '战利箱',
              itemType: 'consumable',
              quantity: 1,
              stackable: false,
            },
          ],
        },
      },
    } satisfies RewardClaimResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <InventoryPage
          snapshot={createSnapshot()}
          sessionToken="sess_001"
          claimReward={claimReward}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '尝试大包奖励' }));

    expect(await screen.findByText('背包容量不足')).toBeTruthy();
    expect(
      screen.getByText(
        '当前剩余 19 格，还差 1 格。请先整理、消耗或清出背包空位后再继续领取奖励。',
      ),
    ).toBeTruthy();
  });

  it('uses one return scroll through the shared consume flow, refreshes the snapshot and shows success feedback', async () => {
    const persistInventory = vi.fn();
    const consumeResource = vi.fn(async () => ({
      ok: true,
      traceId: 'trace-consume-001',
      actionId: 'use-return-scroll',
      message: '已使用 回城符 x1，当前剩余 4。',
      consumedItems: [
        {
          itemId: 'item_1027',
          itemName: '回城符',
          quantityConsumed: 1,
          quantityRemaining: 4,
        },
      ],
      consumedResources: [],
      snapshot: createSnapshot({
        bag: {
          items: [
            {
              slotId: 'bag-slot-0001',
              itemId: 'item_1027',
              itemName: '回城符',
              itemType: 'consumable',
              quantity: 4,
              stackable: true,
            },
          ],
          capacity: {
            usedSlots: 1,
            totalSlots: 20,
            freeSlots: 19,
          },
        },
      }),
    } satisfies ResourceConsumeResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <InventoryPage
          snapshot={createSnapshot()}
          sessionToken="sess_001"
          consumeResource={consumeResource}
          persistInventory={persistInventory}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '使用 1 张回城符' }));

    await waitFor(() => {
      expect(consumeResource).toHaveBeenCalledWith({
        sessionToken: 'sess_001',
        actionId: 'use-return-scroll',
      });
    });

    expect(await screen.findByText('操作成功')).toBeTruthy();
    expect(screen.getByText('已使用 回城符 x1，当前剩余 4。')).toBeTruthy();
    expect(screen.getByText('数量 x4')).toBeTruthy();
    expect(persistInventory).toHaveBeenCalledTimes(1);
  });

  it('deducts controlled gold through the shared consume flow and refreshes the resource summary', async () => {
    const consumeResource = vi.fn(async () => ({
      ok: true,
      traceId: 'trace-consume-002',
      actionId: 'deduct-growth-gold',
      message: '已扣除 200 金币，当前剩余 800。',
      consumedItems: [],
      consumedResources: [
        {
          resourceType: 'gold',
          amountConsumed: 200,
          amountRemaining: 800,
        },
      ],
      snapshot: createSnapshot({
        resources: {
          gold: 800,
          gem: 100,
          stamina: 20,
        },
      }),
    } satisfies ResourceConsumeResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <InventoryPage
          snapshot={createSnapshot()}
          sessionToken="sess_001"
          consumeResource={consumeResource}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '扣除 200 金币' }));

    expect(await screen.findByText('操作成功')).toBeTruthy();
    expect(screen.getByText('已扣除 200 金币，当前剩余 800。')).toBeTruthy();
    expect(screen.getByText('800')).toBeTruthy();
  });

  it('shows the server-provided business blocking feedback when a consume action cannot be completed', async () => {
    const consumeResource = vi.fn(async () => ({
      ok: false,
      traceId: 'trace-consume-003',
      error: {
        code: 'RESOURCE_CONSUME_RESOURCE_INSUFFICIENT',
        message: '金币不足，无法完成当前扣减动作',
        retryable: true,
        details: {
          reason: 'resource_insufficient',
          actionId: 'deduct-growth-gold',
          guidance: '请先获取更多金币后再尝试。',
          resourceType: 'gold',
          currentAmount: 0,
          requiredAmount: 200,
        },
      },
    } satisfies ResourceConsumeResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <InventoryPage
          snapshot={createSnapshot({
            resources: {
              gold: 0,
              gem: 100,
              stamina: 20,
            },
          })}
          sessionToken="sess_001"
          consumeResource={consumeResource}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: '扣除 200 金币' }));

    expect(await screen.findByText('操作受阻')).toBeTruthy();
    expect(screen.getByText('金币不足，无法完成当前扣减动作')).toBeTruthy();
    expect(screen.getByText('请先获取更多金币后再尝试。')).toBeTruthy();
  });
});
