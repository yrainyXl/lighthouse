import axios from 'axios';

export interface Topic {
  id: number;
  name: string;
  created_at: string;
}

export interface Article {
  title: string;
  url: string;
  source: string;
  snippet: string;
}

export interface TopicRecommendation {
  topic: string;
  articles: Article[];
  aiInsight: string | null;
  cached: boolean;
}

export async function fetchTopics(): Promise<Topic[]> {
  const resp = await axios.get('/api/interests/topics');
  return resp.data.topics ?? [];
}

export async function addTopic(name: string): Promise<Topic> {
  const resp = await axios.post('/api/interests/topics', { name });
  return resp.data.topic;
}

export async function deleteTopic(id: number): Promise<void> {
  await axios.delete(`/api/interests/topics/${id}`);
}

export async function fetchRecommendation(
  topic: string,
  forceRefresh = false,
): Promise<TopicRecommendation> {
  const resp = await axios.post('/api/interests/recommend', {
    topic,
    forceRefresh,
  });
  return resp.data;
}
