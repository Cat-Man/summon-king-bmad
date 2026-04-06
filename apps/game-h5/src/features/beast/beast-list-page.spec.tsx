import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BeastListResponse } from '@workspace/types';
import { BeastListPage } from './beast-list-page';

const ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

describe('BeastListPage', () => {
  it('requests and renders the authoritative beast list', async () => {
    const fetchBeastList = vi.fn(async () => ({
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
    } satisfies BeastListResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <BeastListPage
          sessionToken="sess_001"
          fetchBeastList={fetchBeastList}
        />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchBeastList).toHaveBeenCalledWith({
        sessionToken: 'sess_001',
      });
    });

    expect(await screen.findByRole('heading', { name: '幻兽列表' })).toBeTruthy();
    expect(await screen.findByText('初始幻兽')).toBeTruthy();
    expect(
      await screen.findByText(
        (content) => content.replace(/\s+/g, ' ').trim() === '等级 1',
      ),
    ).toBeTruthy();
    expect(screen.getByText('starter')).toBeTruthy();
    expect(screen.getByText('默认队伍中')).toBeTruthy();
    const detailLink = (await screen.findByRole('link', {
      name: '查看详情',
    })) as unknown as { getAttribute(name: string): string | null };
    expect(detailLink.getAttribute('href')).toBe('/beasts/beast_inst_001');
  });

  it('shows an understandable failure state when the beast list request fails', async () => {
    const fetchBeastList = vi.fn(async () => ({
      ok: false,
      traceId: 'trace-beast-002',
      error: {
        code: 'BEAST_LIST_INVALID_SESSION',
        message: '幻兽列表会话无效',
        retryable: false,
      },
    } satisfies BeastListResponse));

    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <BeastListPage
          sessionToken="sess_missing"
          fetchBeastList={fetchBeastList}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByText('幻兽列表会话无效')).toBeTruthy();
  });
});
