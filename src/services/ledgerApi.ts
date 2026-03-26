import axios from 'axios';

export interface LedgerTransaction {
  id: string;
  date: string;
  type: string;
  category: string;
  account: string;
  payee: string;
  amount: number;
  currency: string;
  note: string;
}

export interface LedgerAggregationCategory {
  category: string;
  amount: number;
}

export interface LedgerAggregation {
  total: number;
  byCategory: LedgerAggregationCategory[];
  count: number;
}

export async function fetchLedgerTransactions(params?: {
  databaseId?: string;
  filter?: any;
  date?: string;
  from?: string;
  to?: string;
  forceRefresh?: boolean;
}): Promise<LedgerTransaction[]> {
  const resp = await axios.post('/api/notion/query-ledger', params ?? {});
  return resp.data?.transactions ?? [];
}

export async function analyzeLedger(
  transactions: LedgerTransaction[],
  params?: {
    date?: string;
    from?: string;
    to?: string;
    forceRefresh?: boolean;
  },
): Promise<{
  summary: string;
  aggregation: LedgerAggregation;
  aiUsed: boolean;
  cached?: boolean;
  updatedAt?: string;
}> {
  const resp = await axios.post('/api/ledger/analyze', { transactions, ...(params ?? {}) });
  return resp.data;
}

// --- 预算 ---

export interface BudgetRule {
  category: string;
  amount: number;
}

export interface BudgetStatusItem {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percent: number;
  status: 'ok' | 'warning' | 'over';
}

export interface BudgetStatus {
  budgets: BudgetStatusItem[];
  budgetTip: string | null;
}

export async function fetchBudgetRules(): Promise<BudgetRule[]> {
  const resp = await axios.get<{ rules: BudgetRule[] }>('/api/budget/rules');
  return resp.data?.rules ?? [];
}

export async function saveBudgetRules(rules: BudgetRule[]): Promise<BudgetRule[]> {
  const resp = await axios.post<{ rules: BudgetRule[] }>('/api/budget/rules', { rules });
  return resp.data?.rules ?? [];
}

export async function fetchBudgetStatus(from: string, to: string): Promise<BudgetStatus> {
  const resp = await axios.get<BudgetStatus>('/api/ledger/budget-status', {
    params: { from, to },
  });
  return resp.data ?? { budgets: [], budgetTip: null };
}

