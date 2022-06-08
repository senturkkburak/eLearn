const express = require('express'),
  passport = require("passport"),
  User = require('../models/userModel'),
  Course = require('../models/courseModel'),
  question = require('../models/question'),
  LocalStrategy = require("passport-local"),
  expressSession = require("express-session"),
 


  router = express.Router();
  const {v4:uuidv4} = require("uuid");
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
var ObjectId = require('mongodb').ObjectId;
const GridFsStorage = require('multer-gridfs-storage').GridFsStorage;
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const formidable = require('formidable');
const fs = require('fs');
const { getVideoDurationInSeconds } = require('get-video-duration');
const { db } = require('../models/userModel');
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});



// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use("/peerjs", peerServer);


// Mongo URI
const mongoURI = 'mongodb://localhost:27017';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);


router.get("/liveSession", (req,res)=>{
  res.redirect(`liveSession/${uuidv4()}`);
})

router.get("/liveSession/:room", (req,res)=>{
  res.render("liveSession", {roomId : req.params.room});
})


io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });
  });
});



router.get("/", (req, res) => {
  Course.find({}, (err, foundCourses) => {
    if (err) {
      console.log("====ERROR====")
      console.log(err);
    } else {
      res.render("home", { foundCourses: foundCourses })
    }
  });

});
router.get("/profile", isLoggedIn, (req, res) => {
  const name=req.user.username;
  const idd=req.user._id;
  res.render('profile',{name:name,idd:idd});
});


function isTeacher(req,res,next){
  const teacherboolean=req.user.teacher
  console.log(teacherboolean)
  if (req.isAuthenticated()&&teacherboolean) {
    return next();
  }else{
    res.redirect("/")
  }
}

router.get("/login", (req, res) => {
  res.render('login');
})

router.post('/login', passport.authenticate("local",
  {
    successRedirect: '/',
    failureRedirect: '/login'
  }), (req, res) => {

  });

router.get("/register", (req, res) => {
  res.render('register');
})
router.post("/register", (req, res) => {
  const newUser = new User({
    username: req.body.username,
    password: req.body.password,
    teacher:true
  });
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/register")
    }
    passport.authenticate("local")(req, res, () => {

      res.redirect("/");
    });
  })
})
router.get("/teacher", isLoggedIn, (req, res) => {
  res.render('teacher');
})
router.get("/categories", isLoggedIn, (req, res) => {
  res.send("Category Page");
});
router.get("/signout", (req, res) => {
  req.logout();
  res.redirect("/");
});
router.get("/newCourse", isLoggedIn, (req, res) => {
  res.render('course/newCourse');
})

var storageImage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now())
  }
});
var uploadImage = multer({ storage: storageImage });


router.post("/newCourse", (req, res, next) => {


  var obj = {
    courseName: req.body.data.courseName,
    courseDescription: req.body.data.courseDescription,
    coursePrice: req.body.data.coursePrice,
    courseCurriculum: req.body.data.courseCurriculum,
    courseOwner:req.user._id
  }

  // let courseOwner = currentUser.username;
  // let courseOwner = "adsf"



  Course.create(obj)
    .then((obj) => {
      console.log(obj);
      res.status(201).json(obj);

    })
    .catch((err) => {
      console.log("====ERROR====");
      console.log(err);
      res.send(err);
    });
});


router.get("/courses/:courseId", isLoggedIn, (req, res) => {
const cidd=req.params.courseId
  Course.findById(cidd)
    .then((foundCourse) => {
      res.render("course/showCourse", { foundCourse: foundCourse});
    })
    // .catch((err) => {
    //   console.log("====ERROR====")
    //   console.log(err);
    //   res.send(err);
    // })
});




router.get("/upload", isLoggedIn, (req, res) => {
  res.render("course/upload")
})
// router.post("/upload-video", isLoggedIn, function (request, result) {
//   const formData = new formidable.IncomingForm();
//   formData.maxFileSize = 1000 * 1024 * 1024;
//   formData.parse(request, function (error, fields, files) {
//     var title = fields.title;
//     var description = fields.description;
//     var tags = fields.tags;
//     var category = fields.category;

//     var oldPathThumbnail = files.thumbnail.filepath;
//     var thumbnail = "./views/thumbnails/" + new Date().getTime() + "-" +
//       files.thumbnail.filename;
//     fileSystem.rename(oldPathThumbnail, thumbnail, function (error) {
//       //
//     });
//     var oldPathVideo = files.video.filepath;
//     var newPath = "./views/videos/" + new Date().getTime() + "-" + files
//       .video.filename;
//     fileSystem.rename(oldPathVideo, newPath, function (error) {
//       //
//       getUser(isLoggedIn, function (user) {
//         var currentTime = new Date().getTime();
//         getVideoDurationInSeconds(newPath).then(function (duration) {
//           var hours = Math.floor(duration / 60 / 60);
//           var minutes = Math.floor(duration / 60) - (hours * 60);
//           var seconds = Math.floor(duration % 60);
//           db.collection("videos").insertOne({

