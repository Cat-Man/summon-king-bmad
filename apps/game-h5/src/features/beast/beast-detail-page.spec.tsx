import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type {
  BeastGrowthResponse,
  BeastDetailResponse,
  DefaultTeamSetupResponse,
} from '@workspace/types';
import {
  clearInventorySnapshot,
  getInventorySnapshot,
  clearPlayerInitSnapshot,
  getPlayerInitSnapshot,
  setInventorySnapshot,
  setPlayerInitSnapshot,
} from '@workspace/state';
import { BeastDetailPage } from './beast-detail-page';

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

describe('BeastDetailPage', () => {
  afterEach(() => {
    act(() => {
      clearInventorySnapshot();
      clearPlayerInitSnapshot();
    });
  });

  it('requests and renders the authoritative beast detail', async () => {
    const fetchBeastDetail = vi.fn(async () => ({
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
    } satisfies BeastDetailResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <BeastDetailPage
          beastInstanceId="beast_inst_001"
          sessionToken="sess_001"
          fetchBeastDetail={fetchBeastDetail}
        />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchBeastDetail).toHaveBeenCalledWith({
        sessionToken: 'sess_001',
        beastInstanceId: 'beast_inst_001',
      });
    });

    expect(await screen.findByRole('heading', { name: '幻兽详情' })).toBeTruthy();
    expect(screen.getAllByText('初始幻兽').length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        (content) => content.replace(/\s+/g, ' ').trim() === '等级 1',
      ),
    ).toBeTruthy();
    expect(screen.getByText('starter')).toBeTruthy();
    expect(screen.getByText('默认队伍中')).toBeTruthy();
    expect(screen.getByText('默认队伍摘要')).toBeTruthy();
    expect(screen.getByText('默认队伍 · 当前 1/1')).toBeTruthy();
  });

  it('submits default team setup and refreshes the rendered team state', async () => {
    const fetchBeastDetail = vi.fn(async () => ({
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
    } satisfies BeastDetailResponse));
    const setupDefaultTeam = vi.fn(async () => ({
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
    } satisfies DefaultTeamSetupResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <BeastDetailPage
          beastInstanceId="beast_inst_002"
          sessionToken="sess_001"
          fetchBeastDetail={fetchBeastDetail}
          setupDefaultTeam={setupDefaultTeam}
        />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: '设为出战' }));

    await waitFor(() => {
      expect(setupDefaultTeam).toHaveBeenCalledWith({
        sessionToken: 'sess_001',
        beastInstanceIds: ['beast_inst_002'],
      });
    });

    expect(await screen.findByText('默认队伍已更新')).toBeTruthy();
    expect(screen.getByText('默认队伍中')).toBeTruthy();
    expect(screen.getByText('已在队伍中')).toBeTruthy();
    expect(screen.getByText('默认队伍 · 当前 1/1')).toBeTruthy();
  });

  it('syncs the shared player snapshot after default team setup succeeds', async () => {
    act(() => {
      setPlayerInitSnapshot({
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
    });

    const fetchBeastDetail = vi.fn(async () => ({
      ok: true,
      traceId: 'trace-beast-detail-004',
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
    } satisfies BeastDetailResponse));
    const setupDefaultTeam = vi.fn(async () => ({
      ok: true,
      traceId: 'trace-beast-setup-003',
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
    } satisfies DefaultTeamSetupResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <BeastDetailPage
          beastInstanceId="beast_inst_002"
          sessionToken="sess_001"
          fetchBeastDetail={fetchBeastDetail}
          setupDefaultTeam={setupDefaultTeam}
        />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: '设为出战' }));

    expect(await screen.findByText('默认队伍已更新')).toBeTruthy();
    expect(getPlayerInitSnapshot()?.defaultTeam.beastInstanceIds).toEqual([
      'beast_inst_002',
    ]);
  });

  it('submits a basic growth action and syncs shared beast plus resource snapshots after success', async () => {
    act(() => {
      setPlayerInitSnapshot({
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
      });
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
    });

    const fetchBeastDetail = vi.fn(async () => ({
      ok: true,
      traceId: 'trace-beast-detail-005',
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
    } satisfies BeastDetailResponse));
    const growBeast = vi.fn(async () => ({
      ok: true,
      traceId: 'trace-growth-001',
      actionId: 'basic-level-up',
      message: '培养成功，初始幻兽提升到 Lv.2。',
      beast: {
        beastInstanceId: 'beast_inst_001',
        beastId: 'starter-beast-001',
        beastName: '初始幻兽',
        level: 2,
        role: 'starter',
        inDefaultTeam: true,
        availableForBattle: true,
        canSetAsDefault: false,
      },
      resources: {
        gold: 800,
        gem: 100,
        stamina: 20,
      },
    } satisfies BeastGrowthResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <BeastDetailPage
          beastInstanceId="beast_inst_001"
          sessionToken="sess_001"
          fetchBeastDetail={fetchBeastDetail}
          growBeast={growBeast}
        />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: '培养 1 次' }));

    await waitFor(() => {
      expect(growBeast).toHaveBeenCalledWith({
        sessionToken: 'sess_001',
        beastInstanceId: 'beast_inst_001',
        actionId: 'basic-level-up',
      });
    });

    expect(await screen.findByText('培养成功，初始幻兽提升到 Lv.2。')).toBeTruthy();
    expect(getPlayerInitSnapshot()?.resources.gold).toBe(800);
    expect(getPlayerInitSnapshot()?.beasts[0]?.level).toBe(2);
    expect(getInventorySnapshot()?.resources.gold).toBe(800);
  });

  it('renders the server error message when default team setup fails', async () => {
    const fetchBeastDetail = vi.fn(async () => ({
      ok: true,
      traceId: 'trace-beast-detail-003',
      beast: {
        beastInstanceId: 'beast_inst_003',
        beastId: 'starter-beast-003',
        beastName: '玄冰狼',
        level: 5,
        role: 'control',
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
    } satisfies BeastDetailResponse));
    const setupDefaultTeam = vi.fn(async () => ({
      ok: false,
      traceId: 'trace-beast-setup-002',
      error: {
        code: 'DEFAULT_TEAM_SETUP_TEAM_CAPACITY_EXCEEDED',
        message: '默认队伍容量已满',
        retryable: false,
      },
    } satisfies DefaultTeamSetupResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <BeastDetailPage
          beastInstanceId="beast_inst_003"
          sessionToken="sess_001"
          fetchBeastDetail={fetchBeastDetail}
          setupDefaultTeam={setupDefaultTeam}
        />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: '设为出战' }));

    expect(await screen.findByText('默认队伍容量已满')).toBeTruthy();
  });
});
