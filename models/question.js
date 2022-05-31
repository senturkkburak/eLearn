const mongoose = require("mongoose")
const Schema = mongoose.Schema

const questionSchema = new Schema({
    //resim userdan çekilecek
    //user ismi çekilecek
    //date otomatik
    date:{type:String, default:Date.now},
    //soru başlığı
    questionTitle:{type:String,require:true},
    //soru içeriği
    questionBody:{type:String,require:true}
    //cevap sayısı
    //like sayısı
},
    {collection:'question'}
)

const model = mongoose.model("questionSchema",questionSchema)

module.exports = model