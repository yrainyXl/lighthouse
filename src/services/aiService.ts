import axios from 'axios';

interface AiService {
  analyzeNotionData: (data: any) => Promise<string>;
  aggregateInterests: (topics: string[]) => Promise<any>;
}

export class AiServiceImpl implements AiService {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async analyzeNotionData(data: any): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个数据分析助手，负责分析Notion记账数据并生成汇总报告。'
            },
            {
              role: 'user',
              content: `请分析以下Notion记账数据并生成汇总报告：${JSON.stringify(data)}`
            }
          ],
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing data with AI:', error);
      throw error;
    }
  }

  async aggregateInterests(topics: string[]): Promise<any> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个信息聚合助手，负责收集和整理用户感兴趣的信息。'
            },
            {
              role: 'user',
              content: `请为以下话题收集最新信息：${topics.join(', ')}`
            }
          ],
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error aggregating interests with AI:', error);
      throw error;
    }
  }
}

export default AiServiceImpl;