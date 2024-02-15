const { default: mongoose, model } = require("mongoose")
const UserSchema = new mongoose.Schema({
    username:String,
    email:String,
    password:String,
})


const UserModels = mongoose.model('user',UserSchema)

module.exports = UserModels