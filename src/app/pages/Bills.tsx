import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Brain,
  Calendar,
  PieChart as PieChartIcon,
  Receipt,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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

const CATEGORY_COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#6b7280",
];

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
    if (viewMode === "month" && stats?.byCategory?.length) {
      return stats.byCategory.map((item, index) => ({
        label: item.name,
        amount: item.value,
        color: item.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }));
    }

    return (analysis?.aggregation.byCategory ?? []).map((item, index) => ({
      label: item.category,
      amount: item.amount,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  }, [analysis?.aggregation.byCategory, stats?.byCategory, viewMode]);

  const totalSpent = useMemo(() => {
    return categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);
  }, [categoryBreakdown]);

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
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
              真实账单数据流
            </Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              账单统计
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
              保留旧版的分析与预算流程，同时把统计和图表改造成移动端也可读的结构。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                分析范围
              </p>
              <p className="mt-2 text-sm font-medium text-slate-950">
                {getRangeLabel(effectiveRange)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                图表月份
              </p>
              <select
                className="mt-2 w-full bg-transparent text-sm font-medium text-slate-950 outline-none"
                value={chartMonth}
                onChange={(event) => setChartMonth(event.target.value)}
              >
                {monthOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="h-full min-h-14 rounded-2xl bg-slate-950 text-white hover:bg-slate-800"
              onClick={syncFromNotion}
              disabled={syncing || loading}
            >
              <RefreshCw
                className={cn("h-4 w-4", syncing && "animate-spin")}
              />
              {syncing ? "同步中…" : "强制刷新 Notion"}
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              { key: "day", label: "日视图" },
              { key: "week", label: "周视图" },
              { key: "month", label: "月视图" },
              { key: "year", label: "年视图" },
            ] as { key: ViewMode; label: string }[]
          ).map((item) => (
            <Button
              key={item.key}
              variant={viewMode === item.key ? "default" : "outline"}
              className={cn(
                "rounded-full",
                viewMode === item.key && "bg-sky-600 hover:bg-sky-700",
              )}
              onClick={() => setViewMode(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap">
          {viewMode === "day" && (
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
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
            <>
              <Button
                variant={weekOption === "thisWeek" ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  weekOption === "thisWeek" && "bg-sky-600 hover:bg-sky-700",
                )}
                onClick={() => setWeekOption("thisWeek")}
              >
                本周
              </Button>
              <Button
                variant={weekOption === "lastWeek" ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  weekOption === "lastWeek" && "bg-sky-600 hover:bg-sky-700",
                )}
                onClick={() => setWeekOption("lastWeek")}
              >
                上一周
              </Button>
            </>
          )}

          {viewMode === "month" && (
            <>
              <Button
                variant={monthOption === "thisMonth" ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  monthOption === "thisMonth" && "bg-sky-600 hover:bg-sky-700",
                )}
                onClick={() => setMonthOption("thisMonth")}
              >
                本月
              </Button>
              <Button
                variant={monthOption === "lastMonth" ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  monthOption === "lastMonth" && "bg-sky-600 hover:bg-sky-700",
                )}
                onClick={() => setMonthOption("lastMonth")}
              >
                上一月
              </Button>
            </>
          )}

          {viewMode === "year" && (
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              当前按本年范围分析
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/70 bg-white/85">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">当前范围总支出</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {formatCurrency(analysis?.aggregation.total ?? totalSpent)}
                </p>
              </div>
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">交易笔数</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {transactions.length}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">最高分类</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {topCategory?.label ?? "暂无"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {topCategory ? formatCurrency(topCategory.amount) : "等待同步"}
                </p>
              </div>
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <PieChartIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/70 bg-white/85">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">月度变化</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {trend === null ? "暂无" : `${Math.abs(trend).toFixed(1)}%`}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {trend === null
                    ? "需要相邻月份数据"
                    : trend > 0
                      ? "相比上月增加"
                      : "相比上月下降"}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-2xl p-3",
                  trend === null
                    ? "bg-slate-100 text-slate-600"
                    : trend > 0
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700",
                )}
              >
                {trend === null ? (
                  <Calendar className="h-5 w-5" />
                ) : trend > 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-white/80 p-1">
          <TabsTrigger value="overview" className="flex-none rounded-xl px-4">
            总览
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex-none rounded-xl px-4">
            趋势
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-none rounded-xl px-4">
            明细
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-700" />
                AI / 本地分析摘要
              </CardTitle>
              <CardDescription>{getRangeLabel(effectiveRange)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  正在加载账单分析…
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                    {analysis?.summary || "暂无分析摘要，请先刷新数据。"}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <Badge variant="outline">
                      {analysis?.aiUsed ? "含 AI 洞察" : "本地聚合"}
                    </Badge>
                    {analysis?.updatedAt && (
                      <Badge variant="outline">更新于 {analysis.updatedAt}</Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {viewMode === "month" && (
            <Card className="border-white/70 bg-white/85">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>本月预算</CardTitle>
                  <CardDescription>按分类观察预算执行情况。</CardDescription>
                </div>
                <Button variant="outline" onClick={beginBudgetEdit}>
                  {budgetRules.length ? "编辑预算" : "设置预算"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgetStatus?.budgets.length ? (
                  <div className="space-y-3">
                    {budgetStatus.budgets.map((item) => (
                      <div key={item.category} className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-900">
                            {item.category}
                          </span>
                          <span className="text-slate-500">
                            {item.spentAmount.toFixed(0)} / {item.budgetAmount.toFixed(0)} 元
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
                        <p className="text-xs text-slate-500">
                          {item.percent}% ·
                          {item.status === "over"
                            ? " 已超支"
                            : item.status === "warning"
                              ? " 接近预算"
                              : " 预算正常"}
                        </p>
                      </div>
                    ))}
                    {budgetStatus.budgetTip && (
                      <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                        <span className="font-medium">建议：</span>
                        {budgetStatus.budgetTip}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    还没有预算规则，可以先按分类设置每月预算。
                  </div>
                )}

                {showBudgetForm && (
                  <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-950">预算设置</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowBudgetForm(false)}
                      >
                        关闭
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {editingRules.map((rule, index) => (
                        <div
                          key={`${rule.category}-${index}`}
                          className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
                        >
                          <Input
                            placeholder="分类名，例如 餐饮"
                            value={rule.category}
                            onChange={(event) =>
                              updateBudgetRule(
                                index,
                                "category",
                                event.target.value,
                              )
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
                            onClick={() => removeBudgetRule(index)}
                          >
                            删除
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setEditingRules((current) => [
                            ...current,
                            { category: "", amount: 0 },
                          ])
                        }
                      >
                        添加一行
                      </Button>
                      <Button onClick={saveBudgetConfig} disabled={savingBudget}>
                        {savingBudget ? "保存中…" : "保存预算"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-white/70 bg-white/85">
              <CardHeader>
                <CardTitle>分类结构</CardTitle>
                <CardDescription>
                  桌面端保留图表，移动端优先阅读分类清单。
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryBreakdown.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    暂无分类数据，请先同步账单。
                  </div>
                ) : (
                  <div className="hidden h-[320px] lg:block">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          dataKey="amount"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          outerRadius={108}
                          innerRadius={52}
                        >
                          {categoryBreakdown.map((item) => (
                            <Cell key={item.label} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "支出",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {categoryBreakdown.length > 0 && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500 lg:hidden">
                    手机端默认显示下方的分类清单，避免图表挤压后难以阅读。
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/85">
              <CardHeader>
                <CardTitle>分类清单</CardTitle>
                <CardDescription>更适合手机端浏览的占比列表。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryBreakdown.map((item) => {
                  const percent = totalSpent
                    ? Math.round((item.amount / totalSpent) * 100)
                    : 0;

                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-slate-900">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-slate-500">
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        占当前范围 {percent}%
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <CardTitle>每日趋势</CardTitle>
              <CardDescription>
                以 {chartMonth} 为中心的每日支出走势。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.daily.length ? (
                <div className="h-[260px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stats.daily}
                      margin={{ top: 10, right: 12, left: -18, bottom: 6 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                      />
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
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  暂无日趋势数据。
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <CardTitle>月度趋势</CardTitle>
              <CardDescription>最近几个月的支出对比。</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.monthly.length ? (
                <div className="h-[280px] sm:h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.monthly}
                      margin={{ top: 12, right: 12, left: -10, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                      />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "支出",
                        ]}
                      />
                      <Bar
                        dataKey="amount"
                        fill="#0f172a"
                        radius={[10, 10, 0, 0]}
                        maxBarSize={72}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  暂无月度趋势数据。
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="border-white/70 bg-white/85">
            <CardHeader>
              <CardTitle>账单明细</CardTitle>
              <CardDescription>
                手机端展示卡片，桌面端展示表格。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  当前范围没有账单明细。
                </div>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {transactions.slice(0, 30).map((item) => (
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
                    ))}
                  </div>

                  <div className="hidden overflow-hidden rounded-3xl border border-slate-200 md:block">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 text-left text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">日期</th>
                          <th className="px-4 py-3 font-medium">金额</th>
                          <th className="px-4 py-3 font-medium">分类</th>
                          <th className="px-4 py-3 font-medium">商户</th>
                          <th className="px-4 py-3 font-medium">备注</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                        {transactions.slice(0, 50).map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">{item.date || "-"}</td>
                            <td className="px-4 py-3">
                              {(item.amount ?? 0).toFixed(2)} {item.currency || "CNY"}
                            </td>
                            <td className="px-4 py-3">{item.category || "未分类"}</td>
                            <td className="px-4 py-3">{item.payee || "-"}</td>
                            <td className="px-4 py-3">{item.note || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
