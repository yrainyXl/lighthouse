import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home: React.FC = () => {
  return (
    <div className="home">
      <div className="hero-section">
        <h1>欢迎来到 LithtHouse</h1>
        <p>个人数据管理与信息聚合平台</p>
      </div>
      
      <div className="card-grid">
        <Link to="/notion" className="card-link">
          <div className="card notion-card">
            <div className="card-icon">📊</div>
            <h3>Notion 账单分析</h3>
            <p>查看和分析你的每日记账数据，获取智能汇总报告</p>
          </div>
        </Link>
        
        <Link to="/interests" className="card-link">
          <div className="card interests-card">
            <div className="card-icon">🔥</div>
            <h3>兴趣信息聚合</h3>
            <p>收集和整理你感兴趣的信息，获取最新动态</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Home;