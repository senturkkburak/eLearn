const express = require('express'),
  passport = require("passport"),
  User = require('../models/userModel'),
  Course = require('../models/courseModel'),
  question = require('../models/question'),
  quiz = require('../models/quiz'),
  LocalStrategy = require("passport-local"),
  expressSession = require("express-session"),
  router = express.Router();
const { v4: uuidv4 } = require("uuid");
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


router.get("/liveSession", (req, res) => {
  res.redirect(`liveSession/${uuidv4()}`);
})

router.get("/liveSession/:room", (req, res) => {
  res.render("liveSession", { roomId: req.params.room });
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
  const userProfile = req.user;
  res.render('profile', { userProfile: userProfile });
});


function isTeacher(req, res, next) {
  const teacherboolean = req.user.role
  if (req.isAuthenticated() && teacherboolean == 1) {
    return next();
  } else {
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
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    username: req.body.username,
    password: req.body.password,
    role: '0'
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
router.get("/teacher", isLoggedIn, isTeacher, (req, res) => {
  const cu = req.user._id;
  Course.find({ courseOwner: cu }, (err, myCourses) => {
    if (err) {
      console.log("====ERROR====")
      console.log(err);
    } else {
      res.render("teacher", { myCourses: myCourses })
    }
  });
})
router.get("/categories", isLoggedIn, (req, res) => {
  res.send("Category Page");
});
router.get("/signout", (req, res) => {
  req.logout();
  res.redirect("/");
});
router.get("/newCourse", isLoggedIn, isTeacher, (req, res) => {
  const cid = req.params.courseId;
  res.render('course/newCourse', { cid: cid });
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
    courseOwner: req.user._id
  }

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
  const cidd = req.params.courseId
  const idcompare = req.params.courseId;
  Course.findById(cidd)
    .then((foundCourse) => {

      gfs.files.find({ courseInfo: idcompare }).toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
          res.render('course/showCourse', { foundCourse: foundCourse, files: false });
        } else {
          files.map(file => {
            if (
              // file.contentType === 'image/png' || file.contentType === 'image/jpg' || file.contentType === 'image/jpeg'  
              file.contentType === 'video/mp4'
            ) {
              file.isVideo = true;
            } else {
              file.isVideo = false;
            }

          });

          res.render('course/showCourse', { foundCourse: foundCourse, files: files });
        }

      });

    })
  // .catch((err) => {
  //   console.log("====ERROR====")
  //   console.log(err);
  //   res.send(err);
  // })
});
router.get("/teacherCourses/:courseId", isLoggedIn, (req, res) => {
  const cidd = req.params.courseId
  Course.findById(cidd)
    .then((foundCourse) => {
      res.render("course/teacherCourse", { foundCourse: foundCourse });
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
        const courseInfo = "test";
        const videoTitle = "test"
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
          courseInfo: courseInfo,
          videoTitle: videoTitle
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });



// @route GET /
// @desc Loads form
router.get('/putVideo/:courseId', isLoggedIn, isTeacher, (req, res) => {
  const cid = req.params.courseId;
  res.render('course/putVideo', { cid: cid });
});

router.get('/addQuiz/:courseId', isLoggedIn, (req, res) => {

  const cidd = req.params.courseId
res.render("course/addQuiz", { cid: cidd } );

});

router.post("/addQuiz/:courseId" , (req,res)=>{

  const cid=req.params.courseId;
  var obj = {
    courseId: cid,
    questionname: req.body.questionname,
    firstoption: req.body.firstoption,
    secondoption: req.body.secondoption,
    thirdoption: req.body.thirdoption,
    fourthoption:req.bodyfourthoption
    }

  quiz.create(obj)
    .then((obj) => {
      console.log(obj);
     

    })
    .catch((err) => {
      console.log("====ERROR====");
      console.log(err);
      res.send(err);
    });
    res.redirect("/teacherCourses/"+cid);
})

router.post("/showVideo/:videoNam", (req, res) => {
 // res.json(req.body);
 const videoNam=req.params.videoNam;

  var obj = {
    questionOwner:req.user.firstname,
    questionVid:videoNam,
    questionTitle:req.body.questionTitle,
    questionBody:req.body.questionBody,
    qAnswerCount:0,
    qLikeCount:0
  }




  question.create(obj)
    .then((obj) => {
      console.log(obj);
     

    })
    .catch((err) => {
      console.log("====ERROR====");
      console.log(err);
      res.send(err);
    });
    res.redirect(req.get('referer'));
  
});


// @route POST /upload
// @desc  Uploads file to DB
router.post('/putVideo/:cid', upload.single('file'), (req, res) => {

  const cid = req.params.cid;
  const videoid = req.file.filename;
  const videoTitle = req.body.videoN;

  gfs.files.findOne({ filename: videoid }).then(() => gfs.files.updateOne(
    { filename: videoid },
    { $set: { courseInfo: cid, videoTitle: videoTitle } }

  ))
  console.log("okey", cid, videoid)

  res.render('course/putVideo', { cid: cid })
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
router.get('/video/:videoNam', (req, res) => {
  gfs.files.findOne({ filename: req.params.videoNam }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'video/mp4') {
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
router.get('/showVideo/video/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'video/mp4') {
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

router.get('/showVideo/:videoNam', (req, res) => {
  const videoNam = req.params.videoNam;
  question.find({questionVid:videoNam}, (err, foundQuestions) => {
    if (err) {
      console.log("====ERROR====")
      console.log(err);
    } else {
      res.render("course/showVideo", { foundQuestions: foundQuestions, videoNam: videoNam  })
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
  const courseId = req.params.courseId;
  res.render("payment.ejs", { courseId: courseId })
})
router.get("/payment/success/:courseId", (req, res) => {
  const courseId = req.params.courseId;
  const currentU = req.user._id;
  const firstname = req.user.firstname;
  const lastname = req.user.lastname;
  const username = req.user.username;
  const participant = { _id: req.user._id, firstname: firstname, lastname: lastname, username: username };
  Course.findOne({ _id: courseId }, (err, foundCourse) => {
    if (err) {
      console.log("====ERROR====")
      console.log(err);
    } else {

      User.findOne({ _id: currentU }).then(() => User.updateOne(
        { _id: currentU },
        { $push: { purchased: foundCourse } })).then(Course.findOne({ _id: courseId }).then(() => Course.updateOne(
          { _id: courseId },
          { $push: { courseParticipant: participant } }
        )))


    }
  });
  res.redirect("/myCourses")
});


router.get("/myCourses", isLoggedIn, (req, res) => {
  const cu = req.user._id;
  User.findOne({ _id: cu }, (err, purchasedCourses) => {
    if (err) {
      console.log("====ERROR====")
      console.log(err);
    } else {
      res.render("my-course", { purchasedCourses: purchasedCourses })
    }
  });

});

router.get("/quiz", (req, res) => {
  res.render("quiz.ejs");
})

router.get("/videolist/:courseId", isLoggedIn, (req, res) => {
  const cidd = req.params.courseId
  const idcompare = req.params.courseId;
  Course.findById(cidd)
    .then((foundCourse) => {

      gfs.files.find({ courseInfo: idcompare }).toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
          res.render('/videos', { foundCourse: foundCourse, files: false });
        } else {
          files.map(file => {
            if (
              // file.contentType === 'image/png' || file.contentType === 'image/jpg' || file.contentType === 'image/jpeg'  
              file.contentType === 'video/mp4'
            ) {
              file.isVideo = true;
            } else {
              file.isVideo = false;
            }

          });

          res.render('videos', { foundCourse: foundCourse, files: files });
        }

      });
      
    });
  });


  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
  }


  module.exports = router;

