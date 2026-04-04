import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
    <div className="space-y-4">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          文章推荐
        </h2>
        <p className="mt-1 text-sm text-slate-500">按话题拉取推荐内容。</p>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-4">
          <form
            className="flex flex-col gap-3"
            onSubmit={handleAddTopic}
          >
            <Input
              value={newTopic}
              onChange={(event) => setNewTopic(event.target.value)}
              placeholder="添加话题，例如 AI、前端开发、英语学习"
            />
            <Button type="submit" disabled={adding || !newTopic.trim()}>
              <Plus className="h-4 w-4" />
              {adding ? "添加中…" : "添加话题"}
            </Button>
          </form>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
              placeholder="搜索话题或内容"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => refreshAll(false)}
              disabled={globalLoading || topics.length === 0}
            >
              <RefreshCw
                className={cn("h-4 w-4", globalLoading && "animate-spin")}
              />
              刷新
            </Button>
            <Button
              className="flex-1"
              onClick={() => refreshAll(true)}
              disabled={globalLoading || topics.length === 0}
            >
              强制刷新
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {topics.length === 0 ? (
              <span className="text-sm text-slate-500">还没有话题。</span>
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

      <div className="grid gap-3">
        {filteredTopics.map((topic) => {
          const recommendation = recommendations[topic.name];
          const loading = Boolean(loadingByTopic[topic.name]);

          return (
            <Card key={topic.id} className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{topic.name}</CardTitle>
                    {recommendation?.aiInsight && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-violet-700">
                        <Sparkles className="h-4 w-4" />
                        <span>有 AI 洞察</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadRecommendation(topic.name, false)}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", loading && "animate-spin")}
                    />
                    刷新
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!recommendation && !loading && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    还没有推荐，点击刷新开始加载。
                  </div>
                )}

                {loading && (
                  <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    正在加载…
                  </div>
                )}

                {recommendation?.aiInsight && !loading && (
                  <div className="rounded-2xl bg-violet-50 px-4 py-3 text-sm leading-7 text-violet-900">
                    {recommendation.aiInsight}
                  </div>
                )}

                {recommendation?.articles?.length ? (
                  <div className="space-y-3">
                    {recommendation.articles.map((article) => (
                      <a
                        key={`${topic.name}-${article.url}`}
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-950">
                              {article.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {article.source}
                            </p>
                          </div>
                          <ExternalLink className="mt-0.5 h-4 w-4 text-slate-400" />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
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
