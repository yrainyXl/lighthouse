import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
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
import {
  addTopic,
  deleteTopic,
  fetchRecommendation,
  fetchTopics,
  type Topic,
  type TopicRecommendation,
} from "../services/interestsApi";
import { cn } from "../components/ui/utils";

export function Articles() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recommendations, setRecommendations] = useState<
    Record<string, TopicRecommendation>
  >({});
  const [loadingByTopic, setLoadingByTopic] = useState<Record<string, boolean>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  const loadTopics = useCallback(async () => {
    try {
      const nextTopics = await fetchTopics();
      setTopics(nextTopics);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const loadRecommendation = useCallback(
    async (topicName: string, forceRefresh = false) => {
      setLoadingByTopic((current) => ({ ...current, [topicName]: true }));

      try {
        const recommendation = await fetchRecommendation(topicName, forceRefresh);
        setRecommendations((current) => ({
          ...current,
          [topicName]: recommendation,
        }));
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : `加载「${topicName}」推荐失败`,
        );
      } finally {
        setLoadingByTopic((current) => ({ ...current, [topicName]: false }));
      }
    },
    [],
  );

  const refreshAll = useCallback(
    async (forceRefresh = false) => {
      if (topics.length === 0) {
        return;
      }

      setGlobalLoading(true);
      await Promise.allSettled(
        topics.map((topic) => loadRecommendation(topic.name, forceRefresh)),
      );
      setGlobalLoading(false);
    },
    [loadRecommendation, topics],
  );

  const handleAddTopic = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = newTopic.trim();
    if (!name) {
      return;
    }

    setAdding(true);
    setError(null);

    try {
      await addTopic(name);
      setNewTopic("");
      await loadTopics();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTopic = async (topic: Topic) => {
    try {
      await deleteTopic(topic.id);
      setTopics((current) => current.filter((item) => item.id !== topic.id));
      setRecommendations((current) => {
        const next = { ...current };
        delete next[topic.name];
        return next;
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  };

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) {
      return topics;
    }

    const keyword = searchQuery.toLowerCase();
    return topics.filter((topic) => {
      const recommendation = recommendations[topic.name];
      return (
        topic.name.toLowerCase().includes(keyword) ||
        recommendation?.articles.some(
          (article) =>
            article.title.toLowerCase().includes(keyword) ||
            article.snippet.toLowerCase().includes(keyword),
        )
      );
    });
  }, [recommendations, searchQuery, topics]);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
              真实兴趣推荐流
            </Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              文章推荐
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
              以旧版兴趣聚合的数据流为准，把话题管理、AI 洞察和刷新流程统一到新的响应式页面里。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "当前话题", value: String(topics.length) },
              {
                label: "已加载推荐",
                value: String(Object.keys(recommendations).length),
              },
              {
                label: "状态",
                value: globalLoading ? "刷新中" : "待命",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card className="border-white/70 bg-white/85">
        <CardHeader>
          <CardTitle>话题管理</CardTitle>
          <CardDescription>保留旧版“先定义话题，再拉取推荐”的使用路径。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={handleAddTopic}
          >
            <Input
              value={newTopic}
              onChange={(event) => setNewTopic(event.target.value)}
              placeholder="输入新话题，例如 AI、前端开发、语言学习"
            />
            <Button type="submit" disabled={adding || !newTopic.trim()}>
              <Plus className="h-4 w-4" />
              {adding ? "添加中…" : "添加话题"}
            </Button>
          </form>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
                placeholder="搜索话题或推荐内容"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => refreshAll(false)}
                disabled={globalLoading || topics.length === 0}
              >
                <RefreshCw
                  className={cn("h-4 w-4", globalLoading && "animate-spin")}
                />
                刷新推荐
              </Button>
              <Button
                onClick={() => refreshAll(true)}
                disabled={globalLoading || topics.length === 0}
              >
                强制刷新
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {topics.length === 0 ? (
              <div className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500">
                还没有话题，先添加一个开始。
              </div>
            ) : (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <span>{topic.name}</span>
                  <button
                    type="button"
                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    aria-label={`删除话题 ${topic.name}`}
                    onClick={() => handleDeleteTopic(topic)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredTopics.map((topic) => {
          const recommendation = recommendations[topic.name];
          const loading = Boolean(loadingByTopic[topic.name]);

          return (
            <Card key={topic.id} className="border-white/70 bg-white/85">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-sky-700" />
                    {topic.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    通过 `/api/interests/recommend` 拉取该话题的推荐文章和 AI 洞察。
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recommendation && (
                    <Badge
                      variant="outline"
                      className={cn(
                        recommendation.cached
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800",
                      )}
                    >
                      {recommendation.cached ? "缓存结果" : "最新结果"}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => loadRecommendation(topic.name, false)}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", loading && "animate-spin")}
                    />
                    {loading ? "刷新中…" : "刷新"}
                  </Button>
                  <Button onClick={() => loadRecommendation(topic.name, true)} disabled={loading}>
                    强制刷新
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!recommendation && !loading && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    还没有该话题的推荐，点击“刷新”开始加载。
                  </div>
                )}

                {loading && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    正在加载「{topic.name}」的推荐内容…
                  </div>
                )}

                {recommendation?.aiInsight && !loading && (
                  <div className="rounded-3xl border border-violet-200 bg-violet-50 p-4">
                    <div className="flex items-center gap-2 text-violet-900">
                      <Sparkles className="h-4 w-4" />
                      <p className="text-sm font-medium">AI 洞察</p>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-violet-900/90">
                      {recommendation.aiInsight}
                    </p>
                  </div>
                )}

                {recommendation?.articles?.length ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {recommendation.articles.map((article) => (
                      <a
                        key={`${topic.name}-${article.url}`}
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold tracking-tight text-slate-950">
                              {article.title}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              {article.source}
                            </p>
                          </div>
                          <ExternalLink className="mt-1 h-4 w-4 text-slate-400 transition group-hover:text-slate-700" />
                        </div>
                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          {article.snippet}
                        </p>
                      </a>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
