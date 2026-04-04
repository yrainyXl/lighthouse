import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  BookOpen,
  ChevronRight,
  Languages,
  Library,
  Receipt,
} from "lucide-react";
import { Link } from "react-router";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { cn } from "../components/ui/utils";
import {
  analyzeLedger,
  fetchBillsStats,
  fetchLedgerTransactions,
  type BillsStatsResponse,
  type LedgerAnalysis,
  type LedgerTransaction,
} from "../services/ledgerApi";
import {
  fetchRecommendation,
  fetchTopics,
  type Topic,
  type TopicRecommendation,
} from "../services/interestsApi";
import { getRangeByPreset } from "../utils/dateRange";

type RecommendationItem = {
  topic: string;
  title: string;
  url: string;
  source: string;
  snippet: string;
};

function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString()}`;
}

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

export function Dashboard() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [dayTransactions, setDayTransactions] = useState<LedgerTransaction[]>([]);
  const [dayAnalysis, setDayAnalysis] = useState<LedgerAnalysis | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<LedgerTransaction[]>([]);
  const [monthAnalysis, setMonthAnalysis] = useState<LedgerAnalysis | null>(null);
  const [monthStats, setMonthStats] = useState<BillsStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];
      const currentMonth = `${new Date().getFullYear()}-${String(
        new Date().getMonth() + 1,
      ).padStart(2, "0")}`;

      const todayRange = getRangeByPreset("date", today);
      const monthRange = getRangeByPreset("thisMonth");
      const trendRange = getPrevMonths(currentMonth, 4);

      const [
        topicsResult,
        dayTransactionsResult,
        monthTransactionsResult,
        monthStatsResult,
      ] = await Promise.allSettled([
        fetchTopics(),
        fetchLedgerTransactions(todayRange),
        fetchLedgerTransactions(monthRange),
        fetchBillsStats(trendRange.from, trendRange.to),
      ]);

      if (cancelled) {
        return;
      }

      const nextTopics =
        topicsResult.status === "fulfilled" ? topicsResult.value : [];
      setTopics(nextTopics);

      const nextDayTransactions =
        dayTransactionsResult.status === "fulfilled"
          ? dayTransactionsResult.value
          : [];
      const nextMonthTransactions =
        monthTransactionsResult.status === "fulfilled"
          ? monthTransactionsResult.value
          : [];

      setDayTransactions(nextDayTransactions);
      setMonthTransactions(nextMonthTransactions);
      setMonthStats(
        monthStatsResult.status === "fulfilled" ? monthStatsResult.value : null,
      );

      const analysisResults = await Promise.allSettled([
        analyzeLedger(nextDayTransactions, todayRange),
        analyzeLedger(nextMonthTransactions, monthRange),
        Promise.all(
          nextTopics
            .slice(0, 3)
            .map((topic) => fetchRecommendation(topic.name, false)),
        ),
      ]);

      if (cancelled) {
        return;
      }

      const [dayAnalysisResult, monthAnalysisResult, recommendationResult] =
        analysisResults as [
          PromiseSettledResult<LedgerAnalysis>,
          PromiseSettledResult<LedgerAnalysis>,
          PromiseSettledResult<TopicRecommendation[]>,
        ];

      setDayAnalysis(
        dayAnalysisResult.status === "fulfilled" ? dayAnalysisResult.value : null,
      );
      setMonthAnalysis(
        monthAnalysisResult.status === "fulfilled"
          ? monthAnalysisResult.value
          : null,
      );

      const nextRecommendations =
        recommendationResult.status === "fulfilled"
          ? recommendationResult.value
              .flatMap((recommendation) =>
                recommendation.articles.map((article) => ({
                  topic: recommendation.topic,
                  ...article,
                })),
              )
              .slice(0, 3)
          : [];

      setRecommendations(nextRecommendations);
      setLoading(false);
    }

    void loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  const savedWords = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("reading_saved_words") || "[]") as string[];
    } catch {
      return [];
    }
  }, []);

  const savedSentences = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("reading_saved_sentences") || "[]") as string[];
    } catch {
      return [];
    }
  }, []);

  const todayTopCategory = dayAnalysis?.aggregation.byCategory?.[0];
  const monthTopCategory = monthAnalysis?.aggregation.byCategory?.[0];
  const monthTrendData =
    monthStats?.monthly.map((item) => ({
      month: item.month,
      amount: item.amount,
    })) ?? [];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-sky-950 to-violet-950 p-5 text-white shadow-[0_32px_70px_-36px_rgba(15,23,42,0.75)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-sky-200">首页</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              今天先看重点
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              推荐、英语复习和消费摘要都放在第一屏。
            </p>
          </div>
          <Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">
            {topics.length} 个话题
          </Badge>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-sky-200">
              今日支出
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(dayAnalysis?.aggregation.total ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-sky-200">
              待复习
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {savedWords.length + savedSentences.length}
            </p>
          </div>
        </div>

        {monthTrendData.length > 0 && (
          <div className="mt-5 rounded-3xl bg-white/8 px-3 py-3 backdrop-blur">
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthTrendData}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#cbd5e1", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "支出",
                    ]}
                    cursor={{ fill: "rgba(255,255,255,0.08)" }}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(15,23,42,0.92)",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="amount" radius={[10, 10, 0, 0]} fill="#7dd3fc" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <Card className="border-sky-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 shadow-[0_18px_42px_-30px_rgba(14,165,233,0.45)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-sky-700" />
            内容推荐
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">加载中…</p>
          ) : recommendations.length === 0 ? (
            <p className="text-sm text-slate-500">暂无推荐内容。</p>
          ) : (
            recommendations.map((item, index) => (
              <a
                key={`${item.topic}-${item.url}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "block rounded-[24px] border p-4",
                  index === 0
                    ? "border-sky-200 bg-white shadow-sm"
                    : "border-white/70 bg-white/75",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    variant="outline"
                    className="border-sky-200 bg-sky-50 text-sky-800"
                  >
                    {item.topic}
                  </Badge>
                  <span className="text-xs text-slate-500">{item.source}</span>
                </div>
                <p className="mt-3 font-medium text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.snippet}
                </p>
              </a>
            ))
          )}
          <Link
            to="/articles"
            className="flex items-center justify-end gap-1 text-sm text-slate-500"
          >
            查看更多
            <ChevronRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      <Card className="border-violet-100 bg-gradient-to-br from-white via-violet-50 to-fuchsia-50 shadow-[0_18px_42px_-30px_rgba(139,92,246,0.4)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="h-4 w-4 text-violet-700" />
            英语待复习
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
              <p className="text-sm text-slate-500">生词</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {savedWords.length}
              </p>
            </div>
            <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
              <p className="text-sm text-slate-500">句子</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {savedSentences.length}
              </p>
            </div>
          </div>

          {savedSentences.length > 0 ? (
            <div className="rounded-[24px] border border-violet-100 bg-white/80 p-4 text-sm leading-6 text-slate-700 shadow-sm">
              {savedSentences[0]}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-violet-200 bg-white/60 p-4 text-sm text-slate-500">
              还没有待复习内容。
            </div>
          )}

          {savedWords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedWords.slice(0, 6).map((word) => (
                <Badge
                  key={word}
                  variant="outline"
                  className="rounded-full border-violet-200 bg-white/75 text-violet-800"
                >
                  {word}
                </Badge>
              ))}
            </div>
          )}

          <Link
            to="/english-reading"
            className="flex items-center justify-end gap-1 text-sm text-slate-500"
          >
            去复习
            <ChevronRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      <Card className="border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-teal-50 shadow-[0_18px_42px_-30px_rgba(16,185,129,0.38)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-emerald-700" />
            当日消费
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
              <p className="text-sm text-slate-500">今日支出</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatCurrency(dayAnalysis?.aggregation.total ?? 0)}
              </p>
            </div>
            <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
              <p className="text-sm text-slate-500">笔数</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {dayTransactions.length}
              </p>
            </div>
          </div>

          {todayTopCategory && (
            <div className="space-y-2 rounded-[24px] border border-emerald-100 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-900">
                  {todayTopCategory.category}
                </span>
                <span className="text-slate-500">
                  {formatCurrency(todayTopCategory.amount)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-emerald-100">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{
                    width: `${
                      dayAnalysis?.aggregation.total
                        ? Math.round(
                            (todayTopCategory.amount /
                              dayAnalysis.aggregation.total) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {dayAnalysis?.summary && (
            <p className="text-sm leading-6 text-slate-600">{dayAnalysis.summary}</p>
          )}

          <Link
            to="/bills"
            className="flex items-center justify-end gap-1 text-sm text-slate-500"
          >
            查看账单
            <ChevronRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-900 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-[0_20px_48px_-28px_rgba(15,23,42,0.8)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Library className="h-4 w-4 text-sky-300" />
            月汇总
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] bg-white/10 p-4">
              <p className="text-sm text-slate-300">本月支出</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatCurrency(monthAnalysis?.aggregation.total ?? 0)}
              </p>
            </div>
            <div className="rounded-[24px] bg-white/10 p-4">
              <p className="text-sm text-slate-300">笔数</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {monthTransactions.length}
              </p>
            </div>
          </div>

          {monthTrendData.length > 0 && (
            <div className="rounded-[24px] bg-white/8 px-3 py-3">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthTrendData}>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#cbd5e1", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "支出",
                      ]}
                      cursor={{ fill: "rgba(255,255,255,0.06)" }}
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(15,23,42,0.92)",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="amount" radius={[10, 10, 0, 0]} fill="#38bdf8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {monthTopCategory && (
            <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
              <p className="text-sm text-slate-300">支出最高分类</p>
              <p className="mt-2 font-medium text-white">
                {monthTopCategory.category}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {formatCurrency(monthTopCategory.amount)}
              </p>
            </div>
          )}

          <Link
            to="/bills"
            className="flex items-center justify-end gap-1 text-sm text-slate-300"
          >
            查看月账单
            <ChevronRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
