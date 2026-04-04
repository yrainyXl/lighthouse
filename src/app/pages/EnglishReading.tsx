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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  syncEnglishReading,
  type ReadingArticle,
} from "../services/englishReadingApi";

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
    localStorage.setItem(
      "reading_saved_sentences",
      JSON.stringify(savedSentences),
    );
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
    filteredArticles.find((article) => article.id === activeArticleId) ??
    filteredArticles[0];

  useEffect(() => {
    if (!activeArticle && filteredArticles.length > 0) {
      setActiveArticleId(filteredArticles[0].id);
    }
  }, [activeArticle, filteredArticles]);

  const toggleWord = (word: string) => {
    const normalized = word.toLowerCase();
    setSavedWords((current) =>
      current.includes(normalized)
        ? current.filter((item) => item !== normalized)
        : [normalized, ...current].slice(0, 120),
    );
  };

  const addSentence = (sentence: string) => {
    const normalized = sentence.trim();
    if (!normalized) {
      return;
    }

    setSavedSentences((current) =>
      current.includes(normalized)
        ? current
        : [normalized, ...current].slice(0, 80),
    );
  };

  const readSelection = () => {
    const selectedText = window.getSelection()?.toString() ?? "";
    addSentence(selectedText);
  };

  const addCustomSentence = () => {
    addSentence(customSentence);
    setCustomSentence("");
  };

  const handleSync = async () => {
    if (!activeArticle) {
      setSyncMessage("当前没有可同步的文章。");
      return;
    }

    try {
      setSyncing(true);
      setSyncMessage("");

      const deepReading = showDeepReading
        ? `Summary: ${activeArticle.summary}\nPractice: 请用 2 句话复述本文，并使用 consistency / exposure。`
        : "";

      const response = await syncEnglishReading({
        article: activeArticle,
        tags: [activeArticle.topic, "EnglishReading"],
        savedWords,
        savedSentences,
        deepReading,
      });

      setSyncMessage(`已同步到 Notion，页面 ID：${response.pageId ?? "unknown"}`);
    } catch (reason) {
      setSyncMessage(
        reason instanceof Error ? reason.message : "同步到 Notion 失败",
      );
    } finally {
      setSyncing(false);
    }
  };

  const renderInteractiveSegment = (segment: string, index: number) => {
    const words = segment.split(/(\s+)/);

    return (
      <div
        key={`${activeArticle?.id}-${index}`}
        className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4"
      >
        <p className="text-[15px] leading-8 text-slate-800">
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
                    selected ? "bg-amber-100 text-amber-900" : "hover:bg-sky-100"
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
    <div className="space-y-6 pb-24 sm:pb-8">
      <section className="rounded-[30px] border border-slate-200 bg-white/85 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">
              Remote 能力已并入
            </Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              英语阅读训练
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
              自动拉取文章、词句收藏、AI 精读和 Notion 同步都收口到同一套移动优先页面里。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={readSelection}
              >
                <Type className="h-4 w-4" />
                添加选中文本
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setShowDeepReading((current) => !current)}
              >
                <Brain className="h-4 w-4" />
                {showDeepReading ? "收起 AI 精读" : "生成 AI 精读"}
              </Button>
              <Button
                className="rounded-full bg-slate-950 hover:bg-slate-800"
                onClick={handleSync}
                disabled={syncing}
              >
                <UploadCloud className="h-4 w-4" />
                {syncing ? "同步中…" : "同步到 Notion"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {AUTO_PULL_SOURCES.map((source) => (
              <div
                key={source.name}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-medium text-slate-950">
                  {source.name}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  同步频率：{source.cadence}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-700">
                  <Radio className="h-3.5 w-3.5" />
                  {source.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[310px_1fr]">
        <Card className="border-white/70 bg-white/85 xl:sticky xl:top-28 xl:h-fit">
          <CardHeader>
            <CardTitle className="text-base">文章池</CardTitle>
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
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    activeArticle?.id === article.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 hover:bg-white"
                  }`}
                >
                  <p className="text-sm font-medium">{article.title}</p>
                  <p
                    className={`mt-2 text-xs ${
                      activeArticle?.id === article.id
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {article.source}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <Badge
                      variant={activeArticle?.id === article.id ? "secondary" : "outline"}
                    >
                      {article.level}
                    </Badge>
                    <span>{article.publishedAt}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {activeArticle ? (
          <div className="space-y-4">
            <Card className="border-white/70 bg-white/85">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-3xl">
                    <CardTitle className="text-2xl tracking-tight">
                      {activeArticle.title}
                    </CardTitle>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {activeArticle.summary}
                    </p>
                  </div>
                  <Badge className="w-fit rounded-full bg-sky-100 text-sky-800 hover:bg-sky-100">
                    {activeArticle.topic}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeArticle.segments.map(renderInteractiveSegment)}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-white/70 bg-white/85">
                <CardHeader>
                  <CardTitle className="text-base">句子收藏</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={customSentence}
                      onChange={(event) => setCustomSentence(event.target.value)}
                      placeholder="手动添加句子"
                    />
                    <Button onClick={addCustomSentence}>保存</Button>
                  </div>
                  {syncMessage && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {syncMessage}
                    </div>
                  )}
                  {savedSentences.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      点击“收藏整句”或选中文本后添加。
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {savedSentences.slice(0, 8).map((sentence) => (
                        <div
                          key={sentence}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"
                        >
                          {sentence}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/70 bg-white/85">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Languages className="h-4 w-4" />
                    生词本
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {savedWords.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      点击正文中的单词即可收藏。
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {savedWords.slice(0, 30).map((word) => (
                        <Badge
                          key={word}
                          variant="outline"
                          className="cursor-pointer rounded-full bg-slate-50"
                          onClick={() => toggleWord(word)}
                        >
                          {word}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {showDeepReading && (
              <Card className="border-violet-200 bg-violet-50/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-violet-950">
                    <Sparkles className="h-4 w-4" />
                    AI 精读卡
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-violet-950/90">
                  <div>
                    <p className="font-semibold">1) 主旨</p>
                    <p>{activeArticle.summary}</p>
                  </div>
                  <div>
                    <p className="font-semibold">2) 难句拆解</p>
                    <p>
                      “{activeArticle.segments[1]}” 这一句可以提炼成
                      “If..., ... will ...” 模板，重点观察条件与结果之间的连接方式。
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">3) 练习</p>
                    <p>
                      请用 2 句话复述本文，并使用 consistency / exposure 两个词。
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="border-white/70 bg-white/85">
            <CardContent className="p-8 text-center text-sm text-slate-500">
              当前没有匹配文章。
            </CardContent>
          </Card>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-4 z-40 px-4 sm:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2 rounded-3xl border border-white/50 bg-white/90 p-3 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.5)] backdrop-blur">
          <Button variant="outline" className="flex-1" onClick={readSelection}>
            <Check className="h-4 w-4" />
            保存选中文本
          </Button>
          <Button className="flex-1 bg-slate-950 hover:bg-slate-800" onClick={() => setShowDeepReading(true)}>
            <BookText className="h-4 w-4" />
            AI 精读
          </Button>
        </div>
      </div>
    </div>
  );
}
