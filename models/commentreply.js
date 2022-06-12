const mongoose = require("mongoose")
const Schema = mongoose.Schema

const commentreplySchema = new Schema({

    replyOwnerF:{type:String,require:true},
    replyOwnerL:{type:String,require:true},
    date:{type:String, default:Date.now},
    reply:{type:String,require:true},
    courseId:{type:String,require:true},
    commentId:{type:String,require:true}
    
},
    {collection:'commentreply'}
)

const model = mongoose.model("commentreplySchema",commentreplySchema)

module.exports = model