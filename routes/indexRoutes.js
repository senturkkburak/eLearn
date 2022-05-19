const express = require('express'),
passport = require("passport"),
User=require('../models/userModel'),
    router = express.Router();




let data = [
    {
        courseTitle: "bir Title",
        courseDescription: "bir Description",
        courseAuthor: "bir Author",
        price: "bir fiyat"
    },
    {
        courseTitle: "ikinci gun Title",
        courseDescription: "iki Description",
        courseAuthor: "iki Author",
        price: "iki fiyat"
    },
    {
        courseTitle: "uc Title",
        courseDescription: "uc Description",
        courseAuthor: "uc Author",
        price: "uc fiyat"
    }

]



router.get("/", (req, res) => {
    res.render('home', { data: data });
})
router.get("/profile", (req, res) => {
    res.render('profile');
})

router.get("/login", (req, res) => {
    res.render('login');
})
router.post("/login", (req, res) => {

})
router.get("/register", (req, res) => {
    res.render('register');
})
router.post("/register", (req, res) => {
    
    
    const newUser = new User({
        username: req.body.username,
        password: req.body.password
     });
    User.register(newUser, req.body.password, (err, user)=>{
        if(err){
            console.log(err);
            res.redirect ("/register")
        }
        passport.authenticate("local")(req,res, ()=>{
        res.redirect("/");
        });
    })
})
router.get("/teacher", (req, res) => {
    res.render('teacher');
})
router.get("/categories", (req, res) => {
    res.send("Category Page");
})

module.exports = router;