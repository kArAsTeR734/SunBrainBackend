import HomeworkModel from '../models/homework-model.js';
import {
  normalizeLatexText,
  normalizeTaskContent,
  normalizeSvg
} from '../utils/task-content-utils.js';

class HomeworkService {
  static mapTaskResponse(task, index) {
    const normalizedTask = normalizeTaskContent(task.content, task.original_tex);
    const taskPayload = normalizedTask.payload;
    const questionLatex = normalizedTask.originalTex || normalizedTask.content;

    return {
      id: task.id,
      number: index + 1,
      question: normalizedTask.content,
      questionLatex,
      solutionLatex:
        normalizeLatexText(taskPayload?.solutionLatex || task.solution || '') ||
        null,
      answerLatex:
        normalizeLatexText(taskPayload?.answerLatex || task.correct_answer || '') ||
        null,
      imageSvg: normalizeSvg(taskPayload?.imageSvg) || null,
      difficulty: task.difficulty || null,
      points: task.points
    };
  }

  static async getMyHomeworks(userId) {

    const homeworks = await HomeworkModel.getUserHomeworks(userId);

    return {
      homeworks: homeworks.map(hw => ({
        id: hw.id,
        title: hw.title,
        subject: hw.subject,
        deadline: hw.deadline,
        tasksCount: hw.tasks_count
      }))
    };
  }

  static async getHomework(homeworkId) {

    const homework = await HomeworkModel.getHomeworkById(homeworkId);

    const tasks = await HomeworkModel.getHomeworkTasks(homeworkId);

    return {
      id: homework.id,
      title: homework.title,
      deadline: homework.deadline,

      topic: {
        id: homework.topic_id,
        number: homework.topic_number,
        name: homework.topic_name,
        code: homework.topic_code
      },

      tasks: tasks.map((task, index) => this.mapTaskResponse(task, index))
    };
  }

}

export default HomeworkService;
