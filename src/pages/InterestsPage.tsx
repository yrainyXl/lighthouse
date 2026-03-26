import React, { useState, useEffect, useCallback } from 'react';
import InterestAggregator from '../components/InterestAggregator';
import '../styles/InterestsPage.css';
import {
  fetchTopics,
  addTopic,
  deleteTopic,
  fetchRecommendation,
  type Topic,
  type TopicRecommendation,
} from '../services/interestsApi';

const InterestsPage: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, TopicRecommendation>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState('');
  const [adding, setAdding] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  const loadTopics = useCallback(async () => {
    try {
      const data = await fetchTopics();
      setTopics(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || '加载话题失败');
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const loadRecommendation = useCallback(
    async (topicName: string, forceRefresh = false) => {
      setLoading((prev) => ({ ...prev, [topicName]: true }));
      try {
        const data = await fetchRecommendation(topicName, forceRefresh);
        setRecommendations((prev) => ({ ...prev, [topicName]: data }));
      } catch (e: any) {
        setError(e?.response?.data?.error || e?.message || `加载「${topicName}」推荐失败`);
      } finally {
        setLoading((prev) => ({ ...prev, [topicName]: false }));
      }
    },
    [],
  );

  const handleRefreshAll = useCallback(
    async (force = false) => {
      if (topics.length === 0) return;
      setGlobalLoading(true);
      await Promise.allSettled(topics.map((t) => loadRecommendation(t.name, force)));
      setGlobalLoading(false);
    },
    [topics, loadRecommendation],
  );

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTopic.trim();
    if (!name) return;
    setAdding(true);
    try {
      await addTopic(name);
      setNewTopic('');
      await loadTopics();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || '添加话题失败');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTopic = async (id: number, name: string) => {
    try {
      await deleteTopic(id);
      setTopics((prev) => prev.filter((t) => t.id !== id));
      setRecommendations((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || '删除话题失败');
    }
  };

  return (
    <div className="interests-page">
      <div className="interests-header">
        <div>
          <h2>文章推荐</h2>
          <p className="interests-subtitle">基于兴趣话题的 AI 辅助资讯聚合</p>
        </div>
        <div className="interests-actions">
          <button
            className="btn-refresh"
            onClick={() => handleRefreshAll(false)}
            disabled={globalLoading || topics.length === 0}
          >
            {globalLoading ? '加载中…' : '刷新推荐'}
          </button>
          <button
            className="btn-force-refresh"
            onClick={() => handleRefreshAll(true)}
            disabled={globalLoading || topics.length === 0}
          >
            强制刷新
          </button>
        </div>
      </div>

      {error && (
        <div className="interests-error" onClick={() => setError(null)}>
          {error} <span className="error-close">✕</span>
        </div>
      )}

      <div className="topic-manager">
        <form className="topic-add-form" onSubmit={handleAddTopic}>
          <input
            className="topic-input"
            type="text"
            placeholder="输入新话题，如：AI、前端开发…"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            disabled={adding}
          />
          <button className="btn-add-topic" type="submit" disabled={adding || !newTopic.trim()}>
            {adding ? '添加中…' : '+ 添加话题'}
          </button>
        </form>
        <div className="topic-tags">
          {topics.map((t) => (
            <span key={t.id} className="topic-tag">
              {t.name}
              <button
                className="topic-tag-del"
                onClick={() => handleDeleteTopic(t.id, t.name)}
                aria-label={`删除话题 ${t.name}`}
              >
                ✕
              </button>
            </span>
          ))}
          {topics.length === 0 && (
            <span className="topic-empty">还没有话题，添加一个开始吧</span>
          )}
        </div>
      </div>

      <div className="recommendations-list">
        {topics.map((t) => (
          <InterestAggregator
            key={t.id}
            topic={t.name}
            recommendation={recommendations[t.name] ?? null}
            loading={!!loading[t.name]}
            onRefresh={(force) => loadRecommendation(t.name, force)}
          />
        ))}
      </div>
    </div>
  );
};

export default InterestsPage;
