const { default: mongoose, model } = require("mongoose")
const PostSchema = new mongoose.Schema({
    title:String,
    description:String,
    file:String,
    email:String
})


const PostModels = mongoose.model('Posts',PostSchema)

module.exports = PostModels