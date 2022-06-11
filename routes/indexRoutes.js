const express = require('express'),
  passport = require("passport"),
  User = require('../models/userModel'),
  Course = require('../models/courseModel'),
  question = require('../models/question'),
  quiz = require('../models/quiz'),
  reports = require('../models/reportModel'),
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

// function isParticipant(req, res, next) {
//   const participant = req.user._id;

//   if (req.isAuthenticated()) {
//     if(){
//       return next();
//     }else {
//       res.redirect("/")
//     }
    
//   } else {
//     res.redirect("/")
//   }
// }

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
  const cu = req.user.username;
  Course.find({ courseOwner: cu }, (err, myCourses) => {
    if (err) {
      console.log("====ERROR====")
      console.log(err);
    } else {
      res.render("teacher", { myCourses: myCourses })
    }
  });
});

router.get("/applyTeacher", isLoggedIn, (req, res) => {
  const user=req.user.username;
  const role=req.user.role;
  var isAppliedBefore=[];
  if(role==0){
  gfs.files.find({ uID: user }).toArray((err, files) => {
    
    files.forEach( (file)=>{
      if(file.uID.includes(user)){
        isAppliedBefore.push(file)
      }  
    });
       res.render("applyteacher",{isAppliedBefore:isAppliedBefore})
    });
  }
});
router.get("/cancelApplication",isLoggedIn,(req,res)=>{
  const username=req.user.username;
  
  User.findOne({ "username": username }).then(() => gfs.files.findOneAndDelete(
      { "uID": username }
    ))
    res.redirect("/applyTeacher")
});



router.get("/signout", isLoggedIn,(req, res) => {
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


router.post("/newCourse", isLoggedIn, isTeacher, (req, res, next) => {


  var obj = {
    
    courseName: req.body.data.courseName,
    courseDescription: req.body.data.courseDescription,
    coursePrice: req.body.data.coursePrice,
    courseCurriculum: req.body.data.courseCurriculum,
    courseOwner: req.user.username
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
  const cu=req.user.username;
  const role=req.user.role;
  Course.findById(cidd)
    .then((foundCourse) => {
      const okParticipant=(foundCourse.courseParticipant).includes(cu);
      const okOwner=(foundCourse.courseOwner==cu);   

      res.render('course/showCourse', { foundCourse: foundCourse, okParticipant: okParticipant, okOwner:okOwner , role:role});
    })
 
});
router.get("/teacherCourses/:courseId", isLoggedIn, isTeacher,(req, res) => {
  const cidd = req.params.courseId
  const cu=req.user.username;
Course.findById(cidd)
    .then((found) => {
      const okOwner= (found.courseOwner==cu);
      if(okOwner==true){

         Course.findById(cidd)
        .then((foundCourse) => {
        res.render("course/teacherCourse", { foundCourse: foundCourse });
    })   
     
    }else{
      res.redirect("/")
    }
});      
    
  
});

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
        const uID="test"
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
          courseInfo: courseInfo,
          videoTitle: videoTitle,
          uID:uID
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
  const cidd = req.params.courseId
  const cu=req.user.username;
  const cid = req.params.courseId;
   Course.findById(cidd)
    .then((foundCourse) => {
      const okOwner= (foundCourse.courseOwner==cu);
      if(okOwner==true){
        res.render('course/putVideo', { cid: cid });
      }else
     res.redirect("/")
    })      
});

router.get('/addQuiz/:courseId', isLoggedIn,isTeacher, (req, res) => {
const cidd = req.params.courseId
const cu =req.user.username;

Course.findById(cidd)
    .then((found) => {
      const okOwner= (found.courseOwner==cu);
      if(okOwner==true){

        res.render("course/addQuiz", { cid: cidd } );
     
    }else{
      res.redirect("/")
    }
}); 


});

router.post("/addQuiz/:courseId",isLoggedIn,isTeacher ,(req,res)=>{

  const cid=req.params.courseId;
  var obj = {
    quizTitle:req.body.quiztitle,
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

router.post("/showVideo/:videoNam/:courseId",isLoggedIn, (req, res) => {
 // res.json(req.body);
 const cidd = req.params.courseId
  const cu=req.user.username;
  const videoNam=req.params.videoNam;
  const role=req.user.role;
  
Course.findById(cidd)
    .then((foundCourse) => {
      const okParticipant=(foundCourse.courseParticipant).includes(cu);
      const okOwner= (foundCourse.courseOwner==cu);
      if(okParticipant==true||role==3||okOwner==true){
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
    res.redirect("/showVideo/"+videoNam+"/"+cidd);
      }else
      res.redirect("/")
    })
 

  
  
});
router.post("/applyTeacher",  upload.single('file'), isLoggedIn, (req, res) => {
  const cv = req.file.filename;

  if(req.user.role==0){
    gfs.files.findOne({ filename: cv }).then(() => gfs.files.updateOne(
    { filename: cv },
    { $set: { uID: req.user.username } }
  
  )) 
  res.redirect("/applyTeacher");
  }
  else{
    res.redirect("/applyTeacher")
  }

 
});
router.get("/seeApplications",isLoggedIn,(req,res)=>{
  const role = req.user.role;
  if(role==3){
     gfs.files.find({}).toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      res.render('admin/seeapplications', { files: false});
    } else {
      files.map(file => {
        if (
          // file.contentType === 'image/png' || file.contentType === 'image/jpg' || file.contentType === 'image/jpeg'  
          file.contentType === 'application/pdf'
        ) {
          file.isCV = true;
        } else {
          file.isCV = false;
        }

      });
      console.log(files)
      res.render('admin/seeapplications', { files: files});
    }

  });
  }else{
    res.redirect("/")
  }
 

});


router.get("/downloadCV/:filename",isLoggedIn,(req,res)=>{
  const role =req.user.role
  if(role==3){
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file

    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
  if (file.contentType === 'application/pdf') {
    // Read output to browser
    const readStream = gridfsBucket.openDownloadStream(file._id);
    readStream.pipe(res);
    
  } else {
    res.status(404).json({
      err: 'Not an image'
    });
  }
  
});
  }else{
    res.redirect("/")
  }
  

});
router.get("/accept/:username",(req,res)=>{
  const username=req.params.username;
  const role=req.user.role;
  if(role==3){
  User.findOne({ "username": username }).then(() => User.updateOne(
    { "username": username },
    { $set: { "role": "1" } })).then(() => gfs.files.findOneAndDelete(
      { "uID": username }
    ))
    res.redirect("/seeApplications")
  }else{
    res.redirect("/")
  }
});

