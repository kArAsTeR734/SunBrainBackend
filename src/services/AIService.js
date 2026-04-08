import { OpenAI } from 'openai';

const HOMEWORK_SYSTEM_PROMPT = `
Ты генерируешь домашние задания по математике.
Формат ответа: строго JSON без Markdown.

Ожидаемая структура JSON:
{
  "title": "Короткий заголовок домашки",
  "tasks": [
    {
      "difficulty": "easy | medium | hard",
      "statementLatex": "условие в LaTeX",
      "solutionLatex": "подробное решение в LaTeX",
      "answerLatex": "итоговый ответ в строковом формате, это может быть и число и буквы",
      "imageSvg": "<svg ...>...</svg> или null"
    }
  ]
}

Требования:
1. Ровно 15 задач.
2. По 5 задач каждого уровня сложности: easy, medium, hard.
3. Все формулы и текст условий/решений в LaTeX, пригодном для KaTeX.
4. imageSvg добавляй только если диаграмма действительно нужна, иначе null.
5. SVG должен быть валидным и самодостаточным (без внешних ссылок).
`;

const REQUIRED_DIFFICULTIES = ['easy', 'medium', 'hard'];

class AIService {
  constructor() {
    this.modelName = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    this.baseURL =
      process.env.BASE_DEEPSEEK_URL ||
      process.env.DEEPSEEK_BASE_URL ||
      'https://api.deepseek.com/v1';
    this.apiKey = process.env.DEEPSEEK_API_KEY;

    this.client = new OpenAI({
      apiKey: this.apiKey || 'missing-api-key',
      baseURL: this.baseURL
    });
  }

  ensureConfigured() {
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }
  }

  async chat(messages, options = {}) {
    this.ensureConfigured();

    const completion = await this.client.chat.completions.create({
      model: options.model || this.modelName,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 4096
    });

    return completion?.choices?.[0]?.message?.content || '';
  }

  async generateHomeworkByTaskNumber({
    subjectName,
    topicName,
    taskNumber,
    tasksPerDifficulty = 5
  }) {
    const userPrompt = `
      Предмет: ${subjectName}
      Тема/номер задания ЕГЭ: ${taskNumber}
      Название темы: ${topicName}
      
      Сгенерируй домашнюю работу для ученика, который ошибся в этом задании на тесте.
      Нужны: ${tasksPerDifficulty * REQUIRED_DIFFICULTIES.length} задач (${tasksPerDifficulty} easy, ${tasksPerDifficulty} medium, ${tasksPerDifficulty} hard).
      Каждая задача должна содержать подробное решение и итоговый ответ.
`;

    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const content = await this.chat(
          [
            { role: 'system', content: HOMEWORK_SYSTEM_PROMPT.trim() },
            { role: 'user', content: userPrompt.trim() }
          ],
          { temperature: 0.7, maxTokens: 8000 }
        );

        const parsed = this.parseJsonResponse(content);
        return this.normalizeHomeworkPayload(parsed, tasksPerDifficulty);
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Failed to generate AI homework: ${lastError?.message || 'Unknown error'}`
    );
  }

  parseJsonResponse(content) {
    if (!content || typeof content !== 'string') {
      throw new Error('AI returned empty response');
    }

    const cleaned = content.trim();

    try {
      return JSON.parse(cleaned);
    } catch (error) {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');

      if (start === -1 || end === -1 || end <= start) {
        throw new Error('AI did not return valid JSON');
      }

      const jsonSlice = cleaned.slice(start, end + 1);
      return JSON.parse(jsonSlice);
    }
  }

  normalizeHomeworkPayload(payload, tasksPerDifficulty) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid homework payload');
    }

    const expectedTotal = tasksPerDifficulty * REQUIRED_DIFFICULTIES.length;
    const rawTasks = Array.isArray(payload.tasks) ? payload.tasks : [];

    if (rawTasks.length !== expectedTotal) {
      throw new Error(
        `AI returned ${rawTasks.length} tasks, expected ${expectedTotal}`
      );
    }

    const tasks = rawTasks.map((task, index) => {
      const difficultyFallbackIndex = Math.floor(index / tasksPerDifficulty);
      const fallbackDifficulty =
        REQUIRED_DIFFICULTIES[difficultyFallbackIndex] || 'hard';
      const normalizedDifficulty = REQUIRED_DIFFICULTIES.includes(
        String(task?.difficulty || '').trim().toLowerCase()
      )
        ? String(task.difficulty).trim().toLowerCase()
        : fallbackDifficulty;

      const statementLatex = String(
        task?.statementLatex || task?.questionLatex || ''
      ).trim();
      const solutionLatex = String(task?.solutionLatex || '').trim();
      const answerLatex = String(task?.answerLatex || task?.answer || '').trim();
      const imageSvg = this.normalizeSvg(task?.imageSvg);

      if (!statementLatex || !solutionLatex || !answerLatex) {
        throw new Error('AI returned incomplete task data');
      }

      return {
        difficulty: normalizedDifficulty,
        statementLatex,
        solutionLatex,
        answerLatex,
        imageSvg
      };
    });

    for (const difficulty of REQUIRED_DIFFICULTIES) {
      const count = tasks.filter(task => task.difficulty === difficulty).length;
      if (count !== tasksPerDifficulty) {
        throw new Error(
          `AI returned invalid difficulty distribution for "${difficulty}"`
        );
      }
    }

    const title = String(payload.title || '').trim();

    return {
      title: title || 'AI-домашняя работа',
      tasks
    };
  }

  normalizeSvg(svgValue) {
    if (!svgValue || typeof svgValue !== 'string') {
      return null;
    }

    const cleaned = svgValue.trim();

    if (!cleaned) {
      return null;
    }

    if (!cleaned.startsWith('<svg')) {
      return null;
    }

    return cleaned;
  }
}

const aiService = new AIService();

export default aiService;
