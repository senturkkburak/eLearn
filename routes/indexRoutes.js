const express = require('express'),
passport = require("passport"),
User=require('../models/userModel'),
Course=require('../models/courseModel'),
LocalStrategy = require("passport-local"),
expressSession=require("express-session"),
    router = express.Router();
    
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage').GridFsStorage;
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// Mongo URI
const mongoURI = 'mongodb://localhost:27017';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);







// let data = [
//     {
//         courseTitle: "bir Title",
//         courseDescription: "bir Description",
//         courseAuthor: "bir Author",
//         price: "bir fiyat"
//     },
//     {
//         courseTitle: "ikinci gun Title",
//         courseDescription: "iki Description",
//         courseAuthor: "iki Author",
//         price: "iki fiyat"
//     },
//     {
//         courseTitle: "uc Title",
//         courseDescription: "uc Description",
//         courseAuthor: "uc Author",
//         price: "uc fiyat"
//     }

// ]



router.get("/", (req, res) => {
    Course.find({},(err,foundCourses)=>{
      if(err){
        console.log("====ERROR====")
        console.log(err);
      }else{
        console.log("====All Courses====")
        console.log(foundCourses);
        res.render("home",{foundCourses:foundCourses })
      }
    });

});
router.get("/profile", isLoggedIn, (req, res) => {
  res.render('profile');
});

router.get("/login", (req, res) => {
    res.render('login');
})

router.post('/login',passport.authenticate("local",
{
    successRedirect:'/',
    failureRedirect:'/login'
}),(req,res)=>{

});

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
router.get("/teacher", isLoggedIn, (req, res) => {
    res.render('teacher');
})
router.get("/categories", isLoggedIn,(req, res) => {
    res.send("Category Page");
});
router.get("/signout",(req,res)=>{
req.logout();
res.redirect("/");
});
router.get("/newCourse",isLoggedIn, (req, res) => {
    res.render('course/newCourse');
})
router.post("/newCourse", (req, res) => {

    
    let courseName = req.body.data.courseName;
    let courseDescription = req.body.data.courseDescription;
    let coursePrice = req.body.data.coursePrice; 
    let courseCurriculum= req.body.data.courseCurriculum;
     // let courseOwner = currentUser.username;
    // let courseOwner = "adsf"

    let newCourse = { courseName:courseName , courseDescription:courseDescription, coursePrice:coursePrice,courseCurriculum:courseCurriculum/*, courseOwner:courseOwner*/};

    Course.create(newCourse)
    .then((newCourse)=>{
        console.log(newCourse);
        res.status(201).json(newCourse);
        
    })
    .catch((err)=>{
        console.log("====ERROR====");
        console.log(err);
        res.send(err);
    });
  });

  router.get("/testing", isLoggedIn,(req,res)=>{
      Course.find().then((foundCourses)=>{
          res.json(foundCourses);
      }).catch((err)=>{
        console.log(err);
        res.send(err);
      })
  })
  router.get("/courses/:courseId", isLoggedIn,(req,res)=>{
    Course.findById(req.params.courseId)
    .then((foundCourse)=>{
      res.render("course/showCourse",{foundCourse:foundCourse});
    })
    .catch((err)=>{
      console.log("====ERROR====")
      console.log(err);
      res.send(err);
    })
  });

  router.get("/example",(req,res)=>{
      res.render("example")
  })

  router.get("/putVideo", isLoggedIn,(req,res)=>{
      res.render("course/putVideo")
  })


  // Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

// @route GET /
// @desc Loads form
router.get('/putVideo', isLoggedIn, (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('course/putVideo', { files: false });
    } else {
      files.map(file => {
        if (
          file.contentType === 'video/mp4' ||
          file.contentType === 'video/webm '
        ) {
          file.isVideo = true;
        } else {
          file.isVideo = false;
        }
      });
      res.render('course/putVideo', { files: files });
    }
  });
});

// @route POST /upload
// @desc  Uploads file to DB
router.post('/putVideo', upload.single('file'), (req, res) => {
  // res.json({ file: req.file });
  res.redirect('/putVideo');
});

// @route GET /files
// @desc  Display all files in JSON
router.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// @desc  Display single file object
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

// @route GET /image/:filename
// @desc Display Image
app.get('/video/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'video/mp4' || file.contentType === 'video/webm') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/');
  });
});



function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}

module.exports = router;

