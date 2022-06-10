const mongoose = require("mongoose")
const Schema = mongoose.Schema

const examSchema = new Schema({
    courseId:{type:String,require:true},
    questionname:{type:String, require:true},
    firstoption:{type:String, require:true},
    secondoption:{type:String, require:true},
    thirdoption:{type:String, require:true},
    fourthoption:{type:String, require:true},
    
},
    {collection:"quiz"}
)

const model = mongoose.model("examSchema",examSchema)

module.exports = model