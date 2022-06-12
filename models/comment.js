const mongoose = require("mongoose")
const Schema = mongoose.Schema

const commentSchema = new Schema({
    //username biz çekicez
    //star attribute u olucak
    date:{type:Date , default:Date.now},
    //date otomatik
    comment:{type:String , require:true},
    username:{type:String , require:true},
    surname:{type:String,require:true},
    coursename:{type:String , require:true},
    courseowner:{type:String , require:true},
    courseId:{type:String,require:true}
    //comment itself
    //like dislike
},
    {collection: 'comment'}
)

const model = mongoose.model('commentSchema' , commentSchema)

module.exports = model