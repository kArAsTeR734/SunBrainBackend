import TopicModel from '../models/topic-model.js';

class TopicService {

  static async getTopics(subjectId) {

    const topics = await TopicModel.getTopicsBySubject(subjectId);

    return {
      topics
    };

  }

}

export default TopicService;