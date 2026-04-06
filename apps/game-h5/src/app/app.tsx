import { useSyncExternalStore } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import {
  getAppBootstrapState,
  getActiveSession,
  getInventorySnapshot,
  getPlayerInitSnapshot,
  subscribeAppBootstrapState,
  subscribePlayerInitSnapshot,
} from '@workspace/state';
import { initializeAppSession } from '../bootstrap/init-app';
import { BeastDetailPage } from '../features/beast/beast-detail-page';
import { BeastListPage } from '../features/beast/beast-list-page';
import { InventoryPage } from '../features/inventory/inventory-page';
import styles from './app.module.css';
import type {
  BeastListEntry,
  InventorySnapshot,
  PlayerInitSnapshot,
} from '@workspace/types';

export interface AppProps {
  onRetry?: () => void | Promise<void>;
}

function defaultRetryHandler(): void {
  void initializeAppSession();
}

function renderProgressLabel(phase: string): string {
  switch (phase) {
    case 'restoring-session':
      return '阶段一：恢复账号会话';
    case 'initializing-player':
      return '阶段二：同步角色快照';
    default:
      return '准备进入主流程';
  }
}

interface FeatureEntry {
  key: string;
  title: string;
  path: string;
  description: string;
  actionLabel: string;
}

interface DeferredEntry {
  key: string;
  title: string;
  description: string;
}

const CORE_ENTRIES: FeatureEntry[] = [
  {
    key: 'inventory',
    title: '背包',
    path: '/inventory',
    description: '查看当前基础资源与后续可整理的物品入口。',
    actionLabel: '查看背包入口',
  },
  {
    key: 'beasts',
    title: '幻兽',
    path: '/beasts',
    description: '确认初始幻兽、默认队伍与后续养成方向。',
    actionLabel: '查看幻兽入口',
  },
  {
    key: 'battle',
    title: '战斗',
    path: '/battle',
    description: '准备进入一期基础挑战与后续奖励循环。',
    actionLabel: '查看战斗入口',
  },
];

const DEFERRED_ENTRIES: DeferredEntry[] = [
  {
    key: 'chat',
    title: '聊天',
    description: '实时聊天能力将在后续阶段补齐。',
  },
  {
    key: 'trade',
    title: '交易',
    description: '自由交易系统不纳入一期可玩版。',
  },
  {
    key: 'guild',
    title: '联盟',
    description: '联盟与协作玩法属于后续扩展内容。',
  },
  {
    key: 'vip',
    title: 'VIP',
    description: '商业化与特权入口后续统一接入。',
  },
  {
    key: 'shop',
    title: '商城',
    description: '商城与付费相关能力不进入一期骨架。',
  },
];

function getRecommendedEntry(snapshot: PlayerInitSnapshot): FeatureEntry {
  if (snapshot.beasts.length > 0) {
    return CORE_ENTRIES[1];
  }

  return CORE_ENTRIES[0];
}

function renderCoreEntrySummary(
  entryKey: string,
  snapshot: PlayerInitSnapshot,
): string {
  switch (entryKey) {
    case 'inventory':
      return `当前金币：${snapshot.resources.gold}，灵玉：${snapshot.resources.gem}，体力：${snapshot.resources.stamina}`;
    case 'beasts':
      return `当前默认队伍：${snapshot.defaultTeam.name}`;
    case 'battle':
      return `当前出战位：${snapshot.defaultTeam.beastInstanceIds.length} 个，建议先确认阵容后再挑战。`;
    default:
      return '一期入口准备中。';
  }
}

function buildInitialBeastEntries(
  snapshot: PlayerInitSnapshot,
): BeastListEntry[] {
  const defaultTeamSet = new Set(snapshot.defaultTeam.beastInstanceIds);

  return snapshot.beasts.map((beast) => ({
    beastInstanceId: beast.beastInstanceId,
    beastId: beast.beastId,
    beastName: beast.beastName,
    level: beast.level,
    role: beast.role,
    inDefaultTeam: defaultTeamSet.has(beast.beastInstanceId),
    availableForBattle: true,
  }));
}

