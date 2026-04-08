import {OpenAI} from "openai";

export class AIService {
  modelName = "DeepSeek"

  constructor() {
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.BASE_DEEPSEEK_URL
    });
  }
}