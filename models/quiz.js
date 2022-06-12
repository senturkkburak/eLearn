const mongoose = require("mongoose")
const Schema = mongoose.Schema

const examSchema = new Schema({
    
    //burada quiz title ı almamıza gerek yok her kurs için bir tane quiz
    //yani bitirme sınavı yapacağız formda her bilgi eklerken quiz title ı 
    //gimrmemize gerek yok
    courseId:{type:String,require:true},
    questionname:{type:String, require:true},
    firstoption:{type:String, require:true},
    secondoption:{type:String, require:true},
    thirdoption:{type:String, require:true},
    fourthoption:{type:String, require:true},
    correctoption:{type:String,require:true}
    
},
    {collection:"quiz"}
)

const model = mongoose.model("examSchema",examSchema)

module.exports = model