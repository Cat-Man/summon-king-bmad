import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  claimReward as requestRewardClaim,
  consumeResource as requestConsumeResource,
} from '@workspace/data-access';
import { setInventorySnapshot } from '@workspace/state';
import type {
  InventorySnapshot,
  ResourceConsumeActionId,
  RewardBundleId,
} from '@workspace/types';
import styles from '../../app/app.module.css';

interface InventoryPageProps {
  snapshot: InventorySnapshot;
  sessionToken?: string | null;
  claimReward?: typeof requestRewardClaim;
  consumeResource?: typeof requestConsumeResource;
  persistInventory?: (snapshot: InventorySnapshot) => InventorySnapshot;
}

interface RewardFeedbackState {
  tone: 'success' | 'blocked' | 'error';
  title: string;
  message: string;
  guidance?: string;
}

const SINGLE_REWARD_BUNDLE_ID: RewardBundleId = 'inventory-demo-single-reward';
const OVERFLOW_REWARD_BUNDLE_ID: RewardBundleId = 'inventory-demo-overflow-reward';
const USE_RETURN_SCROLL_ACTION_ID: ResourceConsumeActionId = 'use-return-scroll';
const DEDUCT_GROWTH_GOLD_ACTION_ID: ResourceConsumeActionId = 'deduct-growth-gold';

function formatItemTypeLabel(itemType: string): string {
  switch (itemType) {
    case 'consumable':
      return '消耗品';
    default:
      return '未分类';
  }
}

function buildItemHint(itemType: string, stackable: boolean): string {
  if (itemType === 'consumable') {
    return stackable
      ? '一期基础消耗品，后续故事会接入正式使用动作。'
      : '一期基础消耗品，当前仅支持查看状态。';
  }

  return '一期物品展示已接入，后续可继续扩展类型说明。';
}

