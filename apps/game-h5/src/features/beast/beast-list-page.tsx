import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBeastList as requestBeastList } from '@workspace/data-access';
import type { BeastListEntry } from '@workspace/types';
import styles from '../../app/app.module.css';

interface BeastListPageProps {
  sessionToken?: string | null;
  initialBeasts?: BeastListEntry[];
  fetchBeastList?: typeof requestBeastList;
}

const EMPTY_BEASTS: BeastListEntry[] = [];

export function BeastListPage({
  sessionToken = null,
  initialBeasts,
  fetchBeastList = requestBeastList,
}: BeastListPageProps) {
  const seededBeasts = initialBeasts ?? EMPTY_BEASTS;
  const [beasts, setBeasts] = useState<BeastListEntry[]>(seededBeasts);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(seededBeasts.length === 0);

  useEffect(() => {
    setBeasts(seededBeasts);
    setErrorMessage(null);
    setIsLoading(seededBeasts.length === 0);
  }, [seededBeasts]);

  useEffect(() => {
    let isActive = true;

    if (!sessionToken) {
      if (seededBeasts.length === 0) {
        setErrorMessage('当前会话不可用，无法读取幻兽列表。');
        setIsLoading(false);
      }

      return () => {
        isActive = false;
      };
    }

    if (beasts.length === 0) {
      setIsLoading(true);
    }

    void fetchBeastList({ sessionToken })
      .then((response) => {
        if (!isActive) {
          return;
        }

        if (!response.ok) {
          setErrorMessage(response.error.message);
          setIsLoading(false);
          return;
        }

        setBeasts(response.beasts);
        setErrorMessage(null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setErrorMessage('幻兽列表请求未完成，请稍后重试。');
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [fetchBeastList, seededBeasts.length, sessionToken]);

  return (
    <main className={styles.page}>
      <section className={`${styles.shell} ${styles.routeShell}`}>
        <span className={styles.badge}>一期核心入口</span>
        <h1 className={styles.title}>幻兽列表</h1>
        <p className={styles.subtitle}>
          当前展示的是一期最小幻兽信息，后续可在此继续扩展培养、上阵和详情链路。
        </p>

        {errorMessage ? (
          <article className={`${styles.feedbackCard} ${styles.feedbackError}`}>
            <strong className={styles.feedbackTitle}>读取失败</strong>
            <p className={styles.feedbackMessage}>{errorMessage}</p>
          </article>
        ) : null}

        {isLoading && beasts.length === 0 ? (
          <div className={styles.routeSummaryCard}>
            <p className={styles.routeSummaryLabel}>同步中</p>
            <p className={styles.routeSummaryText}>
              正在读取服务端权威幻兽列表，请稍候。
            </p>
          </div>
        ) : null}

        {beasts.length > 0 ? (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>当前拥有</span>
              <h2 className={styles.sectionTitle}>可用于培养与上阵的幻兽</h2>
            </div>
            <div className={styles.inventoryItemList}>
              {beasts.map((beast) => (
                <article className={styles.inventoryItemCard} key={beast.beastInstanceId}>
                  <div className={styles.inventoryItemHeader}>
                    <div>
                      <span className={styles.entryTitle}>{beast.beastName}</span>
                      <p className={styles.entryDescription}>
                        等级 {beast.level}
                      </p>
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
                  <p className={styles.tip}>
                    一期已接入正式详情入口，可继续确认当前队伍关系并切换默认出战幻兽。
                  </p>
                  <Link
                    className={styles.entryLink}
                    to={`/beasts/${beast.beastInstanceId}`}
                  >
                    查看详情
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <Link className={styles.entryLink} to="/">
          返回主界面
        </Link>
      </section>
    </main>
  );
}
