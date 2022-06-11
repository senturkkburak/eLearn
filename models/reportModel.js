const mongoose = require("mongoose")
const Schema = mongoose.Schema

const reportSchema = new Schema({
    reportOwner:{type:String,require:true},
    reportedVideoName:{type:String,require:true},
    courseId:{type:String,require:true},
    reason:{type:String},
    type:{type:String, require:true}  
},
    {collection:"reports"}
)

const model = mongoose.model("reportSchema",reportSchema)

module.exports = model