export function InventoryPage({
  snapshot,
  sessionToken = null,
  claimReward = requestRewardClaim,
  consumeResource = requestConsumeResource,
  persistInventory = setInventorySnapshot,
}: InventoryPageProps) {
  const [activeSnapshot, setActiveSnapshot] = useState(snapshot);
  const [feedback, setFeedback] = useState<RewardFeedbackState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setActiveSnapshot(snapshot);
  }, [snapshot]);

  async function handleRewardClaim(rewardBundleId: RewardBundleId): Promise<void> {
    if (!sessionToken) {
      setFeedback({
        tone: 'error',
        title: '领取失败',
        message: '当前会话不可用，无法发起奖励校验。',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await claimReward({
        sessionToken,
        rewardBundleId,
      });

      if (response.ok) {
        persistInventory(response.snapshot);
        setActiveSnapshot(response.snapshot);
        setFeedback({
          tone: 'success',
          title: '领取成功',
          message: `${response.grantedItems
            .map((item) => item.itemName)
            .join('、')} 已进入背包，可继续查看最新容量与物品。`,
          guidance: undefined,
        });
        return;
      }

      if (
        response.error.code === 'REWARD_CLAIM_CAPACITY_BLOCKED' &&
        response.error.details
      ) {
        setFeedback({
          tone: 'blocked',
          title: '背包容量不足',
          message: `当前剩余 ${response.error.details.freeSlots} 格，还差 ${response.error.details.missingSlots} 格。${response.error.details.guidance}`,
          guidance: undefined,
        });
        return;
      }

      setFeedback({
        tone: 'error',
        title: '领取失败',
        message: response.error.message,
        guidance: undefined,
      });
    } catch {
      setFeedback({
        tone: 'error',
        title: '领取失败',
        message: '奖励请求未完成，请稍后重试。',
        guidance: undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConsumeAction(
    actionId: ResourceConsumeActionId,
  ): Promise<void> {
    if (!sessionToken) {
      setFeedback({
        tone: 'error',
        title: '操作失败',
        message: '当前会话不可用，无法发起消耗动作。',
        guidance: undefined,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await consumeResource({
        sessionToken,
        actionId,
      });

      if (response.ok) {
        persistInventory(response.snapshot);
        setActiveSnapshot(response.snapshot);
        setFeedback({
          tone: 'success',
          title: '操作成功',
          message: response.message,
          guidance: undefined,
        });
        return;
      }

      setFeedback({
        tone: 'blocked',
        title: '操作受阻',
        message: response.error.message,
        guidance: response.error.details?.guidance,
      });
    } catch {
      setFeedback({
        tone: 'error',
        title: '操作失败',
        message: '消耗请求未完成，请稍后重试。',
        guidance: undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={`${styles.shell} ${styles.mainHubShell}`}>
        <span className={styles.badge}>一期核心入口</span>
        <h1 className={styles.title}>背包总览</h1>
        <p className={styles.subtitle}>
          当前内容来自服务端权威库存快照，用于帮助你理解现有资源、物品和容量状态。
        </p>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>基础资源</span>
            <h2 className={styles.sectionTitle}>当前成长资源</h2>
          </div>
          <div className={styles.summaryGrid}>
            <article className={styles.summaryCard}>
              <span className={styles.summaryLabel}>金币</span>
              <span className={styles.summaryValue}>{activeSnapshot.resources.gold}</span>
              <span className={styles.summaryHint}>基础流通货币</span>
            </article>
            <article className={styles.summaryCard}>
              <span className={styles.summaryLabel}>灵玉</span>
              <span className={styles.summaryValue}>{activeSnapshot.resources.gem}</span>
              <span className={styles.summaryHint}>一期高价值资源</span>
            </article>
            <article className={styles.summaryCard}>
              <span className={styles.summaryLabel}>体力</span>
              <span className={styles.summaryValue}>
                {activeSnapshot.resources.stamina}
              </span>
              <span className={styles.summaryHint}>基础挑战与推进消耗</span>
            </article>
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>容量状态</span>
            <h2 className={styles.sectionTitle}>当前背包空间</h2>
          </div>
          <div className={styles.inventoryMetaGrid}>
            <article className={styles.inventoryMetaCard}>
              <span className={styles.summaryLabel}>占用摘要</span>
              <span className={styles.inventoryMetaValue}>
                已用 {activeSnapshot.bag.capacity.usedSlots} /{' '}
                {activeSnapshot.bag.capacity.totalSlots}
              </span>
              <span className={styles.inventoryMetaHint}>
                剩余 {activeSnapshot.bag.capacity.freeSlots} 格
              </span>
            </article>
            <article className={styles.inventoryMetaCard}>
              <span className={styles.summaryLabel}>当前判断</span>
              <span className={styles.inventoryMetaValue}>
                {activeSnapshot.bag.capacity.freeSlots > 0
                  ? '可继续获取物品'
                  : '背包空间紧张'}
              </span>
              <span className={styles.inventoryMetaHint}>
                服务端奖励校验已接入，容量不足会明确阻断。
              </span>
            </article>
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>奖励校验</span>
            <h2 className={styles.sectionTitle}>一期奖励发放切片</h2>
          </div>
          <p className={styles.sectionText}>
            当前通过受控奖励包验证“服务端先校验容量，再决定是否发放”。后续战斗奖励会接入同一条权威链路。
          </p>
          {feedback ? (
            <article
              className={`${styles.feedbackCard} ${
                feedback.tone === 'success'
                  ? styles.feedbackSuccess
                  : feedback.tone === 'blocked'
                    ? styles.feedbackBlocked
                    : styles.feedbackError
              }`}
            >
              <span className={styles.feedbackTitle}>{feedback.title}</span>
              <p className={styles.feedbackMessage}>{feedback.message}</p>
              {feedback.guidance ? (
                <p className={styles.feedbackMessage}>{feedback.guidance}</p>
              ) : null}
            </article>
          ) : null}
          <div className={styles.actionRow}>
            <button
              className={styles.primaryButton}
              disabled={isSubmitting}
              onClick={() => {
                void handleRewardClaim(SINGLE_REWARD_BUNDLE_ID);
              }}
              type="button"
            >
              领取单格奖励
            </button>
            <button
              className={styles.secondaryButton}
              disabled={isSubmitting}
              onClick={() => {
                void handleRewardClaim(OVERFLOW_REWARD_BUNDLE_ID);
              }}
              type="button"
            >
              尝试大包奖励
            </button>
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>基础消耗</span>
            <h2 className={styles.sectionTitle}>一期基础消耗切片</h2>
          </div>
          <p className={styles.sectionText}>
            当前只开放受控的最小消耗动作，用于验证“服务端权威扣减后回写最新 snapshot”。
          </p>
          <div className={styles.actionRow}>
            <button
              className={styles.primaryButton}
              disabled={isSubmitting}
              onClick={() => {
                void handleConsumeAction(USE_RETURN_SCROLL_ACTION_ID);
              }}
              type="button"
            >
              使用 1 张回城符
            </button>
            <button
              className={styles.secondaryButton}
              disabled={isSubmitting}
              onClick={() => {
                void handleConsumeAction(DEDUCT_GROWTH_GOLD_ACTION_ID);
              }}
              type="button"
            >
              扣除 200 金币
            </button>
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>背包物品</span>
            <h2 className={styles.sectionTitle}>当前可用物品</h2>
          </div>
          {activeSnapshot.bag.items.length === 0 ? (
            <article className={styles.inventoryEmptyCard}>
              <span className={styles.entryTitle}>当前背包为空</span>
              <p className={styles.entryDescription}>
                可以继续挑战、领取奖励或准备后续成长。
              </p>
            </article>
          ) : (
            <div className={styles.inventoryItemList}>
              {activeSnapshot.bag.items.map((item) => (
                <article className={styles.inventoryItemCard} key={item.slotId}>
                  <div className={styles.inventoryItemHeader}>
                    <div>
                      <span className={styles.entryTitle}>{item.itemName}</span>
                      <p className={styles.entryDescription}>
                        {buildItemHint(item.itemType, item.stackable)}
                      </p>
                    </div>
                    <div className={styles.inventoryItemMeta}>
                      <span className={styles.inventoryTypeTag}>
                        {formatItemTypeLabel(item.itemType)}
                      </span>
                      <span className={styles.inventoryTag}>数量 x{item.quantity}</span>
                      {item.stackable ? (
                        <span className={styles.inventoryTag}>可叠加</span>
                      ) : (
                        <span className={styles.inventoryTag}>独占格位</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className={styles.actions}>
          <Link className={styles.entryLink} to="/">
            返回主界面
          </Link>
        </div>
      </section>
    </main>
  );
}

export default InventoryPage;
