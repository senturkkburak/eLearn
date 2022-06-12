const mongoose = require('mongoose')
const Schema = mongoose.Schema

const notificationSchema = new Schema({

	coursename: { type: String, require: true },
	videoname: { type: String, require: true },
	
	username: { type: String, require: true },
	
	date: { type: Date, default: Date.now }
},
	{ collection: 'notification' }
)

const model = mongoose.model('notificationSchema', notificationSchema)

module.exports = model