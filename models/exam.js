const mongoose = require("mongoose")
const Schema = mongoose.Schema

const examSchema = new Schema({
    questionTitle:{type:String, require:true},
    option1:{type:String, require:true},
    option2:{type:String, require:true},
    option3:{type:String, require:true},
    option4:{type:String, require:true},
    
},
    {collection:"exam"}
)

const model = mongoose.model("examSchema",examSchema)

module.exports = model