router.get("/decline/:username",(req,res)=>{
  const role=req.user.role;
  const username=req.params.username;
  if(role==3){
    User.findOne({ "username": username }).then(() => User.updateOne(
    { "username": username },
    { $set: { "role": "0" } })).then(() => gfs.files.findOneAndDelete(
      { "uID": username }
    ))
    res.redirect("/seeApplications")
  }else{
    res.redirect("/")
  }
  
});

// @route POST /upload
// @desc  Uploads file to DB
router.post('/putVideo/:cid', upload.single('file'),isLoggedIn,isTeacher, (req, res) => {

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

// // @route GET /files
// // @desc  Display all files in JSON
// router.get('/files', (req, res) => {
//   gfs.files.find().toArray((err, files) => {
//     // Check if files
//     if (!files || files.length === 0) {
//       return res.status(404).json({
//         err: 'No files exist'
//       });
//     }

//     // Files exist
//     return res.json(files);
//   });
// });

// // @route GET /files/:filename
// // @desc  Display single file object
// router.get('/files/:filename', (req, res) => {
//   gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
//     // Check if file
//     if (!file || file.length === 0) {
//       return res.status(404).json({
//         err: 'No file exists'
//       });
//     }
//     // File exists
//     return res.json(file);
//   });
// });

// @route GET /image/:filename
// @desc Display Image
router.get('/video/:videoNam',isLoggedIn, (req, res) => {
  const role=req.user.role;
  gfs.files.findOne({ filename: req.params.videoNam }, (err, file) => {
    // Check if file


    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    const cidd = file.courseInfo;
  const cu=req.user.username;
Course.findById(cidd)
    .then((foundCourse) => {
      const okParticipant=(foundCourse.courseParticipant).includes(cu);
      const okOwner= (foundCourse.courseOwner==cu);

      if(okParticipant==true || okOwner==true || role==3){
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
      }else
      res.redirect("/")
    })
    
  });
});

router.get('/showVideo/video/:filename',isLoggedIn, (req, res) => {
  const role=req.user.role
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    console.log(file.courseInfo);

const cidd = file.courseInfo
  const cu=req.user.username;
Course.findById(cidd)
    .then((foundCourse) => {
      const okParticipant=(foundCourse.courseParticipant).includes(cu);
      const okOwner= (foundCourse.courseOwner==cu);
      
      if(okParticipant==true || okOwner==true || role=="3"){
            if (file.contentType === 'video/mp4') {
      // Read output to browser
      const readStream = gridfsBucket.openDownloadStream(file._id);
      readStream.pipe(res);
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }


      }else
      res.redirect("/")
    })


    /////////////
   
    ////////////////////
  });
});

