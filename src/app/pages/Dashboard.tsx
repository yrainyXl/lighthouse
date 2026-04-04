import { useEffect, useMemo, useState } from "react";
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
import {
  analyzeLedger,
  fetchLedgerTransactions,
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

export function Dashboard() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [dayTransactions, setDayTransactions] = useState<LedgerTransaction[]>([]);
  const [dayAnalysis, setDayAnalysis] = useState<LedgerAnalysis | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<LedgerTransaction[]>([]);
  const [monthAnalysis, setMonthAnalysis] = useState<LedgerAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      setLoading(true);

      const todayRange = getRangeByPreset("date", new Date().toISOString().split("T")[0]);
      const monthRange = getRangeByPreset("thisMonth");

      const [topicsResult, dayTransactionsResult, monthTransactionsResult] =
        await Promise.allSettled([
          fetchTopics(),
          fetchLedgerTransactions(todayRange),
          fetchLedgerTransactions(monthRange),
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

  return (
    <div className="space-y-4">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          首页
        </h2>
      </section>

      <div className="grid gap-3">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              内容推荐
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">加载中…</p>
            ) : recommendations.length === 0 ? (
              <p className="text-sm text-slate-500">暂无推荐内容。</p>
            ) : (
              recommendations.map((item) => (
                <a
                  key={`${item.topic}-${item.url}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{item.topic}</Badge>
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

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="h-4 w-4" />
              英语待复习
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">生词</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {savedWords.length}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">句子</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {savedSentences.length}
                </p>
              </div>
            </div>
            {savedSentences.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {savedSentences[0]}
              </div>
            ) : (
              <p className="text-sm text-slate-500">还没有待复习内容。</p>
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

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />
              当日消费
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">今日支出</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatCurrency(dayAnalysis?.aggregation.total ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">笔数</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {dayTransactions.length}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">主要分类</p>
              <p className="mt-2 font-medium text-slate-950">
                {todayTopCategory?.category || "暂无"}
              </p>
              {dayAnalysis?.summary && (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {dayAnalysis.summary}
                </p>
              )}
            </div>
            <Link
              to="/bills"
              className="flex items-center justify-end gap-1 text-sm text-slate-500"
            >
              查看账单
              <ChevronRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Library className="h-4 w-4" />
              月汇总
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">本月支出</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {formatCurrency(monthAnalysis?.aggregation.total ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">笔数</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {monthTransactions.length}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">支出最高分类</p>
              <p className="mt-2 font-medium text-slate-950">
                {monthTopCategory?.category || "暂无"}
              </p>
              {monthTopCategory && (
                <p className="mt-2 text-sm text-slate-600">
                  {formatCurrency(monthTopCategory.amount)}
                </p>
              )}
              {monthAnalysis?.summary && (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {monthAnalysis.summary}
                </p>
              )}
            </div>
            <Link
              to="/bills"
              className="flex items-center justify-end gap-1 text-sm text-slate-500"
            >
              查看月账单
              <ChevronRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
