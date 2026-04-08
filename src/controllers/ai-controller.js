import {OpenAI} from "openai";
import {errorResponse, successResponse} from "../utils/ApiError.js";

export class AIController {

  static async test(req, res) {
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.artemox.com/v1',
    });

    try {
      const {messages} = req.body;

      const completion = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages,
      });

      res.status(200).json(
        successResponse(completion.choices[0].message.content)
      )
    } catch (error) {
      res.status(500).json(
        errorResponse({
        message: 'Ошибка при обращении к LLM',
        details: error?.message ?? 'Unknown error',
      }));
    }
  }
}