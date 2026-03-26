import React, { useState, useEffect, useCallback } from 'react';
import NotionDataDisplay from '../components/NotionDataDisplay';
import '../styles/NotionPage.css';
import {
  analyzeLedger,
  fetchLedgerTransactions,
  fetchBudgetRules,
  saveBudgetRules,
  fetchBudgetStatus,
  type BudgetRule,
} from '../services/ledgerApi';
import { getRangeByPreset, type RangePreset } from '../utils/dateRange';
import axios from 'axios';

type ViewMode = 'day' | 'week' | 'month' | 'year';

const NotionPage: React.FC = () => {
  const [notionData, setNotionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [weekOption, setWeekOption] = useState<RangePreset>('thisWeek');
  const [monthOption, setMonthOption] = useState<RangePreset>('thisMonth');
  const [budgetRules, setBudgetRules] = useState<BudgetRule[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<{ budgets: { category: string; budgetAmount: number; spentAmount: number; percent: number; status: 'ok' | 'warning' | 'over' }[]; budgetTip: string | null } | null>(null);

  const getEffectiveRange = useCallback((): { date?: string; from?: string; to?: string } => {
    if (viewMode === 'day') return getRangeByPreset('date', selectedDate);
    if (viewMode === 'week') return getRangeByPreset(weekOption);
    if (viewMode === 'month') return getRangeByPreset(monthOption);
    return getRangeByPreset('thisYear');
  }, [viewMode, selectedDate, weekOption, monthOption]);

  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    const range = getEffectiveRange();
    const fetchParams = range.date ? { date: range.date, forceRefresh } : { from: range.from, to: range.to, forceRefresh };
    const analyzeParams = range.date ? { date: range.date, forceRefresh } : { from: range.from, to: range.to, forceRefresh };
    try {
      const transactions = await fetchLedgerTransactions(fetchParams);
      const analysis = await analyzeLedger(transactions, analyzeParams);
      setNotionData({
        transactions,
        ...analysis,
        updatedAt: analysis.updatedAt || new Date().toLocaleString(),
        rangeLabel: range.date ? range.date : (range.from && range.to ? `${range.from} ~ ${range.to}` : ''),
      });
      if (viewMode === 'month' && range.from && range.to) {
        try {
          const status = await fetchBudgetStatus(range.from, range.to);
          setBudgetStatus(status);
        } catch {
          setBudgetStatus(null);
        }
      } else {
        setBudgetStatus(null);
      }
    } catch (e: any) {
      if (axios.isAxiosError(e)) {
        const serverMsg =
          (e.response?.data as any)?.error ||
          (e.response?.data as any)?.message;
        setError(serverMsg || e.message || '加载失败');
      } else {
        setError(e?.message || '加载失败');
      }
    } finally {
      setLoading(false);
    }
  }, [getEffectiveRange, viewMode]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    fetchBudgetRules()
      .then(setBudgetRules)
      .catch(() => setBudgetRules([]));
  }, []);

  return (
    <div className="notion-page">
      <h2>Notion 账单分析</h2>
      <div className="notion-toolbar">
        <div className="notion-toolbar-left">
          {(['day', 'week', 'month', 'year'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`toolbar-tab ${viewMode === mode ? 'active' : ''}`}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'day' ? '日' : mode === 'week' ? '周' : mode === 'month' ? '月' : '年'}
            </button>
          ))}
        </div>
        <div className="notion-toolbar-right">
          {viewMode === 'day' && (
            <>
              <label htmlFor="analysis-date">日期</label>
              <input
                id="analysis-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </>
          )}
          {viewMode === 'week' && (
            <>
              <button
                type="button"
                className={`toolbar-option ${weekOption === 'thisWeek' ? 'active' : ''}`}
                onClick={() => setWeekOption('thisWeek')}
              >
                本周
              </button>
              <button
                type="button"
                className={`toolbar-option ${weekOption === 'lastWeek' ? 'active' : ''}`}
                onClick={() => setWeekOption('lastWeek')}
              >
                上一周
              </button>
            </>
          )}
          {viewMode === 'month' && (
            <>
              <button
                type="button"
                className={`toolbar-option ${monthOption === 'thisMonth' ? 'active' : ''}`}
                onClick={() => setMonthOption('thisMonth')}
              >
                本月
              </button>
              <button
                type="button"
                className={`toolbar-option ${monthOption === 'lastMonth' ? 'active' : ''}`}
                onClick={() => setMonthOption('lastMonth')}
              >
                上一月
              </button>
            </>
          )}
          {viewMode === 'year' && <span className="toolbar-label">本年</span>}
        </div>
        <button className="toolbar-refresh" onClick={() => loadData(true)} disabled={loading}>
          {loading ? '刷新中...' : '强制刷新'}
        </button>
      </div>
      {loading ? (
        <div className="loading">加载中...</div>
      ) : error ? (
        <div className="loading">错误：{error}</div>
      ) : (
        <NotionDataDisplay
          data={notionData}
          budgetStatus={budgetStatus}
          budgetRules={budgetRules}
          onSaveBudgetRules={async (rules) => {
            const next = await saveBudgetRules(rules);
            setBudgetRules(next);
            const range = getEffectiveRange();
            if (viewMode === 'month' && range.from && range.to) {
              const status = await fetchBudgetStatus(range.from, range.to);
              setBudgetStatus(status);
            }
          }}
        />
      )}
    </div>
  );
};

export default NotionPage;