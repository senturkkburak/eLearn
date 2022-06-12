const mongoose = require("mongoose")
const Schema = mongoose.Schema

const questionSchema = new Schema({
    questionOwner:{type:String,require:true},
    questionVid:{type:String,require:true},
    date:{type:String, default:Date.now},
    questionTitle:{type:String,require:true},
    questionBody:{type:String,require:true},
    qAnswerCount:{type:Number},
    qLikeCount:{type:Number}
    
},
    {collection:'question'}
)

const model = mongoose.model("questionSchema",questionSchema)

module.exports = model