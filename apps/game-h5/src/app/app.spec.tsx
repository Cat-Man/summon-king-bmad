import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from './app';
import {
  clearAppBootstrapState,
  clearActiveSession,
  clearInventorySnapshot,
  clearPlayerInitSnapshot,
  setAppBootstrapError,
  setAppBootstrapLoading,
  setAppBootstrapReady,
  setActiveSession,
  setInventorySnapshot,
  setPlayerInitSnapshot,
} from '@workspace/state';
import type { PlayerInitSnapshot } from '@workspace/types';

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

describe('App', () => {
  function renderApp(initialEntries: string[] = ['/']) {
    return render(
      <MemoryRouter future={ROUTER_FUTURE} initialEntries={initialEntries}>
        <App />
      </MemoryRouter>,
    );
  }

  function createReadySnapshot(): PlayerInitSnapshot {
    return {
      accountId: 'acc_001',
      player: {
        playerId: 'player_001',
        playerName: '召唤师0001',
        level: 1,
        initializedAt: '2026-04-06T00:00:00.000Z',
      },
      resources: {
        gold: 1000,
        gem: 100,
        stamina: 20,
      },
      beasts: [
        {
          beastInstanceId: 'beast_inst_001',
          beastId: 'starter-beast-001',
          beastName: '初始幻兽',
          level: 1,
          role: 'starter',
        },
      ],
      defaultTeam: {
        teamId: 'team_001',
        name: '默认队伍',
        beastInstanceIds: ['beast_inst_001'],
      },
    };
  }

  function seedReadyState(snapshot: PlayerInitSnapshot = createReadySnapshot()) {
    act(() => {
      setActiveSession({
        accountId: 'acc_001',
        playerId: 'player_001',
        sessionToken: 'sess_001',
        hostPlatform: 'web',
        needsPlayerInitialization: false,
      });
      setPlayerInitSnapshot(snapshot);
      setInventorySnapshot({
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
      });
      setAppBootstrapReady('一期主流程已就绪');
    });
  }

  afterEach(() => {
    act(() => {
      clearAppBootstrapState();
      clearActiveSession();
      clearInventorySnapshot();
      clearPlayerInitSnapshot();
    });
    vi.unstubAllGlobals();
  });

  it('renders a loading entry page while session restoration is in progress', () => {
    act(() => {
      setAppBootstrapLoading('restoring-session', '正在连接账号会话...');
    });

    renderApp();

    expect(screen.getByRole('heading', { name: '进入召唤之王' })).toBeTruthy();
    expect(screen.getByText('正在连接账号会话...')).toBeTruthy();
  });

  it('renders a retryable failure state when bootstrap fails', () => {
    const onRetry = vi.fn();
    act(() => {
      setAppBootstrapError({
        title: '连接失败',
        message: '网络连接异常，请重试',
        traceId: 'trace-entry-001',
        retryable: true,
      });
    });

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <App onRetry={onRetry} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '连接失败' })).toBeTruthy();
    expect(screen.getByText('网络连接异常，请重试')).toBeTruthy();
    expect(screen.getByText('追踪编号：trace-entry-001')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '重新尝试进入' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the main hub with core entries, recommendation and deferred governance once ready', () => {
    seedReadyState();

    renderApp();

    expect(screen.getByRole('heading', { name: '召唤之王主界面' })).toBeTruthy();
    expect(screen.getByText(/召唤师0001/)).toBeTruthy();
    expect(screen.getByText('背包')).toBeTruthy();
    expect(screen.getByText('幻兽')).toBeTruthy();
    expect(screen.getByText('战斗')).toBeTruthy();
    expect(screen.getByText('推荐下一步')).toBeTruthy();
    expect(screen.getByRole('link', { name: '前往幻兽' })).toBeTruthy();
    expect(screen.getByText('聊天')).toBeTruthy();
    expect(screen.getByText('VIP')).toBeTruthy();
    expect(screen.getAllByText('未开放').length).toBeGreaterThan(0);
  });

  it('navigates to a core entry when the recommended action is triggered', async () => {
    seedReadyState();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          ok: true,
          traceId: 'trace-beast-001',
          beasts: [
            {
              beastInstanceId: 'beast_inst_001',
              beastId: 'starter-beast-001',
              beastName: '初始幻兽',
              level: 1,
              role: 'starter',
              inDefaultTeam: true,
              availableForBattle: true,
            },
          ],
        }),
      }),
    );

    renderApp();

    fireEvent.click(screen.getByRole('link', { name: '前往幻兽' }));

    expect(await screen.findByRole('heading', { name: '幻兽列表' })).toBeTruthy();
    expect(await screen.findByText('初始幻兽')).toBeTruthy();
    expect(screen.getByText('默认队伍中')).toBeTruthy();
  });

  it('renders the beast detail route when visited directly', async () => {
    seedReadyState();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          ok: true,
          traceId: 'trace-beast-detail-001',
          beast: {
            beastInstanceId: 'beast_inst_001',
            beastId: 'starter-beast-001',
            beastName: '初始幻兽',
            level: 1,
            role: 'starter',
            inDefaultTeam: true,
            availableForBattle: true,
            canSetAsDefault: false,
          },
          defaultTeam: {
            teamId: 'team_001',
            name: '默认队伍',
            beastInstanceIds: ['beast_inst_001'],
            capacity: 1,
          },
        }),
      }),
    );

    renderApp(['/beasts/beast_inst_001']);

    expect(await screen.findByRole('heading', { name: '幻兽详情' })).toBeTruthy();
    expect(screen.getAllByText('初始幻兽').length).toBeGreaterThan(0);
    expect(screen.getByText('默认队伍中')).toBeTruthy();
  });

  it('keeps the latest default team marker when returning to the list after a successful setup even if list refresh fails', async () => {
    seedReadyState({
      accountId: 'acc_001',
      player: {
        playerId: 'player_001',
        playerName: '召唤师0001',
        level: 1,
        initializedAt: '2026-04-06T00:00:00.000Z',
      },
      resources: {
        gold: 1000,
        gem: 100,
        stamina: 20,
      },
      beasts: [
        {
          beastInstanceId: 'beast_inst_001',
          beastId: 'starter-beast-001',
          beastName: '初始幻兽',
          level: 1,
          role: 'starter',
        },
        {
          beastInstanceId: 'beast_inst_002',
          beastId: 'starter-beast-002',
          beastName: '烈焰狐',
          level: 3,
          role: 'damage',
        },
      ],
      defaultTeam: {
        teamId: 'team_001',
        name: '默认队伍',
        beastInstanceIds: ['beast_inst_001'],
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        if (input === '/api/v1/beast/beast_inst_002') {
          return {
            json: async () => ({
              ok: true,
              traceId: 'trace-beast-detail-002',
              beast: {
                beastInstanceId: 'beast_inst_002',
                beastId: 'starter-beast-002',
                beastName: '烈焰狐',
                level: 3,
                role: 'damage',
                inDefaultTeam: false,
                availableForBattle: true,
                canSetAsDefault: true,
              },
              defaultTeam: {
                teamId: 'team_001',
                name: '默认队伍',
                beastInstanceIds: ['beast_inst_001'],
                capacity: 1,
              },
            }),
          };
        }

        if (input === '/api/v1/beast/team/default') {
          return {
            json: async () => ({
              ok: true,
              traceId: 'trace-beast-setup-001',
              message: '默认队伍已更新',
              beast: {
                beastInstanceId: 'beast_inst_002',
                beastId: 'starter-beast-002',
                beastName: '烈焰狐',
                level: 3,
                role: 'damage',
                inDefaultTeam: true,
                availableForBattle: true,
                canSetAsDefault: false,
              },
              defaultTeam: {
                teamId: 'team_001',
                name: '默认队伍',
                beastInstanceIds: ['beast_inst_002'],
                capacity: 1,
              },
            }),
          };
        }

        if (input === '/api/v1/beast') {
          return {
            json: async () => ({
              ok: false,
              traceId: 'trace-beast-list-003',
              error: {
                code: 'BEAST_LIST_INVALID_SESSION',
                message: '幻兽列表刷新失败',
                retryable: true,
              },
            }),
          };
        }

        throw new Error(`Unexpected fetch input: ${input}`);
      }),
    );

    renderApp(['/beasts/beast_inst_002']);

    fireEvent.click(await screen.findByRole('button', { name: '设为出战' }));
    expect(await screen.findByText('默认队伍已更新')).toBeTruthy();

    fireEvent.click(screen.getByRole('link', { name: '返回幻兽列表' }));

    expect(await screen.findByRole('heading', { name: '幻兽列表' })).toBeTruthy();
    expect(await screen.findByText('幻兽列表刷新失败')).toBeTruthy();

    const starterCard = screen.getByText('初始幻兽').closest('article');
    const foxCard = screen.getByText('烈焰狐').closest('article');

    expect(
      (starterCard?.textContent ?? '').replace(/\s+/g, ''),
    ).toContain('初始幻兽等级1starter未进入默认队伍可上阵');
    expect((foxCard?.textContent ?? '').replace(/\s+/g, '')).toContain(
      '烈焰狐等级3damage默认队伍中可上阵',
    );
  });

  it('shows the same unavailable state when a deferred entry path is visited directly', () => {
    seedReadyState();

    renderApp(['/deferred/vip']);

    expect(screen.getByRole('heading', { name: 'VIP 暂未开放' })).toBeTruthy();
    expect(screen.getByText('未开放')).toBeTruthy();
    expect(screen.getByText('该入口属于后续阶段，不纳入一期可玩版。')).toBeTruthy();
  });

  it('renders the authoritative bag overview when the inventory route is visited', () => {
    seedReadyState();

    renderApp(['/inventory']);

    expect(screen.getByRole('heading', { name: '背包总览' })).toBeTruthy();
    expect(screen.getByText('金币')).toBeTruthy();
    expect(screen.getByText('1000')).toBeTruthy();
    expect(screen.getByText('回城符')).toBeTruthy();
    expect(screen.getByText('消耗品')).toBeTruthy();
    expect(screen.getByText('数量 x5')).toBeTruthy();
    expect(screen.getByText('已用 1 / 20')).toBeTruthy();
    expect(screen.getByText('剩余 19 格')).toBeTruthy();
    expect(screen.getByRole('button', { name: '领取单格奖励' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '尝试大包奖励' })).toBeTruthy();
  });
});
