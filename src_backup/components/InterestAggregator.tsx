import React from 'react';
import '../styles/InterestAggregator.css';
import type { TopicRecommendation, Article } from '../services/interestsApi';

interface Props {
  topic: string;
  recommendation: TopicRecommendation | null;
  loading: boolean;
  onRefresh: (force: boolean) => void;
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      className="article-card"
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="article-title">{article.title}</div>
      <div className="article-source">{article.source}</div>
      <div className="article-snippet">{article.snippet}</div>
    </a>
  );
}

const InterestAggregator: React.FC<Props> = ({ topic, recommendation, loading, onRefresh }) => {
  return (
    <div className="interest-aggregator">
      <div className="aggregator-header">
        <h3 className="aggregator-topic">{topic}</h3>
        <div className="aggregator-meta">
          {recommendation && (
            <span className={`cache-badge ${recommendation.cached ? 'cached' : 'fresh'}`}>
              {recommendation.cached ? '缓存' : '最新'}
            </span>
          )}
          <button
            className="btn-topic-refresh"
            onClick={() => onRefresh(false)}
            disabled={loading}
          >
            {loading ? '加载中…' : '刷新'}
          </button>
        </div>
      </div>

      {!recommendation && !loading && (
        <div className="aggregator-empty">
          <p>点击「刷新推荐」加载文章</p>
        </div>
      )}

      {loading && (
        <div className="aggregator-loading">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
      )}

      {recommendation && !loading && (
        <>
          {recommendation.aiInsight && (
            <div className="ai-insight">
              <span className="ai-insight-icon">✦</span>
              <p>{recommendation.aiInsight}</p>
            </div>
          )}
          <div className="articles-grid">
            {recommendation.articles.map((a, i) => (
              <ArticleCard key={i} article={a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default InterestAggregator;
