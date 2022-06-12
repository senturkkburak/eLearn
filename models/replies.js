const mongoose = require("mongoose")
const Schema = mongoose.Schema

const replySchema = new Schema({

    replyOwner:{type:String,require:true},
    replyVid:{type:String,require:true},
    date:{type:String, default:Date.now},
    replyTitle:{type:String,require:true},
    replyBody:{type:String,require:true},
    questionId:{type:String},
    rLikeCount:{type:Number}
    
},
    {collection:'reply'}
)

const model = mongoose.model("replySchema",replySchema)

module.exports = model