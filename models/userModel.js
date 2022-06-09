const mongoose = require("mongoose"),
passportLocalMongoose = require("passport-local-mongoose");


const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    teacher:{type:Boolean},
    purchased:{type:Array}
},
{ collection: 'users' }
);

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);


