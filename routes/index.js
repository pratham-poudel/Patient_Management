var express = require("express");
var router = express.Router();
const userModel = require("./users");
const upload = require("./multer");
const passport = require("passport");
const localStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const LabReport = require("./lab"); // Import your LabReport model
const patient = require("./patient");
const Appointment = require("./appointment")
const nodemailer = require('nodemailer');


passport.use(new localStrategy(userModel.authenticate()));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'aptikpandey9@gmail.com',
    pass: 'wmzs tcal qhlg kmkd',
  },
});

// Define a function to send email
async function sendEmail(to, subject, text) {
  try {
    // Compose the email
    const mailOptions = {
      from: 'aptikpandey9@gmail.com',
      to: to,
      subject: subject,
      text: text,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}















router.post(
  "/edit",
  isLoggedIn,
  upload.single("file"),
  async function (req, res) {
    if (!req.file) {
      return res.status(400).send("No files were uploaded");
    }
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    user.nickname = req.body.nickname;
    user.bio = req.body.bio;
    user.profilePic = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);

router.post("/register", function (req, res) {
  var userdata = new userModel({
    username: req.body.username,
    medicalname: req.body.medicalname,
    nickname: req.body.username,
    fullName: req.body.name,
    email: req.body.email,
    password: req.body.password,
    connumber: req.body.connumber,
    address: req.body.address,
  });

  userModel
    .register(userdata, req.body.password)
    .then(function (registereduser) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile");
      });
    });
});

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});
router.get("/login", function (req, res, next) {
  res.render("login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/",
  }),
  function (req, res) {
    res.render("index");
  }
);

router.get("/register", function (req, res, next) {
  res.render("register");
});

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("patient patientlab appointment");
  console.log(user)
  res.render("profile", { user });
});

router.get("/edit", function (req, res, next) {
  res.render("edit");
});

router.get("/change", function (req, res, next) {
  res.render("change");
});

router.post("/change", async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  if (req.body.newpassword != req.body.confirmnewpassword) {
    res.send("Error New Password was not confirmed due to typo");
  } else if (req.body.currentpassword != user.password) {
    res.send("Current Password Did Not Match");
  } else if (
    req.body.currentpassword == user.password &&
    req.body.newpassword == req.body.confirmnewpassword
  ) {
    user.password = req.body.newpassword;
    await user.save();
    res.redirect("/logout");
  }
});

router.get("/lreport", function (req, res, next) {
  res.render("lreport", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
});
router.post("/submitLabReport", async function (req, res) {
  const doctor = await userModel.findOne({
    username: req.session.passport.user,
  });
  console.log(doctor.connumber);
  const labReport = new LabReport({
    patientName: req.body.patientName,
    email:req.body.email,
    age: req.body.age,
    dname: doctor.fullName,
    connumber: doctor.connumber,
    medicalname: doctor.medicalname,
    address: doctor.address,
    gender: req.body.gender,
    bloodpressure: req.body.bloodpressure,
    glucose: req.body.glucose,
    cholesterol: req.body.cholesterol,
    triglycerides: req.body.triglycerides,
    creatinine: req.body.creatinine,
    urea: req.body.urea,
    alt: req.body.alt,
    ast: req.body.ast,
    alkalinePhosphatase: req.body.alkalinePhosphatase,
    totalBilirubin: req.body.totalBilirubin,
    sodium: req.body.sodium,
    potassium: req.body.potassium,
    chloride: req.body.chloride,
    totalProtein: req.body.totalProtein,
    albumin: req.body.albumin,
    globulin: req.body.globulin,

    hdlCholesterol: req.body.hdlCholesterol,
    ldlCholesterol: req.body.ldlCholesterol,
    vldlCholesterol: req.body.vldlCholesterol,

    hemoglobin: req.body.hemoglobin,
    whiteBloodCells: req.body.whiteBloodCells,
    plateletCount: req.body.plateletCount,
    doctor: doctor._id,
  });
  doctor.patientlab.push(labReport._id)
  await doctor.save();
  try {
    await labReport.save();
    console.log(labReport);
    await sendEmail(labReport.email, 'Lab Report', `Hey ${labReport.patientName} Your Lab Report ID is ${labReport._id}`);
    req.flash("success", "Patient Data Recorded successfully");
    res.redirect("/lreport"); // Redirect to the desired page
  } catch (error) {
    req.flash("error", "Patient Data Failed to record");
    res.redirect("/lreport"); // Redirect to the desired page
  }
});

router.get("/search", function (req, res, next) {
  res.render("search");
});

router.get("/username/:username", async function (req, res, next) {
  const regex = new RegExp(`^${req.params.username}`, "i");
  const users = await LabReport.find({ patientName: regex });
  res.json(users);
});

router.get("/patient/:patientId", isLoggedIn, async function (req, res, next) {
  const regex = req.params.patientId;
  const users = await LabReport.findOne({ _id: regex });
  const doctor = await userModel.findOne({
    username: req.session.passport.user,
  });

  res.render("report", { users, doctor });
});

router.get("/patient", function (req, res, next) {
  res.render("patient", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });
});
router.post("/patient", async function (req, res) {
  const doctors = await userModel.findOne({
    username: req.session.passport.user,
  });
  const userdata = await new patient({
    name: req.body.name,
    email:req.body.email,
    dname: doctors.fullName,
    medicalname: doctors.medicalname,
    age: req.body.age,
    gender: req.body.gender,
    symptoms: req.body.symptoms,
    medicinesUsed: req.body.medicinesUsed,
    doctor: doctors._id
  });
  doctors.patient.push(userdata._id);
  await doctors.save();
  try {
    await userdata.save();
    await sendEmail(userdata.email, 'Patient ID',`Your Patient Id is ${userdata._id}` );
    console.log(doctors);

    console.log(userdata);

    req.flash("success", "Patient Data Recorded successfully");
    res.redirect("/patient"); // Redirect to the desired page
  } catch (error) {
    req.flash("error", "Patient Data Failed to record");
    res.redirect("/patient"); // Redirect to the desired page
  }
});