function MainHubView({ snapshot }: { snapshot: PlayerInitSnapshot }) {
  const recommendedEntry = getRecommendedEntry(snapshot);
  const recommendedActionLabel =
    recommendedEntry.key === 'beasts' ? '前往幻兽' : recommendedEntry.actionLabel;

  return (
    <main className={styles.page}>
      <section className={`${styles.shell} ${styles.mainHubShell}`}>
        <header className={styles.heroBlock}>
          <div>
            <span className={styles.badge}>一期主界面</span>
            <h1 className={styles.title}>召唤之王主界面</h1>
            <p className={styles.subtitle}>
              <strong className={styles.heroName}>{snapshot.player.playerName}</strong>{' '}
              已完成开局。先确认当前阵容与资源，再进入下一轮成长。
            </p>
          </div>
          <div className={styles.heroMeta}>
            <span>等级 Lv.{snapshot.player.level}</span>
            <span>初始幻兽 {snapshot.beasts.length} 只</span>
            <span>默认队伍 {snapshot.defaultTeam.name}</span>
          </div>
        </header>

        <section className={styles.recommendPanel}>
          <div>
            <span className={styles.sectionTag}>推荐下一步</span>
            <h2 className={styles.sectionTitle}>先确认初始幻兽与当前阵容</h2>
            <p className={styles.sectionText}>
              你已经拿到初始幻兽和默认队伍。优先查看幻兽入口，确认开局阵容后，再准备进入战斗。
            </p>
          </div>
          <Link className={styles.primaryButtonLink} to={recommendedEntry.path}>
            {recommendedActionLabel}
          </Link>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>一期核心入口</span>
            <h2 className={styles.sectionTitle}>当前可玩的主循环入口</h2>
          </div>
          <div className={styles.entryGrid}>
            {CORE_ENTRIES.map((entry) => (
              <article className={styles.entryCard} key={entry.key}>
                <span className={styles.entryTitle}>{entry.title}</span>
                <p className={styles.entryDescription}>{entry.description}</p>
                <Link className={styles.entryLink} to={entry.path}>
                  {entry.actionLabel}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>后续开放</span>
            <h2 className={styles.sectionTitle}>延期系统入口已统一收口</h2>
          </div>
          <div className={styles.deferredGrid}>
            {DEFERRED_ENTRIES.map((entry) => (
              <article className={styles.deferredCard} key={entry.key}>
                <div>
                  <span className={styles.entryTitle}>{entry.title}</span>
                  <p className={styles.entryDescription}>{entry.description}</p>
                </div>
                <Link
                  className={styles.deferredLink}
                  to={`/deferred/${entry.key}`}
                >
                  未开放
                </Link>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function CoreEntryRoute({
  entry,
  snapshot,
}: {
  entry: FeatureEntry;
  snapshot: PlayerInitSnapshot;
}) {
  return (
    <main className={styles.page}>
      <section className={`${styles.shell} ${styles.routeShell}`}>
        <span className={styles.badge}>一期核心入口</span>
        <h1 className={styles.title}>{entry.title}入口</h1>
        <p className={styles.subtitle}>{entry.description}</p>
        <div className={styles.routeSummaryCard}>
          <p className={styles.routeSummaryLabel}>当前摘要</p>
          <p className={styles.routeSummaryText}>
            {renderCoreEntrySummary(entry.key, snapshot)}
          </p>
        </div>
        <p className={styles.tip}>
          正式业务页将在后续 Story 中接入，这里先保证主界面导航与一期入口边界成立。
        </p>
        <Link className={styles.entryLink} to="/">
          返回主界面
        </Link>
      </section>
    </main>
  );
}

function InventoryUnavailableRoute() {
  return (
    <main className={styles.page}>
      <section className={`${styles.shell} ${styles.routeShell}`}>
        <span className={styles.badge}>库存同步异常</span>
        <h1 className={styles.title}>背包数据暂不可用</h1>
        <p className={styles.subtitle}>
          当前没有可展示的权威背包快照。请返回主界面重试进入，避免使用本地旧数据继续推进。
        </p>
        <div className={styles.routeSummaryCard}>
          <p className={styles.routeSummaryLabel}>当前状态</p>
          <p className={styles.routeSummaryText}>
            背包页只接受服务端权威结果，不会回退到本地假库存。
          </p>
        </div>
        <Link className={styles.entryLink} to="/">
          返回主界面
        </Link>
      </section>
    </main>
  );
}

function DeferredEntryRoute() {
  const params = useParams<{ entryKey: string }>();
  const entry =
    DEFERRED_ENTRIES.find((item) => item.key === params.entryKey) ??
    DEFERRED_ENTRIES[0];

  return (
    <main className={styles.page}>
      <section className={`${styles.shell} ${styles.routeShell}`}>
        <span className={styles.badge}>未开放</span>
        <h1 className={styles.title}>{entry.title} 暂未开放</h1>
        <p className={styles.subtitle}>该入口属于后续阶段，不纳入一期可玩版。</p>
        <div className={styles.routeSummaryCard}>
          <p className={styles.routeSummaryLabel}>当前状态</p>
          <p className={styles.routeSummaryText}>{entry.description}</p>
        </div>
        <Link className={styles.deferredLink} to="/">
          返回主界面
        </Link>
      </section>
    </main>
  );
}

function ReadyApp({
  snapshot,
  inventorySnapshot,
  sessionToken,
}: {
  snapshot: PlayerInitSnapshot;
  inventorySnapshot: InventorySnapshot | null;
  sessionToken: string | null;
}) {
  return (
    <Routes>
      <Route element={<MainHubView snapshot={snapshot} />} path="/" />
      <Route
        element={
          inventorySnapshot ? (
            <InventoryPage
              snapshot={inventorySnapshot}
              sessionToken={sessionToken}
            />
          ) : (
            <InventoryUnavailableRoute />
          )
        }
        path="/inventory"
      />
      <Route
        element={
          <BeastListPage
            initialBeasts={buildInitialBeastEntries(snapshot)}
            sessionToken={sessionToken}
          />
        }
        path="/beasts"
      />
      <Route
        element={<BeastDetailPage sessionToken={sessionToken} />}
        path="/beasts/:beastInstanceId"
      />
      <Route
        element={<CoreEntryRoute entry={CORE_ENTRIES[2]} snapshot={snapshot} />}
        path="/battle"
      />
      <Route element={<DeferredEntryRoute />} path="/deferred/:entryKey" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

export function App({ onRetry = defaultRetryHandler }: AppProps) {
  const bootstrapState = useSyncExternalStore(
    subscribeAppBootstrapState,
    getAppBootstrapState,
  );
  const snapshot = useSyncExternalStore(
    subscribePlayerInitSnapshot,
    getPlayerInitSnapshot,
    getPlayerInitSnapshot,
  );
  const activeSession = getActiveSession();
  const inventorySnapshot = getInventorySnapshot();

  if (bootstrapState.phase === 'ready' && snapshot) {
    return (
      <ReadyApp
        snapshot={snapshot}
        inventorySnapshot={inventorySnapshot}
        sessionToken={activeSession?.sessionToken ?? null}
      />
    );
  }

  if (bootstrapState.phase === 'error' && bootstrapState.error) {
    return (
      <main className={styles.page}>
        <section className={styles.shell}>
          <span className={styles.badge}>入口链路异常</span>
          <h1 className={styles.title}>{bootstrapState.error.title}</h1>
          <p className={styles.subtitle}>{bootstrapState.error.message}</p>
          {bootstrapState.error.traceId ? (
            <p className={styles.trace}>
              追踪编号：{bootstrapState.error.traceId}
            </p>
          ) : null}
          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              onClick={() => {
                void onRetry();
              }}
              type="button"
            >
              重新尝试进入
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <span className={styles.badge}>共享 H5 入口</span>
        <h1 className={styles.title}>进入召唤之王</h1>
        <p className={styles.subtitle}>{bootstrapState.message}</p>

        <div className={styles.progressPanel}>
          <span className={styles.progressDot} aria-hidden="true" />
          <div>
            <p className={styles.progressLabel}>
              {renderProgressLabel(bootstrapState.phase)}
            </p>
            <p className={styles.progressHint}>
              共享 H5 正在等待服务端权威结果，请勿关闭页面。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
