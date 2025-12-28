export default class UserController{
    static async getUsers(req, res,next) {
        try{
            res.json(['123',124412]);
        }
        catch (e){
            res.status(500).json({error: e});
        }
    }
}