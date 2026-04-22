import { OpenAI } from 'openai';
import {normalizeLatexText} from "../utils/task-content-utils.js";

const HOMEWORK_SYSTEM_PROMPT = `
You generate math homework tasks for exam preparation.
Return strictly valid JSON and nothing else.

Expected JSON format:
{
  "title": "Short homework title",
  "tasks": [
    {
      "difficulty": "easy | medium | hard",
      "statementLatex": "task statement in KaTeX-friendly LaTeX/plain text",
      "solutionLatex": "step-by-step solution in KaTeX-friendly LaTeX/plain text",
      "answerLatex": "final short answer as text",
      "imageSvg": "<svg>...</svg> or null"
    }
  ]
}

Rules:
1. Return exactly 15 tasks.
2. Difficulty split must be exactly 5 easy, 5 medium, 5 hard.
3. statementLatex / solutionLatex / answerLatex must be clean text (no one-symbol-per-line formatting).
4. Use imageSvg only when the task really needs a visual (graph/geometry/diagram).
5. If the statement references a graph, figure, diagram, or drawing, imageSvg must be a valid standalone SVG.
6. If you cannot provide a valid SVG, rewrite the task so it can be solved without a figure.
7. No external links in imageSvg.
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
Subject: ${subjectName}
Exam task number: ${taskNumber}
Topic name: ${topicName}

Generate homework for a student who made mistakes in this task number.
Need exactly ${
      tasksPerDifficulty * REQUIRED_DIFFICULTIES.length
    } tasks: ${tasksPerDifficulty} easy, ${tasksPerDifficulty} medium, ${tasksPerDifficulty} hard.
Each task must include a detailed solution and final answer.
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

  hasVisualDependency(statementLatex) {
    const normalized = String(statementLatex || '').toLowerCase();

    return /(по график|на рисун|по рисун|диаграмм|чертеж|схем|graph|figure|diagram|plot|drawing)/i.test(
      normalized
    );
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

      const statementLatex = normalizeLatexText(
        String(task?.statementLatex || task?.questionLatex || '')
      );
      const solutionLatex = normalizeLatexText(String(task?.solutionLatex || ''));
      const answerLatex = normalizeLatexText(
        String(task?.answerLatex || task?.answer || '')
      );
      const imageSvg = normalizeSvg(task?.imageSvg);

      if (!statementLatex || !solutionLatex || !answerLatex) {
        throw new Error('AI returned incomplete task data');
      }

      if (this.hasVisualDependency(statementLatex) && !imageSvg) {
        throw new Error(
          'AI returned a visually-dependent task without imageSvg'
        );
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

    const title = normalizeLatexText(String(payload.title || ''));

    return {
      title: title || 'AI homework',
      tasks
    };
  }
}

const aiService = new AIService();

export default aiService;