router.get("/searchmedical", function (req, res, next) {
  res.render("searchmedical");
});
router.get("/daktar", async function (req, res, next) {
  doctors = await userModel.find()
  console.log(doctors)
  res.render('daktars', { doctors })
});


router.get("/name/:username",isLoggedIn, async function (req, res, next) {
  const regex = new RegExp(`^${req.params.username}`, "i");
  const users = await patient.find({ name: regex });
  res.json(users);
});

router.get("/birami/:patientId", isLoggedIn, async function (req, res, next) {
  const regex = req.params.patientId;
  const users = await patient.findOne({ _id: regex });


  res.render("medical-report", { users });
});


router.get("/profile/:id", isLoggedIn, async function (req, res, next) {
  const regex = req.params.id;
  const users = await patient.findOne({ _id: regex });
  res.render("medical-report", { users });
});
//for accept
router.get("/appnt/:data",isLoggedIn,async function(req,res,next){
  const regex = req.params.data;
  const users =  await Appointment.findOne({_id:regex});
  await sendEmail(users.email, 'Appointment Accepted', 'Your appointment has been accepted.');

  users.accepted=true;
  await users.save();
  res.redirect("/viewappoint")

})
//for decline
router.get("/appnts/:datas",isLoggedIn,async function(req,res,next){
  const regex = req.params.datas;
  const users =  await Appointment.findOne({_id:regex});
  users.accepted=false;
  await users.save();
  await sendEmail(users.email, 'Appointment Declined', 'Your appointment has been declined.');
  res.redirect("/viewappoint")

})

router.get("/profiles/:id", isLoggedIn, async function (req, res, next) {
  const regex = req.params.id;
  const users = await LabReport.findOne({ _id: regex });
  const doctor = await userModel.findOne({
    username: req.session.passport.user,
  });

  res.render("report", { users, doctor });
});

router.get("/appointment", async function(req,res,next){
  res.render("appoint",{
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });

})

router.post("/appointments", async function(req, res, next) {
  try {
    const doctor = await userModel.findOne({
      fullName: { $regex: new RegExp(req.body.doctorName, 'i') }
    });

    const appointment = new Appointment({
      patientName: req.body.patientName,
      doctorName: req.body.doctorName,
      appointmentDate: req.body.appointmentDate,
      notes: req.body.notes,
      connumber: req.body.connumber,
      email: req.body.email,
      severityLevel: req.body.severityLevel
    });

    doctor.appointment.push(appointment._id);
    await doctor.save();

    console.log(doctor);

    await appointment.save();

    // Send email only if severityLevel is Moderate or High
    if (appointment.severityLevel.toLowerCase() === "moderate" || appointment.severityLevel.toLowerCase() === "high") {
      await sendEmail(doctor.email, 'EMERGENCY APPOINTMENT FOR YOU', `A patient named ${appointment.patientName} with ${appointment.severityLevel} condition is waiting for you to approve their appointment`);
    }

    req.flash("success", "Your Appointment Has been taken under review");
    res.redirect("/appointment");
  } catch (error) {
    req.flash("error", "Sorry, appointment booking failed");
    res.redirect("/appointment");
  }
});

router.get("/viewappoint", async function(req,res,next){
  const doctor = await userModel.findOne({
    username : req.session.passport.user
  }).populate("appointment")
  console.log(doctor)
  
  res.render("allappns",{doctor})
})
router.get("/ptrpt", async function(req,res,next){
  res.render("patientuserid")
})
router.get("/llm", async function(req,res,next){
  res.render("labuserid")
})
router.post("/submitpatient",async function(req,res,next){
  const regex = req.body.userId;
  const users = await patient.findOne({ _id: regex });
  res.render("patientpr",{users})
})
router.post("/submitreport",async function(req,res,next){
  const regex = req.body.userId;
  const users = await LabReport.findOne({ _id: regex });
  res.render("patientrp",{users})
})
router.get("/daktars", async function(req,res,next){
  res.redirect('/daktar')
})
module.exports = router;
