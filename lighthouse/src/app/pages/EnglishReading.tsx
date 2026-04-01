import { useEffect, useMemo, useState } from "react";
import {
  BookText,
  Brain,
  Check,
  Languages,
  Radio,
  ScrollText,
  Sparkles,
  Type,
  UploadCloud,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

interface ReadingArticle {
  id: string;
  title: string;
  source: string;
  level: "A2" | "B1" | "B2";
  publishedAt: string;
  topic: string;
  summary: string;
  segments: string[];
}

const AUTO_PULL_SOURCES = [
  { name: "News API", status: "connected", cadence: "每 30 分钟" },
  { name: "VOA Learning English RSS", status: "connected", cadence: "每 60 分钟" },
  { name: "BBC Learning English RSS", status: "connected", cadence: "每 60 分钟" },
];

const ARTICLE_POOL: ReadingArticle[] = [
  {
    id: "r1",
    title: "Why Tiny Habits Build Better English Skills",
    source: "VOA Learning English",
    level: "B1",
    publishedAt: "2026-03-30",
    topic: "Learning Methods",
    summary: "A practical article about improving language skills through small daily habits.",
    segments: [
      "Many learners think they need long study sessions, but short and focused practice often works better.",
      "If you read one short article every day and save only five useful expressions, your vocabulary will grow steadily.",
      "The key is consistency, because repeated exposure helps your brain recognize sentence patterns naturally.",
    ],
  },
  {
    id: "r2",
    title: "City Parks Are Becoming Outdoor Classrooms",
    source: "News API · Education Digest",
    level: "B2",
    publishedAt: "2026-03-29",
    topic: "Education",
    summary: "How schools use public parks for science, language, and teamwork activities.",
    segments: [
      "Teachers are bringing students outside so they can connect textbook ideas with real observations.",
      "When students describe plants, weather, and public spaces in English, they practice useful words in context.",
      "Experts say this approach improves both motivation and memory because students use multiple senses while learning.",
    ],
  },
];

export function EnglishReading() {
  const [query, setQuery] = useState("");
  const [activeArticleId, setActiveArticleId] = useState(ARTICLE_POOL[0].id);
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [savedSentences, setSavedSentences] = useState<string[]>([]);
  const [customSentence, setCustomSentence] = useState("");
  const [showDeepReading, setShowDeepReading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    const storedWords = localStorage.getItem("reading_saved_words");
    const storedSentences = localStorage.getItem("reading_saved_sentences");

    if (storedWords) {
      setSavedWords(JSON.parse(storedWords));
    }
    if (storedSentences) {
      setSavedSentences(JSON.parse(storedSentences));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("reading_saved_words", JSON.stringify(savedWords));
  }, [savedWords]);

  useEffect(() => {
    localStorage.setItem("reading_saved_sentences", JSON.stringify(savedSentences));
  }, [savedSentences]);

  const filteredArticles = useMemo(() => {
    return ARTICLE_POOL.filter((article) => {
      if (!query.trim()) {
        return true;
      }

      const keyword = query.toLowerCase();
      return (
        article.title.toLowerCase().includes(keyword) ||
        article.topic.toLowerCase().includes(keyword) ||
        article.summary.toLowerCase().includes(keyword)
      );
    });
  }, [query]);

  const activeArticle =
    filteredArticles.find((article) => article.id === activeArticleId) ?? filteredArticles[0];

  useEffect(() => {
    if (!activeArticle && filteredArticles.length > 0) {
      setActiveArticleId(filteredArticles[0].id);
    }
  }, [activeArticle, filteredArticles]);

  const toggleWord = (word: string) => {
    const normalized = word.toLowerCase();
    setSavedWords((prev) =>
      prev.includes(normalized)
        ? prev.filter((item) => item !== normalized)
        : [normalized, ...prev].slice(0, 120),
    );
  };

  const addSentence = (sentence: string) => {
    const normalized = sentence.trim();
    if (!normalized) {
      return;
    }

    setSavedSentences((prev) => (prev.includes(normalized) ? prev : [normalized, ...prev].slice(0, 80)));
  };

  const readSelection = () => {
    const selected = window.getSelection()?.toString() ?? "";
    addSentence(selected);
  };

  const addCustomSentence = () => {
    addSentence(customSentence);
    setCustomSentence("");
  };

  const syncToNotion = async () => {
    if (!activeArticle) {
      setSyncMessage("当前没有可同步的文章。");
      return;
    }

    try {
      setSyncing(true);
      setSyncMessage("");
      const deepReading = showDeepReading
        ? `Summary: ${activeArticle.summary}\nPractice: 请用 2 句话复述本文并使用 consistency / exposure。`
        : "";

      const response = await fetch("/api/notion/english-reading/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article: activeArticle,
          tags: [activeArticle.topic, "EnglishReading"],
          savedWords,
          savedSentences,
          deepReading,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "同步失败");
      }
      setSyncMessage(`已同步到 Notion，页面 ID：${data?.pageId ?? "unknown"}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "同步失败";
      setSyncMessage(message);
    } finally {
      setSyncing(false);
    }
  };

  const renderInteractiveSegment = (segment: string, index: number) => {
    const words = segment.split(/(\s+)/);
    return (
      <div key={`${activeArticle?.id}-${index}`} className="space-y-3 rounded-xl border bg-white p-4">
        <p className="text-[15px] leading-7 text-gray-800">
          {words.map((token, tokenIndex) => {
            const cleanToken = token.replace(/[^a-zA-Z']/g, "");
            if (!cleanToken) {
              return <span key={`${token}-${tokenIndex}`}>{token}</span>;
            }

            const selected = savedWords.includes(cleanToken.toLowerCase());
            return (
              <span key={`${token}-${tokenIndex}`}>
                <button
                  type="button"
                  onClick={() => toggleWord(cleanToken)}
                  className={`rounded px-0.5 transition ${
                    selected ? "bg-amber-100 text-amber-900" : "hover:bg-blue-50"
                  }`}
                >
                  {token}
                </button>
              </span>
            );
          })}
        </p>
        <Button variant="outline" size="sm" onClick={() => addSentence(segment)}>
          收藏整句
        </Button>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 pb-28 sm:space-y-6 sm:pb-10">
      <section className="rounded-2xl border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">英语阅读训练</h2>
            <p className="mt-1 text-sm text-gray-600">自动拉取文章 + 词句收藏 + AI 精读（移动端优先）</p>
          </div>
          <Badge variant="secondary" className="w-fit">MVP 实施中</Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {AUTO_PULL_SOURCES.map((source) => (
            <div key={source.name} className="rounded-xl border bg-slate-50 p-3">
              <p className="text-sm font-medium text-gray-900">{source.name}</p>
              <p className="mt-1 text-xs text-gray-600">同步频率：{source.cadence}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700">
                <Radio className="h-3.5 w-3.5" />
                {source.status}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">文章池（自动拉取）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题或主题"
            />
            <div className="space-y-2">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => setActiveArticleId(article.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    activeArticle?.id === article.id
                      ? "border-blue-300 bg-blue-50"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{article.title}</p>
                  <p className="mt-1 text-xs text-gray-600">{article.source}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Badge variant="outline">{article.level}</Badge>
                    <span>{article.publishedAt}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {activeArticle ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{activeArticle.title}</CardTitle>
                    <p className="mt-2 text-sm text-gray-600">{activeArticle.summary}</p>
                  </div>
                  <Badge>{activeArticle.topic}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">{activeArticle.segments.map(renderInteractiveSegment)}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">句子收藏（划词可用）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={readSelection}>
                    <Type className="mr-2 h-4 w-4" />
                    添加选中文本
                  </Button>
                  <Button variant="outline" onClick={() => setShowDeepReading((prev) => !prev)}>
                    <Brain className="mr-2 h-4 w-4" />
                    {showDeepReading ? "收起 AI 精读" : "生成 AI 精读"}
                  </Button>
                  <Button onClick={syncToNotion} disabled={syncing}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {syncing ? "同步中..." : "同步到 Notion"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customSentence}
                    onChange={(event) => setCustomSentence(event.target.value)}
                    placeholder="手动添加句子"
                  />
                  <Button onClick={addCustomSentence}>保存</Button>
                </div>
                {syncMessage && (
                  <p className="text-sm text-gray-600">{syncMessage}</p>
                )}
              </CardContent>
            </Card>

            {showDeepReading && (
              <Card className="border-indigo-200 bg-indigo-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-indigo-900">
                    <Sparkles className="h-4 w-4" />
                    AI 精读卡
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-indigo-950">
                  <div>
                    <p className="font-semibold">1) 主旨</p>
                    <p>{activeArticle.summary}</p>
                  </div>
                  <div>
                    <p className="font-semibold">2) 难句拆解</p>
                    <p>
                      “{activeArticle.segments[1]}” 这一句包含条件关系与结果描述，适合提炼为
                      “If..., ... will ...” 模板。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">3) 练习</p>
                    <p>请用 2 句话复述本文，并使用 consistency / exposure 两个词。</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-600">暂无匹配文章。</CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="h-4 w-4" />
              生词本
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedWords.length === 0 ? (
                <p className="text-sm text-gray-500">点击正文中的单词即可收藏。</p>
              ) : (
                savedWords.slice(0, 24).map((word) => (
                  <Badge key={word} variant="outline" className="cursor-pointer" onClick={() => toggleWord(word)}>
                    {word}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="h-4 w-4" />
              句子库
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedSentences.length === 0 ? (
              <p className="text-sm text-gray-500">点击“收藏整句”或先选中文本再添加。</p>
            ) : (
              savedSentences.slice(0, 8).map((sentence) => (
                <div key={sentence} className="rounded-lg border bg-white p-3 text-sm leading-6 text-gray-700">
                  <p>{sentence}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <div className="fixed inset-x-0 bottom-16 z-40 border-t bg-white/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <Button variant="outline" className="flex-1" onClick={readSelection}>
            <Check className="mr-1 h-4 w-4" />
            保存选中句
          </Button>
          <Button className="flex-1" onClick={() => setShowDeepReading(true)}>
            <BookText className="mr-1 h-4 w-4" />
            AI 精读
          </Button>
        </div>
      </div>
    </div>
  );
}
