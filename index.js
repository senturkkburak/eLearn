const mongoose = require("mongoose"),
express = require("express"),
bodyParser = require("body-parser"),
passport = require("passport"),
LocalStrategy = require("passport-local"),
expressSession=require("express-session"),
User = require('./models/userModel'),
app = express();




const { serializeUser } = require("passport/lib");
//Routes
const indexRoutes = require("./routes/indexRoutes"),
adminRoutes = require("./routes/adminRoutes");


//App Config
mongoose.connect('mongodb://localhost:27017/e-Learn');
app.set('view engine' , 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded ({extended:true}));

//Passport config
app.use(require("express-session")({
secret:"sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk",
resave:false,
saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//currentUser
app.use((req,res,next)=>{
        res.locals.currentUser=req.user;
        next();
});



//Routes Using
app.use(indexRoutes);
app.use(adminRoutes);





const server = app.listen(3000, (err)=>{
        if(err){
             console.log(err)
        }
           
        console.log('App started. Port number : %d  ', server.address().port);

})