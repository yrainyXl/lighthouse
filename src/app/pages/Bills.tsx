import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Calendar,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  analyzeLedger,
  fetchBillsStats,
  fetchBudgetRules,
  fetchBudgetStatus,
  fetchLedgerTransactions,
  saveBudgetRules,
  type BillsStatsResponse,
  type BudgetRule,
  type BudgetStatus,
  type LedgerAnalysis,
  type LedgerTransaction,
} from "../services/ledgerApi";
import { getRangeByPreset, type RangePreset } from "../utils/dateRange";
import { cn } from "../components/ui/utils";

type ViewMode = "day" | "week" | "month" | "year";

function getPrevMonths(
  yearMonth: string,
  count: number,
): { from: string; to: string } {
  const [year, month] = yearMonth.split("-").map(Number);
  const fromDate = new Date(year, month - count, 1);
  const from = `${fromDate.getFullYear()}-${String(
    fromDate.getMonth() + 1,
  ).padStart(2, "0")}`;
  return { from, to: yearMonth };
}

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString()}`;
}

function getRangeLabel(range: { date?: string; from?: string; to?: string }) {
  if (range.date) {
    return range.date;
  }
  if (range.from && range.to) {
    return `${range.from} ~ ${range.to}`;
  }
  return "当前范围";
}

export function Bills() {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1,
  ).padStart(2, "0")}`;

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOption, setWeekOption] = useState<RangePreset>("thisWeek");
  const [monthOption, setMonthOption] = useState<RangePreset>("thisMonth");
  const [chartMonth, setChartMonth] = useState(currentMonth);

  const [stats, setStats] = useState<BillsStatsResponse | null>(null);
  const [analysis, setAnalysis] = useState<LedgerAnalysis | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [budgetRules, setBudgetRules] = useState<BudgetRule[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingRules, setEditingRules] = useState<BudgetRule[]>([]);
  const [error, setError] = useState<string | null>(null);

  const effectiveRange = useMemo(() => {
    if (viewMode === "day") {
      return getRangeByPreset("date", selectedDate);
    }
    if (viewMode === "week") {
      return getRangeByPreset(weekOption);
    }
    if (viewMode === "month") {
      return getRangeByPreset(monthOption);
    }
    return getRangeByPreset("thisYear");
  }, [monthOption, selectedDate, viewMode, weekOption]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - index);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`;
    });
  }, []);

  const loadBudgetConfig = useCallback(async () => {
    try {
      const nextRules = await fetchBudgetRules();
      setBudgetRules(nextRules);
    } catch {
      setBudgetRules([]);
    }
  }, []);

  const loadBillsData = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);

      try {
        const { from, to } = getPrevMonths(chartMonth, 3);
        const [nextTransactions, nextStats] = await Promise.all([
          fetchLedgerTransactions({ ...effectiveRange, forceRefresh }),
          fetchBillsStats(from, to),
        ]);

        const nextAnalysis = await analyzeLedger(nextTransactions, {
          ...effectiveRange,
          forceRefresh,
        });

        setTransactions(nextTransactions);
        setStats(nextStats);
        setAnalysis(nextAnalysis);

        if (viewMode === "month" && effectiveRange.from && effectiveRange.to) {
          try {
            const nextBudgetStatus = await fetchBudgetStatus(
              effectiveRange.from,
              effectiveRange.to,
            );
            setBudgetStatus(nextBudgetStatus);
          } catch {
            setBudgetStatus(null);
          }
        } else {
          setBudgetStatus(null);
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : String(reason));
      } finally {
        setLoading(false);
      }
    },
    [chartMonth, effectiveRange, viewMode],
  );

  useEffect(() => {
    loadBudgetConfig();
  }, [loadBudgetConfig]);

  useEffect(() => {
    loadBillsData(false);
  }, [loadBillsData]);

  const syncFromNotion = async () => {
    setSyncing(true);
    setError(null);

    try {
      await fetchLedgerTransactions({ ...effectiveRange, forceRefresh: true });
      await loadBillsData(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSyncing(false);
    }
  };

  const categoryBreakdown = useMemo(() => {
    return (analysis?.aggregation.byCategory ?? []).map((item) => ({
      label: item.category,
      amount: item.amount,
    }));
  }, [analysis?.aggregation.byCategory]);

  const totalSpent = analysis?.aggregation.total ?? 0;
  const topCategory = categoryBreakdown[0];
  const currentMonthStat = stats?.monthly.find(
    (item) => item.yearMonth === chartMonth,
  );
  const currentMonthIndex =
    stats?.monthly.findIndex((item) => item.yearMonth === chartMonth) ?? -1;
  const previousMonthStat =
    currentMonthIndex > 0 ? stats?.monthly[currentMonthIndex - 1] : undefined;
  const trend =
    currentMonthStat &&
    previousMonthStat &&
    previousMonthStat.amount > 0
      ? ((currentMonthStat.amount - previousMonthStat.amount) /
          previousMonthStat.amount) *
        100
      : null;

  const beginBudgetEdit = () => {
    setEditingRules(
      budgetRules.length ? [...budgetRules] : [{ category: "", amount: 0 }],
    );
    setShowBudgetForm(true);
  };

  const updateBudgetRule = (
    index: number,
    field: "category" | "amount",
    value: string,
  ) => {
    setEditingRules((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index
          ? {
              ...rule,
              [field]:
                field === "amount" ? Number(value || 0) : value,
            }
          : rule,
      ),
    );
  };

  const removeBudgetRule = (index: number) => {
    setEditingRules((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const saveBudgetConfig = async () => {
    const nextRules = editingRules
      .map((rule) => ({
        category: String(rule.category).trim(),
        amount: Number(rule.amount) || 0,
      }))
      .filter((rule) => rule.category);

    if (nextRules.length === 0) {
      setShowBudgetForm(false);
      return;
    }

    setSavingBudget(true);
    try {
      const saved = await saveBudgetRules(nextRules);
      setBudgetRules(saved);
      setShowBudgetForm(false);

      if (viewMode === "month" && effectiveRange.from && effectiveRange.to) {
        const nextBudgetStatus = await fetchBudgetStatus(
          effectiveRange.from,
          effectiveRange.to,
        );
        setBudgetStatus(nextBudgetStatus);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <div className="space-y-4">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          账单统计
        </h2>
        <p className="mt-1 text-sm text-slate-500">看支出、分类和趋势。</p>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: "day", label: "日" },
                { key: "week", label: "周" },
                { key: "month", label: "月" },
                { key: "year", label: "年" },
              ] as { key: ViewMode; label: string }[]
            ).map((item) => (
              <Button
                key={item.key}
                variant={viewMode === item.key ? "default" : "outline"}
                className={cn(viewMode === item.key && "bg-slate-950 hover:bg-slate-800")}
                onClick={() => setViewMode(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {viewMode === "day" && (
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>日期</span>
              <input
                type="date"
                className="bg-transparent outline-none"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
          )}

          {viewMode === "week" && (
            <div className="flex gap-2">
              <Button
                variant={weekOption === "thisWeek" ? "default" : "outline"}
                className={cn(weekOption === "thisWeek" && "bg-slate-950 hover:bg-slate-800")}
                onClick={() => setWeekOption("thisWeek")}
              >
                本周
              </Button>
              <Button
                variant={weekOption === "lastWeek" ? "default" : "outline"}
                className={cn(weekOption === "lastWeek" && "bg-slate-950 hover:bg-slate-800")}
                onClick={() => setWeekOption("lastWeek")}
              >
                上周
              </Button>
            </div>
          )}

          {viewMode === "month" && (
            <div className="flex gap-2">
              <Button
                variant={monthOption === "thisMonth" ? "default" : "outline"}
                className={cn(monthOption === "thisMonth" && "bg-slate-950 hover:bg-slate-800")}
                onClick={() => setMonthOption("thisMonth")}
              >
                本月
              </Button>
              <Button
                variant={monthOption === "lastMonth" ? "default" : "outline"}
                className={cn(monthOption === "lastMonth" && "bg-slate-950 hover:bg-slate-800")}
                onClick={() => setMonthOption("lastMonth")}
              >
                上月
              </Button>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <select
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              value={chartMonth}
              onChange={(event) => setChartMonth(event.target.value)}
            >
              {monthOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <Button onClick={syncFromNotion} disabled={syncing || loading}>
              <RefreshCw
                className={cn("h-4 w-4", syncing && "animate-spin")}
              />
              {syncing ? "同步中…" : "同步"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">总支出</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <Wallet className="h-5 w-5 text-sky-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">交易数</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {transactions.length}
                </p>
              </div>
              {trend === null ? (
                <Calendar className="h-5 w-5 text-slate-500" />
              ) : trend > 0 ? (
                <TrendingUp className="h-5 w-5 text-rose-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-emerald-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList className="h-auto w-full justify-start rounded-2xl bg-white p-1">
          <TabsTrigger value="overview" className="flex-none rounded-xl px-4">
            概览
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex-none rounded-xl px-4">
            趋势
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-none rounded-xl px-4">
            明细
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-3 p-4">
              <p className="text-sm text-slate-500">{getRangeLabel(effectiveRange)}</p>
              {loading ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  加载中…
                </div>
              ) : (
                <p className="text-sm leading-7 text-slate-700">
                  {analysis?.summary || "暂无分析摘要。"}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">分类</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500">暂无分类数据。</p>
              ) : (
                categoryBreakdown.map((item) => {
                  const percent = totalSpent
                    ? Math.round((item.amount / totalSpent) * 100)
                    : 0;

                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-900">
                          {item.label}
                        </span>
                        <span className="text-slate-500">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-slate-900"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {viewMode === "month" && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                <CardTitle className="text-base">预算</CardTitle>
                <Button variant="outline" size="sm" onClick={beginBudgetEdit}>
                  {budgetRules.length ? "编辑" : "设置"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {budgetStatus?.budgets.length ? (
                  budgetStatus.budgets.map((item) => (
                    <div
                      key={item.category}
                      className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-900">
                          {item.category}
                        </span>
                        <span className="text-slate-500">
                          {item.spentAmount.toFixed(0)} / {item.budgetAmount.toFixed(0)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            item.status === "over"
                              ? "bg-rose-500"
                              : item.status === "warning"
                                ? "bg-amber-500"
                                : "bg-emerald-500",
                          )}
                          style={{ width: `${Math.min(item.percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">还没有预算规则。</p>
                )}

                {showBudgetForm && (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {editingRules.map((rule, index) => (
                      <div key={index} className="grid gap-2">
                        <Input
                          placeholder="分类名"
                          value={rule.category}
                          onChange={(event) =>
                            updateBudgetRule(index, "category", event.target.value)
                          }
                        />
                        <Input
                          type="number"
                          placeholder="预算金额"
                          value={rule.amount || ""}
                          onChange={(event) =>
                            updateBudgetRule(index, "amount", event.target.value)
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeBudgetRule(index)}
                        >
                          删除
                        </Button>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setEditingRules((current) => [
                            ...current,
                            { category: "", amount: 0 },
                          ])
                        }
                      >
                        添加
                      </Button>
                      <Button onClick={saveBudgetConfig} disabled={savingBudget}>
                        {savingBudget ? "保存中…" : "保存"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trend" className="space-y-3">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">每日趋势</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.daily.length ? (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stats.daily}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "支出",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#0f172a"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-slate-500">暂无趋势数据。</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">月度趋势</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.monthly.length ? (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.monthly}
                      margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "支出",
                        ]}
                      />
                      <Bar dataKey="amount" fill="#0f172a" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-slate-500">暂无月度数据。</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-3 p-4">
              {transactions.length === 0 ? (
                <p className="text-sm text-slate-500">当前范围没有账单明细。</p>
              ) : (
                transactions.slice(0, 30).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">
                          {item.category || "未分类"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.date || "-"} · {item.payee || "未知商户"}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {(item.amount ?? 0).toFixed(2)} {item.currency || "CNY"}
                      </p>
                    </div>
                    {item.note && (
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
