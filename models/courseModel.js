const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CourseSchema = new Schema({
	
	courseName: { type: String, require: true},
	courseDescription: { type: String, require: true },
	coursePrice: { type: Number, require: true },
        // courseOwner:{type: String},
        date: {type: Date, default:Date.now}
	},
	{ collection: 'courses' }
)

const model = mongoose.model('CourseSchema', CourseSchema)

module.exports = model
