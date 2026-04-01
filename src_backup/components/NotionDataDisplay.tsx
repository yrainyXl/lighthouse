import React, { useMemo, useState } from 'react';
import '../styles/NotionDataDisplay.css';
import type {
  LedgerAggregation,
  LedgerTransaction,
  BudgetRule,
  BudgetStatusItem,
} from '../services/ledgerApi';

interface NotionDataDisplayProps {
  data: {
    transactions: LedgerTransaction[];
    summary: string;
    aggregation: LedgerAggregation;
    aiUsed: boolean;
    updatedAt: string;
    rangeLabel?: string;
  } | null;
  budgetStatus?: { budgets: BudgetStatusItem[]; budgetTip: string | null } | null;
  budgetRules?: BudgetRule[];
  onSaveBudgetRules?: (rules: BudgetRule[]) => Promise<void>;
}

const NotionDataDisplay: React.FC<NotionDataDisplayProps> = ({
  data,
  budgetStatus,
  budgetRules = [],
  onSaveBudgetRules,
}) => {
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingRules, setEditingRules] = useState<BudgetRule[]>([]);
  const [saving, setSaving] = useState(false);

  const categoryData = useMemo(() => {
    if (!data) return [];
    const total = data.aggregation.total || 0;
    return (data.aggregation.byCategory ?? []).slice(0, 8).map((item) => ({
      label: item.category,
      value: total > 0 ? Math.round((item.amount / total) * 100) : 0,
      amount: item.amount,
    }));
  }, [data]);

  const openBudgetForm = () => {
    setEditingRules(budgetRules.length ? [...budgetRules] : [{ category: '', amount: 0 }]);
    setShowBudgetForm(true);
  };

  const addBudgetRow = () => {
    setEditingRules((prev) => [...prev, { category: '', amount: 0 }]);
  };

  const updateBudgetRow = (index: number, field: 'category' | 'amount', value: string | number) => {
    setEditingRules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: field === 'amount' ? Number(value) || 0 : value };
      return next;
    });
  };

  const removeBudgetRow = (index: number) => {
    setEditingRules((prev) => prev.filter((_, i) => i !== index));
  };

  const saveBudgetRules = async () => {
    const rules = editingRules
      .map((r) => ({ category: String(r.category).trim(), amount: Number(r.amount) || 0 }))
      .filter((r) => r.category);
    if (!onSaveBudgetRules || rules.length === 0) {
      setShowBudgetForm(false);
      return;
    }
    setSaving(true);
    try {
      await onSaveBudgetRules(rules);
      setShowBudgetForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="notion-data-display">
      <h3>Notion记账分析</h3>
      <div className="notion-content">
        {data && (
          <div className="analysis-result">
            {data.summary && (
              <p className="summary">
                {data.aiUsed && <span className="summary-label">洞察：</span>}
                {data.summary}
              </p>
            )}
            <p className="meta">
              {data.rangeLabel && <span>范围：{data.rangeLabel}</span>}
              {data.rangeLabel && ' · '}
              更新于：{data.updatedAt}（{data.aiUsed ? '含AI洞察' : '本地聚合'}）
            </p>

            {budgetStatus && budgetStatus.budgets.length > 0 && (
              <div className="budget-card">
                <div className="budget-card-header">
                  <span>本月预算进度</span>
                  {onSaveBudgetRules && (
                    <button type="button" className="budget-settings-btn" onClick={openBudgetForm}>
                      预算设置
                    </button>
                  )}
                </div>
                <div className="budget-list">
                  {budgetStatus.budgets.map((b, i) => (
                    <div key={i} className={`budget-item budget-status-${b.status}`}>
                      <span className="budget-category">{b.category}</span>
                      <div className="budget-bar-wrap">
                        <div
                          className="budget-bar"
                          style={{
                            width: `${Math.min(b.percent, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="budget-values">
                        {b.spentAmount.toFixed(0)} / {b.budgetAmount.toFixed(0)} 元 ({b.percent}%)
                        {b.status === 'over' && ' 超支'}
                        {b.status === 'warning' && ' 接近预算'}
                      </span>
                    </div>
                  ))}
                </div>
                {budgetStatus.budgetTip && (
                  <p className="budget-tip">
                    <span className="budget-tip-label">建议：</span>
                    {budgetStatus.budgetTip}
                  </p>
                )}
              </div>
            )}

            {!budgetStatus?.budgets.length && onSaveBudgetRules && (
              <div className="budget-card">
                <button type="button" className="budget-settings-btn" onClick={openBudgetForm}>
                  设置本月预算
                </button>
              </div>
            )}

            {showBudgetForm && (
              <div className="budget-form-card">
                <div className="budget-form-header">预算设置（按分类）</div>
                {editingRules.map((r, i) => (
                  <div key={i} className="budget-form-row">
                    <input
                      type="text"
                      placeholder="分类名（如：餐饮、约会）"
                      value={r.category}
                      onChange={(e) => updateBudgetRow(i, 'category', e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="预算金额"
                      min={0}
                      value={r.amount || ''}
                      onChange={(e) => updateBudgetRow(i, 'amount', e.target.value)}
                    />
                    <button type="button" className="budget-form-remove" onClick={() => removeBudgetRow(i)}>
                      删除
                    </button>
                  </div>
                ))}
                <div className="budget-form-actions">
                  <button type="button" onClick={addBudgetRow}>
                    添加一行
                  </button>
                  <button type="button" onClick={saveBudgetRules} disabled={saving}>
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button type="button" onClick={() => setShowBudgetForm(false)}>
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="aggregation-card">
              <div className="aggregation-total">
                合计 {(data.aggregation.total ?? 0).toFixed(2)} 元，共 {data.aggregation.count ?? 0} 笔
              </div>
              <div className="chart-placeholder">
                {categoryData.map((item, index) => (
                <div key={index} className="chart-item">
                  <span className="chart-label">{item.label}</span>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                  <span className="chart-value">{item.amount.toFixed(2)} 元 ({item.value}%)</span>
                </div>
                ))}
              </div>
            </div>

            <div className="notion-table">
              <div className="notion-table-header">
                <div className="col col-date">日期</div>
                <div className="col col-amount">金额</div>
                <div className="col col-category">分类</div>
              </div>
              <div className="notion-table-body">
                {(data.transactions ?? []).slice(0, 50).map((t) => (
                  <div key={t.id} className="notion-table-row">
                    <div className="col col-date">{t.date || '-'}</div>
                    <div className="col col-amount">
                      {(t.amount ?? 0).toFixed(2)} {t.currency || ''}
                    </div>
                    <div className="col col-category">{t.category || '未分类'}</div>
                  </div>
                ))}
              </div>
              {data.transactions.length > 50 && (
                <div className="notion-table-footer">仅展示前 50 条明细</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotionDataDisplay;