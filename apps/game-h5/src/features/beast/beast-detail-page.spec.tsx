import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type {
  BeastDetailResponse,
  DefaultTeamSetupResponse,
} from '@workspace/types';
import { BeastDetailPage } from './beast-detail-page';

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

describe('BeastDetailPage', () => {
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
