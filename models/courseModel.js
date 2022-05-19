const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CourseSchema = new Schema({
	
		coursename: { type: String, require: true},
		coursedsc: { type: String, require: true },
        price: { type: String, require: true },
        courseOwner:{type: String},
        date: {type: Date, default:Date.now}
	},
	{ collection: 'courses' }
)

const model = mongoose.model('CourseSchema', CourseSchema)

module.exports = model
