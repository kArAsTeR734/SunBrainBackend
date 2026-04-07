import UserModel from '../models/user-model.js';

class UserService {
  static async getUserByEmail(email) {
    const user = await UserModel.findByEmail(email);

    if(!user){
      return {
        isUserExists: false,
      };
    }

    return {
      isUserExists:true
    };
  }
}

export default UserService;