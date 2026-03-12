import HomeworkModel from '../models/homework-model.js';

class HomeworkService {

  static async getMyHomeworks(userId) {

    console.log('USER ID:', userId);

    const homeworks = await HomeworkModel.getUserHomeworks(userId);

    console.log('HOMEWORKS:', homeworks);

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

    const homework = await HomeworkModel.getHomework(homeworkId);

    const tasks = await HomeworkModel.getHomeworkTasks(homeworkId);

    return {
      id: homework.id,
      title: homework.title,
      deadline: homework.deadline,
      tasks: tasks.map((task, index) => ({
        id: task.id,
        number: index + 1,
        question: task.question,
        points: task.points
      }))
    };
  }

}

export default HomeworkService;