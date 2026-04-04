import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Check,
  Languages,
  Sparkles,
  Type,
  UploadCloud,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  syncEnglishReading,
  type ReadingArticle,
} from "../services/englishReadingApi";

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
        className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
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
    <div className="space-y-4 pb-24">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          英语阅读
        </h2>
        <p className="mt-1 text-sm text-slate-500">读文章，收藏词句，按需同步。</p>
      </section>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-3 p-4">
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
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{article.title}</p>
                    <p
                      className={`mt-1 text-xs ${
                        activeArticle?.id === article.id
                          ? "text-slate-300"
                          : "text-slate-500"
                      }`}
                    >
                      {article.source}
                    </p>
                  </div>
                  <Badge variant="outline">{article.level}</Badge>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeArticle && (
        <>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{activeArticle.title}</CardTitle>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {activeArticle.summary}
                  </p>
                </div>
                <Badge>{activeArticle.topic}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeArticle.segments.map(renderInteractiveSegment)}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <Button variant="outline" onClick={readSelection}>
                  <Type className="h-4 w-4" />
                  添加选中文本
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeepReading((current) => !current)}
                >
                  <Brain className="h-4 w-4" />
                  {showDeepReading ? "收起精读" : "显示精读"}
                </Button>
                <Button onClick={handleSync} disabled={syncing}>
                  <UploadCloud className="h-4 w-4" />
                  {syncing ? "同步中…" : "同步 Notion"}
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
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {syncMessage}
                </div>
              )}
            </CardContent>
          </Card>

          {showDeepReading && (
            <Card className="border-violet-200 bg-violet-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-violet-950">
                  <Sparkles className="h-4 w-4" />
                  精读提示
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-violet-950/90">
                <p>{activeArticle.summary}</p>
                <p>
                  重点句：“{activeArticle.segments[1]}”
                </p>
                <p>练习：请用 2 句话复述本文。</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Languages className="h-4 w-4" />
                  生词
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedWords.length === 0 ? (
                  <p className="text-sm text-slate-500">点击正文单词即可收藏。</p>
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

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Check className="h-4 w-4" />
                  句子
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedSentences.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    点击收藏整句或添加选中文本。
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
          </div>
        </>
      )}
    </div>
  );
}
