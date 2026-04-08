import HomeworkModel from '../models/homework-model.js';

class HomeworkService {
  static parseTaskContent(content) {
    if (typeof content !== 'string') {
      return null;
    }

    const trimmed = content.trim();

    if (!trimmed.startsWith('{')) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  }

  static mapTaskResponse(task, index) {
    const taskPayload = this.parseTaskContent(task.content);
    const questionLatex = taskPayload?.statementLatex || task.content;

    return {
      id: task.id,
      number: index + 1,
      question: questionLatex,
      questionLatex,
      solutionLatex: taskPayload?.solutionLatex || task.solution || null,
      answerLatex: taskPayload?.answerLatex || task.correct_answer || null,
      imageSvg: taskPayload?.imageSvg || null,
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