router.get('/showVideo/:videoNam/:courseId',isLoggedIn, (req, res) => {
  const videoNam = req.params.videoNam;
  const cidd = req.params.courseId
  const cu=req.user.username;
  const role=req.user.role;

Course.findById(cidd)
    .then((foundCourse) => {
      const okParticipant=(foundCourse.courseParticipant).includes(cu);
      const okOwner= (foundCourse.courseOwner==cu);
      if(okParticipant==true || okOwner==true || role==3){
      question.find({questionVid:videoNam}, (err, foundQuestions) => {
    if (err) {
      console.log("====ERROR====")
      console.log(err);
    } else {
      res.render("course/showVideo", { foundQuestions: foundQuestions, videoNam: videoNam ,okParticipant:okParticipant, cidd:cidd,role:role})
    }
      });
      }else
    res.redirect("/")
    })
});

// // @route DELETE /files/:id
// // @desc  Delete file
// app.delete('/files/:id', (req, res) => {
//   gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
//     if (err) {
//       return res.status(404).json({ err: err });
//     }

//     res.redirect('/');
//   });
// });

router.get("/payment/:courseId", (req, res) => { 
  const courseId = req.params.courseId;
  const cu=req.user.username;
  Course.findById(courseId)
  .then((foundCourse) => {
    const okParticipant=(foundCourse.courseParticipant).includes(cu);
    const okOwner= (foundCourse.courseOwner==cu);
    if(okParticipant==false && okOwner==false){
      res.render("payment.ejs", { courseId: courseId })
    }else{
      res.redirect("/")
    }
    
  })
  
})
router.get("/payment/success/:courseId", (req, res) => {
  const courseId = req.params.courseId;
  const currentU = req.user._id;
  const cu=req.user.username;
  Course.findById(courseId)
  .then((foundCourse) => {
    const okParticipant=(foundCourse.courseParticipant).includes(cu);
          const okOwner= (foundCourse.courseOwner==cu);
    if(okParticipant==false && okOwner==false){
      Course.findOne({ _id: courseId }, (err, foundCourse) => {
    if (err) {
      console.log("====ERROR====")
      console.log(err);
    } else {

      User.findOne({ _id: currentU }).then(() => User.updateOne(
        { _id: currentU },
        { $push: { purchased: foundCourse } })).then(Course.findOne({ _id: courseId }).then(() => Course.updateOne(
          { _id: courseId },
          { $push: { courseParticipant: cu } }
        )))


    }
  });
  res.redirect("/myCourses")
 }else{
      res.redirect("/")
    }
    
  })
  
});


router.get("/myCourses", isLoggedIn, (req, res) => {
  const cu = req.user.username;
  const myCourseArray=[];
  Course.find({}, (err, purchasedCourses) => {
    purchasedCourses.forEach( (course)=>{
      if(course.courseParticipant.includes(cu)){
        myCourseArray.push(course)
      }
      
    });
    res.render("my-course", { myCourseArray: myCourseArray})
          
        

    });
});

