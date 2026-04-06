import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  fetchBeastDetail as requestBeastDetail,
  growBeast as requestGrowBeast,
  setupDefaultTeam as requestSetupDefaultTeam,
} from '@workspace/data-access';
import {
  getInventorySnapshot,
  getPlayerInitSnapshot,
  setInventorySnapshot,
  setPlayerInitSnapshot,
} from '@workspace/state';
import type {
  BeastDetailEntry,
  BeastGrowthResponse,
  BeastTeamSummary,
  DefaultTeamSnapshot,
} from '@workspace/types';
import styles from '../../app/app.module.css';

interface BeastDetailPageProps {
  beastInstanceId?: string;
  sessionToken?: string | null;
  fetchBeastDetail?: typeof requestBeastDetail;
  growBeast?: typeof requestGrowBeast;
  setupDefaultTeam?: typeof requestSetupDefaultTeam;
}

interface FeedbackState {
  tone: 'success' | 'blocked' | 'error';
  title: string;
  message: string;
}

function resolveFeedbackClassName(tone: FeedbackState['tone']): string {
  switch (tone) {
    case 'success':
      return styles.feedbackSuccess;
    case 'blocked':
      return styles.feedbackBlocked;
    default:
      return styles.feedbackError;
  }
}

function toDefaultTeamSnapshot(
  team: BeastTeamSummary,
): DefaultTeamSnapshot {
  return {
    teamId: team.teamId,
    name: team.name,
    beastInstanceIds: [...team.beastInstanceIds],
  };
}

function syncSharedPlayerSnapshot(defaultTeam: BeastTeamSummary): void {
  const snapshot = getPlayerInitSnapshot();

  if (!snapshot) {
    return;
  }

  setPlayerInitSnapshot({
    ...snapshot,
    defaultTeam: toDefaultTeamSnapshot(defaultTeam),
  });
}

function syncSharedPlayerSnapshotAfterGrowth(
  response: Extract<BeastGrowthResponse, { ok: true }>,
): void {
  const snapshot = getPlayerInitSnapshot();

  if (!snapshot) {
    return;
  }

  setPlayerInitSnapshot({
    ...snapshot,
    resources: {
      ...response.resources,
    },
    beasts: snapshot.beasts.map((item) =>
      item.beastInstanceId === response.beast.beastInstanceId
        ? {
            beastInstanceId: response.beast.beastInstanceId,
            beastId: response.beast.beastId,
            beastName: response.beast.beastName,
            level: response.beast.level,
            role: response.beast.role,
          }
        : item,
    ),
  });
}

function syncSharedInventorySnapshotAfterGrowth(
  response: Extract<BeastGrowthResponse, { ok: true }>,
): void {
  const snapshot = getInventorySnapshot();

  if (!snapshot) {
    return;
  }

  setInventorySnapshot({
    ...snapshot,
    resources: {
      ...response.resources,
    },
  });
}

