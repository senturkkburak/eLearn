const mongoose = require("mongoose"),
passportLocalMongoose = require("passport-local-mongoose");


const UserSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:{type:String},
    purchased:{type:Array}
},
{ collection: 'users' }
);

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);