//             "filePath": newPath,
//             "thumbnail": thumbnail,
//             "title": title,
//             "description": description,
//             "tags": tags,
//             "category": category,
//             "createdAt": currentTime,
//             "minutes": minutes,
//             "seconds": seconds,
//             "hours": hours,
//             "watch": currentTime,
//             "views": 0,
//             "playlist": "",
//             "likers": [],
//             "dislikers": [],
//             "comments": []
//           }, function (error, data) {

//           });
//           result.redirect("/");
//         });
//       });
//     });
//   });
// });

router.get("/example", (req, res) => {
  res.render("example")
})




// Init gfs
let gfs;
//const conn = mongoose.connection;
conn.once('open', () => {
    // Add this line in the code
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
    });
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});
/*
conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});*/

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
        const courseInfo="test";
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
          courseInfo:courseInfo
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

router.get("/showVideo" , isLoggedIn , (req,res)=>{
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('course/showVideo', { files: false });
    } else {
      files.map(file => {
        if (
         // file.contentType === 'image/png' || file.contentType === 'image/jpg' || file.contentType === 'image/jpeg'  
          file.contentType === 'video/mp4'
        ) {
          file.isVideo = true;
        } else {
          file.isVideo= false;
        }
      });
      res.render('course/showVideo', { files: files });
    }
  });
})
router.get("/showVideo/:courseId",isLoggedIn,(req,res)=>{
  const idcompare=req.params.courseId;
    gfs.files.find({courseInfo:idcompare}).toArray((err, files) => {
      // Check if files
      if (!files || files.length === 0) {
        res.render('course/showVideo', { files: false });
      } else {
        files.map(file => {
          if (
           // file.contentType === 'image/png' || file.contentType === 'image/jpg' || file.contentType === 'image/jpeg'  
            file.contentType === 'video/mp4'
          ) {
            file.isVideo = true;
          } else {
            file.isVideo= false;
          }
          
        });
        res.render('course/showVideo', { files: files});
      }
      
    });
  
  });



// @route GET /
// @desc Loads form
router.get('/putVideo/:courseId', isLoggedIn,(req, res) => {
const cid=req.params.courseId;
  res.render('course/putVideo',{cid:cid});
});


router.post("/showVideo" , (req,res) => {
  console.log(req.body.data)
/*
  var obj = {
    questionTitle: req.body.data.questionTitle,
    
    questionBody: req.body.data.questionBody,
   
  }

  // let courseOwner = currentUser.username;
  // let courseOwner = "adsf"



  question.create(obj)
    .then((obj) => {
      console.log(obj);
      res.status(201).json(obj);

    })
    .catch((err) => {
      console.log("====ERROR====");
      console.log(err);
      res.send(err);
    });*/
});


// @route POST /upload
// @desc  Uploads file to DB
router.post('/putVideo/:cid', upload.single('file'), (req, res) => {
  const cid=req.params.cid;
  const videoid=req.file.filename;

  gfs.files.findOne({ filename: videoid }).then(() => gfs.files.updateOne(
    {  filename: videoid},
    { $set: { courseInfo: cid } }))
  console.log("okey",cid,videoid)

  res.redirect('/')
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
router.get('/files/:filename', (req, res) => {
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
router.get('/video/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if ( file.contentType === 'video/mp4' ) {
      // Read output to browser
      const readStream = gridfsBucket.openDownloadStream(file._id);
    readStream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});
router.get('/showVideo/:courseId/video/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if ( file.contentType === 'video/mp4' ) {
      // Read output to browser
      const readStream = gridfsBucket.openDownloadStream(file._id);
    readStream.pipe(res);
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

router.get("/payment/:courseId", (req, res) => {
  const courseId=req.params.courseId;
  res.render("payment.ejs",{courseId:courseId})
})
router.get("/payment/success/:courseId", (req,res)=>{
    const courseId=req.params.courseId;
    const currentU=req.user._id;
    User.findOne({ _id: currentU }).then(() => User.updateOne(
      {  _id: currentU},
      { $push: { purchased: courseId } }))
      res.redirect("/")
  
});

router.get("/myCourses", isLoggedIn,(req, res) => {
  const cu=req.user._id;
  Course.find({courseOwner:cu}, (err, myCourses) => {
    if (err) {
      console.log("====ERROR====")
      console.log(err);
    } else {
      res.render("my-course", { myCourses: myCourses })
    }
  });
})



function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}


module.exports = router;

