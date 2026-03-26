import axios from 'axios';

interface NotionService {
  queryDatabase: (databaseId: string, filter?: any) => Promise<any>;
}

export class NotionServiceImpl implements NotionService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async queryDatabase(databaseId: string, filter?: any): Promise<any> {
    try {
      const response = await axios.post(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        { filter },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error querying Notion database:', error);
      throw error;
    }
  }
}

export default NotionServiceImpl;