export interface ReadingArticle {
  id: string;
  title: string;
  source: string;
  level: "A2" | "B1" | "B2";
  publishedAt: string;
  topic: string;
  summary: string;
  segments: string[];
}

export interface SyncEnglishReadingPayload {
  article: ReadingArticle;
  tags: string[];
  savedWords: string[];
  savedSentences: string[];
  deepReading: string;
}

export interface SyncEnglishReadingResponse {
  ok?: boolean;
  pageId?: string;
}

export async function syncEnglishReading(
  payload: SyncEnglishReadingPayload,
): Promise<SyncEnglishReadingResponse> {
  const response = await fetch("/api/notion/english-reading/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "同步失败");
  }

  return data;
}