router.get("/quiz/:courseId",isLoggedIn, (req, res) => {
  //burada belirli course id sine sahip olan quizleri getir diyeceğiz 
  //sonra renderın içine koyup sayfada bastıracağız
  const cidd = req.params.courseId;
  quiz.find({courseId:cidd}, (err, foundQuiz) => {
    if (err) {
      console.log("====ERROR====")
      console.log(err);
    } else {
      res.render("quiz", { foundQuiz: foundQuiz,cidd:cidd})
    }
      });


})

router.get("/videolist/:courseId", isLoggedIn, (req, res) => {

  const cidd = req.params.courseId
  const idcompare = req.params.courseId;
  const cu=req.user.username;
  const role=req.user.role;
  Course.findById(cidd)
    .then((found) => {
      const okParticipant=(found.courseParticipant).includes(cu);
      const okOwner= (found.courseOwner==cu);
      if(okParticipant==true || okOwner==true || role==3){

        Course.findById(cidd)
    .then((foundCourse) => {

      gfs.files.find({ courseInfo: idcompare }).toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
          res.render('videos', { foundCourse: foundCourse, files: false ,role:role,okOwner:okOwner});
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

          res.render('videos', { foundCourse: foundCourse, files: files ,role:role,okOwner:okOwner});
        }

      });
      
    });

      }else{
        res.redirect("/");
      }
     
    })




  
  });
