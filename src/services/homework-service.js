import HomeworkModel from '../models/homework-model.js';

class HomeworkService {

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

      tasks: tasks.map((task, index) => ({
        id: task.id,
        number: index + 1,
        question: task.content,
        points: task.points
      }))
    };
  }

}

export default HomeworkService;