export function BeastDetailPage({
  beastInstanceId,
  sessionToken = null,
  fetchBeastDetail = requestBeastDetail,
  growBeast = requestGrowBeast,
  setupDefaultTeam = requestSetupDefaultTeam,
}: BeastDetailPageProps) {
  const params = useParams<{ beastInstanceId: string }>();
  const activeBeastInstanceId = beastInstanceId ?? params.beastInstanceId;
  const [beast, setBeast] = useState<BeastDetailEntry | null>(null);
  const [defaultTeam, setDefaultTeam] = useState<BeastTeamSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    setFeedback(null);

    if (!activeBeastInstanceId) {
      setBeast(null);
      setDefaultTeam(null);
      setErrorMessage('未指定目标幻兽，无法读取详情。');
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    if (!sessionToken) {
      setBeast(null);
      setDefaultTeam(null);
      setErrorMessage('当前会话不可用，无法读取幻兽详情。');
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoading(true);

    void fetchBeastDetail({
      sessionToken,
      beastInstanceId: activeBeastInstanceId,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }

        if (!response.ok) {
          setBeast(null);
          setDefaultTeam(null);
          setErrorMessage(response.error.message);
          setIsLoading(false);
          return;
        }

        setBeast(response.beast);
        setDefaultTeam(response.defaultTeam);
        setErrorMessage(null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setBeast(null);
        setDefaultTeam(null);
        setErrorMessage('幻兽详情请求未完成，请稍后重试。');
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [activeBeastInstanceId, fetchBeastDetail, sessionToken]);

  async function handleSetupDefaultTeam(): Promise<void> {
    if (!activeBeastInstanceId || !sessionToken) {
      setFeedback({
        tone: 'error',
        title: '操作失败',
        message: '当前会话不可用，无法切换出战幻兽。',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await setupDefaultTeam({
        sessionToken,
        beastInstanceIds: [activeBeastInstanceId],
      });

      if (response.ok) {
        setBeast(response.beast);
        setDefaultTeam(response.defaultTeam);
        syncSharedPlayerSnapshot(response.defaultTeam);
        setErrorMessage(null);
        setFeedback({
          tone: 'success',
          title: '出战已更新',
          message: response.message,
        });
        return;
      }

      const tone =
        response.error.code === 'DEFAULT_TEAM_SETUP_INVALID_SESSION' ||
        response.error.code === 'DEFAULT_TEAM_SETUP_STATE_MISSING'
          ? 'error'
          : 'blocked';

      setFeedback({
        tone,
        title: '出战切换失败',
        message: response.error.message,
      });
    } catch {
      setFeedback({
        tone: 'error',
        title: '出战切换失败',
        message: '队伍配置请求未完成，请稍后重试。',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGrowth(): Promise<void> {
    if (!activeBeastInstanceId || !sessionToken) {
      setFeedback({
        tone: 'error',
        title: '操作失败',
        message: '当前会话不可用，无法执行幻兽培养。',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await growBeast({
        sessionToken,
        beastInstanceId: activeBeastInstanceId,
        actionId: 'basic-level-up',
      });

      if (response.ok) {
        setBeast(response.beast);
        syncSharedPlayerSnapshotAfterGrowth(response);
        syncSharedInventorySnapshotAfterGrowth(response);
        setErrorMessage(null);
        setFeedback({
          tone: 'success',
          title: '培养成功',
          message: response.message,
        });
        return;
      }

      const tone =
        response.error.code === 'BEAST_GROWTH_INVALID_SESSION' ||
        response.error.code === 'BEAST_GROWTH_STATE_MISSING'
          ? 'error'
          : 'blocked';

      setFeedback({
        tone,
        title: '培养失败',
        message: response.error.message,
      });
    } catch {
      setFeedback({
        tone: 'error',
        title: '培养失败',
        message: '幻兽培养请求未完成，请稍后重试。',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={`${styles.shell} ${styles.routeShell}`}>
        <span className={styles.badge}>一期核心入口</span>
        <h1 className={styles.title}>幻兽详情</h1>
        <p className={styles.subtitle}>
          详情页只展示一期基础战斗准备信息，并通过服务端权威写入切换默认出战幻兽。
        </p>

        {errorMessage ? (
          <article className={`${styles.feedbackCard} ${styles.feedbackError}`}>
            <strong className={styles.feedbackTitle}>读取失败</strong>
            <p className={styles.feedbackMessage}>{errorMessage}</p>
          </article>
        ) : null}

        {feedback ? (
          <article
            className={`${styles.feedbackCard} ${resolveFeedbackClassName(feedback.tone)}`}
          >
            <strong className={styles.feedbackTitle}>{feedback.title}</strong>
            <p className={styles.feedbackMessage}>{feedback.message}</p>
          </article>
        ) : null}

        {isLoading && !beast ? (
          <div className={styles.routeSummaryCard}>
            <p className={styles.routeSummaryLabel}>同步中</p>
            <p className={styles.routeSummaryText}>
              正在读取服务端权威幻兽详情，请稍候。
            </p>
          </div>
        ) : null}

        {beast && defaultTeam ? (
          <>
            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTag}>当前目标</span>
                <h2 className={styles.sectionTitle}>{beast.beastName}</h2>
              </div>
              <div className={styles.inventoryItemList}>
                <article className={styles.inventoryItemCard}>
                  <div className={styles.inventoryItemHeader}>
                    <div>
                      <span className={styles.entryTitle}>{beast.beastName}</span>
                      <p className={styles.entryDescription}>等级 {beast.level}</p>
                    </div>
                    <div className={styles.inventoryItemMeta}>
                      <span className={styles.inventoryTypeTag}>{beast.role}</span>
                      <span className={styles.inventoryTag}>
                        {beast.inDefaultTeam ? '默认队伍中' : '未进入默认队伍'}
                      </span>
                      <span className={styles.inventoryTag}>
                        {beast.availableForBattle ? '可上阵' : '暂不可上阵'}
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTag}>队伍状态</span>
                <h2 className={styles.sectionTitle}>默认队伍摘要</h2>
              </div>
              <div className={styles.routeSummaryCard}>
                <p className={styles.routeSummaryLabel}>
                  {defaultTeam.name} · 当前 {defaultTeam.beastInstanceIds.length}/
                  {defaultTeam.capacity}
                </p>
                <p className={styles.routeSummaryText}>
                  当前队伍实例：{defaultTeam.beastInstanceIds.join('、')}
                </p>
              </div>
              <div className={styles.actions}>
                {beast.canSetAsDefault ? (
                  <button
                    className={styles.primaryButton}
                    disabled={isSubmitting}
                    onClick={() => {
                      void handleSetupDefaultTeam();
                    }}
                    type="button"
                  >
                    {isSubmitting ? '提交中...' : '设为出战'}
                  </button>
                ) : (
                  <button
                    className={styles.secondaryButton}
                    disabled
                    type="button"
                  >
                    已在队伍中
                  </button>
                )}
                <button
                  className={styles.primaryButton}
                  disabled={isSubmitting}
                  onClick={() => {
                    void handleGrowth();
                  }}
                  type="button"
                >
                  {isSubmitting ? '提交中...' : '培养 1 次'}
                </button>
              </div>
            </section>
          </>
        ) : null}

        <Link className={styles.entryLink} to="/beasts">
          返回幻兽列表
        </Link>
      </section>
    </main>
  );
}
