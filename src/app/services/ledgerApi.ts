import axios from "axios";

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

export interface LedgerAnalysis {
  summary: string;
  aggregation: LedgerAggregation;
  aiUsed: boolean;
  cached?: boolean;
  updatedAt?: string;
}

export interface BudgetRule {
  category: string;
  amount: number;
}

export interface BudgetStatusItem {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percent: number;
  status: "ok" | "warning" | "over";
}

export interface BudgetStatus {
  budgets: BudgetStatusItem[];
  budgetTip: string | null;
}

export interface MonthlyBillStat {
  month: string;
  yearMonth: string;
  amount: number;
}

export interface DailyBillStat {
  date: string;
  amount: number;
}

export interface CategoryBillStat {
  name: string;
  value: number;
  color: string;
}

export interface BillsStatsResponse {
  monthly: MonthlyBillStat[];
  daily: DailyBillStat[];
  byCategory: CategoryBillStat[];
  transactions: LedgerTransaction[];
}

export interface LedgerQueryParams {
  databaseId?: string;
  filter?: unknown;
  date?: string;
  from?: string;
  to?: string;
  forceRefresh?: boolean;
}

export async function fetchLedgerTransactions(
  params?: LedgerQueryParams,
): Promise<LedgerTransaction[]> {
  const response = await axios.post("/api/notion/query-ledger", params ?? {});
  return response.data?.transactions ?? [];
}

export async function analyzeLedger(
  transactions: LedgerTransaction[],
  params?: Pick<LedgerQueryParams, "date" | "from" | "to" | "forceRefresh">,
): Promise<LedgerAnalysis> {
  const response = await axios.post("/api/ledger/analyze", {
    transactions,
    ...(params ?? {}),
  });

  return response.data;
}

export async function fetchBudgetRules(): Promise<BudgetRule[]> {
  const response = await axios.get<{ rules: BudgetRule[] }>("/api/budget/rules");
  return response.data?.rules ?? [];
}

export async function saveBudgetRules(
  rules: BudgetRule[],
): Promise<BudgetRule[]> {
  const response = await axios.post<{ rules: BudgetRule[] }>(
    "/api/budget/rules",
    { rules },
  );

  return response.data?.rules ?? [];
}

export async function fetchBudgetStatus(
  from: string,
  to: string,
): Promise<BudgetStatus> {
  const response = await axios.get<BudgetStatus>("/api/ledger/budget-status", {
    params: { from, to },
  });

  return response.data ?? { budgets: [], budgetTip: null };
}

export async function fetchBillsStats(
  from: string,
  to: string,
): Promise<BillsStatsResponse> {
  const response = await axios.get<BillsStatsResponse>("/api/ledger/bills-stats", {
    params: { from, to },
  });

  return (
    response.data ?? {
      monthly: [],
      daily: [],
      byCategory: [],
      transactions: [],
    }
  );
}