router.get("/quizlist/:courseId", isLoggedIn, (req, res) => {
  const cidd = req.params.courseId
  const idcompare = req.params.courseId;
  const cu=req.user.username;
  const role=req.user.role;
  
  
  Course.findById(cidd)
    .then((found) => {
      const okParticipant=(found.courseParticipant).includes(cu);
      const okOwner= (found.courseOwner==cu);
      if(okParticipant==true || okOwner==true || role==3){

        quiz.find({courseId:idcompare}, (err, quizzes) => {
          if (err) {
            console.log("====ERROR====")
            console.log(err);
          } else {
            res.render("quizzes", { quizzes: quizzes, okOwner:okOwner, cidd:cidd,role:role})
          }
            });
    //  quiz.find({ courseId: idcompare }
    //   ,(quizzes) => {
    //    console.log(quizzes);

    //       res.render('quizzes', { foundCourse: foundCourse, quizzes: quizzes });
    //   }
    //   ); 
    }
      else{
        res.redirect("/");
      }
     
    })

  });
  router.get("/signin", (req, res) => {
    res.render('admin/signin');
  })
  
  router.post('/signin', passport.authenticate("local",
    {
      successRedirect: '/admin',
      failureRedirect: '/signin'
    }), (req, res) => {
  
    });

  router.get("/admin" ,isLoggedIn, (req,res)=>{
    const isAdmin = req.user.role

    if(isAdmin!=3){
      req.logout();
      res.redirect("/login");
    }else{

    User.find({}, (err, foundUsers) => {
      if (err) {
        console.log("====ERROR====")
        console.log(err);
      } else {
        Course.find({}, (err, foundCourse) => {
          if (err) {
            console.log("====ERROR====")
            console.log(err);
          } else {
            res.render("admin/admin", { foundCourse: foundCourse , foundUsers:foundUsers})
          }
        });
      }
    });
    }
  })
  router.get("/admin/ban/:username", (req, res) => {
    const username=req.params.username;
    const role=req.user.role;
    if(role==3){
       db.collection("users").findOneAndDelete(
      { "username" : username });

    // db.collection("courses").deleteMany( { "courseOwner" : username } );

      
   
    res.redirect("/admin")
    }else{
      res.redirect("/")
    }
   
  })
  
  router.get("/admin/remove/:courseId", isLoggedIn,(req, res) => {
    const courseId=req.params.courseId;
    const role=req.user.role;
    if(role==3){
    Course.findByIdAndDelete(courseId)
      .then((foundCourse) => {
     console.log(foundCourse);
    })
    res.redirect("/admin")
  }else{
    res.redirect("/")
  }
  })

  router.get("/deleteVideo/:videoNam/:courseId", isLoggedIn,(req, res) => {
    const videoNam=req.params.videoNam;
    const cid=req.params.courseId;
    const cidd = req.params.courseId
    const cu=req.user.username;
    const role = req.user.role;
Course.findById(cidd)
    .then((foundCourse) => {
      const okOwner= (foundCourse.courseOwner==cu);
      if(okOwner==true||role==3){
           gfs.files.findOneAndDelete({ filename: videoNam });
    res.redirect("/videolist/"+cid)
      }else{
         res.redirect("/")
      }
     
    })      
    }) 

    router.get("/deleteQuiz/:quizId/:courseId", isLoggedIn,(req, res) => {
      const cid=req.params.courseId;
      const cidd = req.params.courseId
      const cu=req.user.username;
      const role = req.user.role;
      const q = req.params.quizId;
      Course.findById(cidd)
      .then((foundCourse) => {
        const okOwner= (foundCourse.courseOwner==cu);
        if(okOwner==true||role==3){
         
          quiz.findByIdAndRemove(q).then((foundQuiz)=>{

          })
        res.redirect("/quizlist/"+cid );

        }else{
           res.redirect("/")
        }
       
      })      
      });
      router.get("/deleteQuestion/:questionId/:courseId", isLoggedIn,(req, res) => {
        const cid=req.params.courseId;
        const cidd = req.params.courseId
        const cu=req.user.username;
        const role = req.user.role;
        const q = req.params.questionId;
        Course.findById(cidd)
        .then((foundCourse) => {
          const okOwner= (foundCourse.courseOwner==cu);
          if(role==3){
           
            question.findByIdAndRemove(q).then((foundQuiz)=>{
  
            })
            res.redirect(req.header('referer'));
  
          }else{
             res.redirect("/")
          }
         
        })      
        })
        router.get("/seeReports",isLoggedIn,(req,res)=>{
          const role=req.user.role;
          if(role==3){
                reports.find({}, (err, allReports) => {
                  if (err) {
                    console.log("====ERROR====")
                    console.log(err);
                  } else {
                    res.render("admin/seereports", { allReports: allReports })
                  }
                });
          }else{
            res.redirect("/")
          }
         
        });
        router.get("/reportVideo/:videoNam/:courseId",isLoggedIn,(req,res)=>{
          const videoNam =req.params.videoNam;
          const courseId=req.params.courseId;
          const reportType="video";
          res.render("reportVideo",{videoNam:videoNam,courseId:courseId,reportType:reportType})
        });

        router.post("/reportVideo/:videoNam/:courseId",isLoggedIn,(req,res)=>{
          const videoNam =req.params.videoNam;
          const courseId=req.params.courseId;
          const reportType="video";

          var obj = {
            reportOwner:req.user.username,
            courseId:courseId,
            reportedVideoName:videoNam,
            reason:req.body.reason,
            type:"video"
            }
        
          reports.create(obj)
            .then((obj) => {
              console.log(obj);
            })
            .catch((err) => {
              console.log("====ERROR====");
              console.log(err);
              res.send(err);
            });
            res.redirect("/showVideo/"+videoNam+"/"+courseId);

        });

        router.get("/concludeReport/:reportId", isLoggedIn,(req, res) => {
          const cu=req.user.username;
          const role = req.user.role;
          const q = req.params.reportId;

            if(role==3){
             
              reports.findByIdAndRemove(q).then((foundQuiz)=>{
    
              })
              res.redirect(req.header('referer'));
    
            }else{
               res.redirect("/")
            }
           
            
          });



  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
  }


  module.exports = router;

///////////////isParticipant//////////////////////////
//////////////////////////////////////////////////////
// const cidd = req.params.courseId
//   const cu=req.user.username;
// Course.findById(cidd)
//     .then((foundCourse) => {
//       const okParticipant=(foundCourse.courseParticipant).includes(cu);
//       if(okParticipant==true){
//             kurs üyesi işlemleri
//       }else
//       home'a yönlendir
//     })
///////////////////////////////////////////////////////
////////////////isCourseOwner//////////////////////////
// const cidd = req.params.courseId
//   const cu=req.user.username;
// Course.findById(cidd)
//     .then((foundCourse) => {
//       const okOwner= (foundCourse.courseOwner==cu);
//       if(okOwner==true){
//             kurs sahibi işlemleri
//       }else
//       home'a yönlendir
//     })      
//     })