var express = require("express");
const mongoose = require('mongoose');
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
const QRCode = require('qrcode');
require('dotenv').config();


passport.use(new localStrategy(userModel.authenticate()));


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Define a function to send email
async function sendEmail(to, subject, html) {

  try {
    // Compose the email
    const mailOptions = {
      from: 'ppoudel_be23@thapar.edu',
      to: to,
      subject: subject,
      html: html,

    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}



//for sms
const accountSid = 'ACf2658e168878eda357afd9d3bd1485d5';
const authToken = '95fb9f479ca40c675fd2c7986a1775a1';
const twilioPhoneNumber = '+16593997115';

const client = require('twilio')(accountSid, authToken);

const sendSMS = async (to, body) => {
  try {
    const message = await client.messages.create({
      body: body,
      from: twilioPhoneNumber,
      to: to
    });

    console.log(`SMS sent. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error(`Error sending SMS: ${error.message}`);
    return false;
  }
};





































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

router.post("/register", async function (req, res) {
  var userdata = new userModel({
    username: req.body.username,
    medicalname: req.body.medicalname,
    nickname: req.body.username,
    speciality: req.body.speciality,
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
  await sendEmail(userdata.email, 'Succesfully Registered', `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Doctor Registration Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; text-align: center;">

  <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <img src="hospital_logo.png" alt="Hospital Logo" style="max-width: 100%; margin-bottom: 20px;">

    <h1 style="color: #333333;">Welcome, Dr. ${userdata.fullName}!</h1>

    <p style="color: #666666;">Congratulations! You have successfully registered on our website. You can now log in with the following credentials:</p>

    <p style="color: #333333; font-weight: bold;">Username: ${userdata.username}<br>Password: ${userdata.password}</p>

    <p style="color: #666666;">Please keep your login credentials secure. You can log in by visiting our website:</p>

    <a href="https://yourhospitalwebsite.com/login" style="display: inline-block; background-color: #007BFF; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px;">Log In Now</a>

    <p style="color: #666666; margin-top: 20px;">Thank you for choosing our hospital. We look forward to providing you with excellent service.</p>

    <p style="color: #333333; font-weight: bold; margin-top: 20px;">Best Regards,<br>[Chandrauta Hospital] Team</p>
  </div>

</body>
</html>

    `);
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

router.get("/registerbyadmin", function (req, res, next) {
  res.render("registeradmin");
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
    email: req.body.email,
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
    const qrCodeData = `https://patient-management-gs7d.onrender.com/submitreport/${labReport._id}`;
    console.log(labReport);
    await sendEmail(labReport.email, 'Lab Report', `
    
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Medical Report Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; text-align: center;">
    
      <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
        <h1 style="color: #333333;">Dear ${labReport.patientName},</h1>
    
        <p style="color: #666666;">हामी आशा गर्दछौं कि यो इमेलले तपाईंलाई राम्रो स्वास्थ्यमा भेट्टाउँछ। हामी तपाईंलाई सूचित गर्न पाउँदा खुसी छौं कि तपाईंको व्यापक प्रयोगशाला रिपोर्ट सफलतापूर्वक उत्पन्न भएको छ।</p>
    
        <p style="color: #333333;">तपाईंको रिपोर्ट पहुँच गर्न र समीक्षा गर्न, कृपया निम्न बिरामी आईडी प्रयोग गर्नुहोस्:</p>
    
        <p style="color: #333333; font-weight: bold;">तपाईंको बिरामी ID: ${labReport._id}</p>
    
        <a href="${qrCodeData}" style="display: inline-block; background-color: #007BFF; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px;">रिपोर्ट हेर्न क्लिक गर्नुहोस्</a>
    
        <p style="color: #666666; margin-top: 20px;">
        तपाईंको गोप्य चिकित्सा जानकारी सुरक्षित रूपमा पहुँच गर्नको लागि यो अद्वितीय पहिचानकर्ता महत्त्वपूर्ण छ। कृपया यसलाई गोप्य राख्नुहोस् र अरू कसैसँग साझा नगर्नुहोस्। तपाईंको गोपनीयता र सुरक्षा हाम्रो लागि अत्यन्तै महत्त्वपूर्ण छ।</p>
    
        <p style="color: #333333; font-weight: bold; margin-top: 20px;">Best Regards,<br>Chandrauta Hospital Team<br>गुणस्तरीय स्वस्थ्य सेवा हाम्रो प्रतिबद्धता !!</p>
        
      </div>
    
    </body>
    </html>
    
    
    
    
    `);
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
    email: req.body.email,
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

    // Generate QR code
    const qrCodeData = `https://patient-management-gs7d.onrender.com/submitpatient/${userdata._id}`;


    // Send email with QR code
    await sendEmail(userdata.email, 'Patient ID', `

    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medical Report Notification</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; text-align: center;">

  <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #333333;">Dear ${userdata.name},</h1>

    <p style="color: #666666;">We hope this email finds you in good health. We are pleased to inform you that your comprehensive medical report has been successfully generated.</p>

    <p style="color: #333333;">To access and review your report, please use the following Patient ID:</p>

    <p style="color: #333333; font-weight: bold;">Your Patient ID: ${userdata._id}</p>

    <a href="${qrCodeData}" style="display: inline-block; background-color: #007BFF; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px;">Click to see report</a>

    <p style="color: #666666; margin-top: 20px;">This unique identifier is crucial for securely accessing your confidential medical information. Kindly keep it confidential and do not share it with anyone else. Your privacy and security are of the utmost importance to us.</p>

    <p style="color: #333333; font-weight: bold; margin-top: 20px;">Best Regards,<br>Chandrauta Hospital Team<br>गुणस्तरीय स्वस्थ्य सेवा हाम्रो प्रतिबद्धता !!</p>
    
  </div>

</body>
</html>

    
    `);

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


router.get("/name/:username", isLoggedIn, async function (req, res, next) {
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
router.get("/appnt/:data", isLoggedIn, async function (req, res, next) {
  const regex = req.params.data;
  const users = await Appointment.findOne({ _id: regex });
  //   const recipientPhoneNumber = `+${users.connumber}`;
  //   console.log(recipientPhoneNumber)
  //   const smsBody = `Hey ${users.patientName} appointment has been accepted by Dr.${users.
  //     doctorName
  //     } pls come on the exact time as you mentioned on your appointment`;

  //  await sendSMS(recipientPhoneNumber, smsBody);


  await sendEmail(users.email, 'Appointment Accepted', `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Accepted Notification</title>
  </head>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; text-align: center;">
  
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #333333;">Appointment Accepted</h1>
  
      <p style="color: #666666;">Hey ${users.patientName},</p>
  
      <p style="color: #666666;">Your appointment has been accepted by Dr. ${users.doctorName}. Please make sure to arrive at the exact time as you mentioned on your appointment.</p>
  
      <p style="color: #333333; font-weight: bold;">Appointment Details:</p>
      <ul style="color: #666666; list-style: none; padding: 0; margin: 0;">
        <li><strong>Patient Name:</strong> ${users.patientName}</li>
        <li><strong>Doctor Name:</strong> ${users.doctorName}</li>
        <li><strong>Appointment Date:</strong> ${users.appointmentDate}</li>
        <li><strong>Severity Level:</strong> ${users.severityLevel}</li>
        <li><strong>Notes:</strong> ${users.notes || 'N/A'}</li>
        <li><strong>Contact Number:</strong> ${users.connumber || 'N/A'}</li>
      </ul>
  
      <p style="color: #666666;">If you have any questions or need further assistance, feel free to contact us at ${users.email}.</p>
  
      <p style="color: #333333; font-weight: bold; margin-top: 20px;">Best Regards,<br>Chandrauta Hospital Team<br>गुणस्तरीय स्वस्थ्य सेवा हाम्रो प्रतिबद्धता !!</p>
    </div>
  
  </body>
  </html>
  `);

  users.accepted = true;
  await users.save();
  res.redirect("/viewappoint")

})
//for decline
router.get("/appnts/:datas", isLoggedIn, async function (req, res, next) {
  const regex = req.params.datas;
  const users = await Appointment.findOne({ _id: regex });
  users.accepted = false;
  await users.save();
  await sendEmail(users.email, 'Appointment Declined', `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Rejected Notification</title>
  </head>
  <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; text-align: center;">
  
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
      <h1 style="color: #333333;">Appointment Rejected</h1>
  
      <p style="color: #666666;">Dear ${users.patientName},</p>
  
      <p style="color: #666666;">We sincerely apologize for the inconvenience caused. Unfortunately, your appointment with Dr. ${users.doctorName} has been rejected due to overlapping of time.</p>
  
      <p style="color: #666666;">To compensate for the inconvenience, we would like to offer you a discount on your next appointment. We value your trust in our services and want to ensure a positive experience for you.</p>
  
      <p style="color: #666666;">Please feel free to contact us at ${users.email} to reschedule your appointment or discuss any further concerns you may have.</p>
  
      <p style="color: #333333; font-weight: bold; margin-top: 20px;">We appreciate your understanding and look forward to serving you better in the future.</p>
  
      <p style="color: #333333; font-weight: bold;">Best Regards,<br>Chandrauta Hospital Team<br>गुणस्तरीय स्वस्थ्य सेवा हाम्रो प्रतिबद्धता !!</p>
    </div>
  
  </body>
  </html>
  `);
  res.redirect("/viewappoint")

})

//for remove
const ObjectId = require('mongoose').Types.ObjectId;
router.get("/toremove/:datass", isLoggedIn, async function (req, res, next) {
  const regex = req.params.datass;

  const patientss = await Appointment.findOne({ _id: regex });



  const docs = await userModel.findOne({ username: req.session.passport.user })
  await sendEmail(patientss.email, `Thank You for Choosing ${docs.medicalname} for Your Recent Checkup`, `
  
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
      }
  
      .container {
        max-width: 600px;
        margin: 0 auto;
      }
  
      h1 {
        color: #333;
      }
  
      p {
        color: #555;
      }
  
      .footer {
        margin-top: 20px;
        color: #777;
      }
    </style>
    <title>Thank You for Choosing ${docs.medicalname}</title>
  </head>
  
  <body>
    <div class="container">
      <h1>Thank You for Choosing ${docs.medicalname} for Your Recent Checkup</h1>
  
      <p>Dear ${patientss.patientName},</p>
  
      <p>
        I hope this email finds you in good health. On behalf of the entire team at ${docs.medicalname}, I would like to express our sincere gratitude for choosing our medical services for your recent checkup.
      </p>
  
      <p>
        It was our pleasure to have you as our valued patient, and we trust that your experience with us was positive and satisfactory. We understand that selecting a healthcare provider is a significant decision, and we are honored that you entrusted us with your health and well-being.
      </p>
  
      <p>
        Our team of dedicated healthcare professionals strives to provide the highest standard of care, and your trust in our services motivates us to continually improve and exceed expectations. If you have any feedback or suggestions regarding your experience, we would greatly appreciate hearing from you. Your input helps us enhance the quality of our services and ensures that we meet the needs of our patients.
      </p>
  
      <p>
        Once again, thank you for choosing ${docs.medicalname}. We look forward to serving you in the future and being a part of your healthcare journey.
      </p>
  
      <p>Wishing you continued good health and well-being.</p>
  
      <p class="footer">Warm regards,<br>
        Dr.${docs.fullName}<br>
        ${docs.speciality}<br>
        ${docs.medicalname}<br>
        ${docs.connumber}
      </p>
    </div>
  </body>
  
  </html>
  

  
  
  `);
  const appointmentIdToRemove = new ObjectId(regex);
  console.log(appointmentIdToRemove)
  console.log(docs.appointment)
  await userModel.updateOne(
    { username: req.session.passport.user },
    { $pull: { appointment: appointmentIdToRemove } }
  );




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

router.get("/appointment", async function (req, res, next) {
  const users = await userModel.find()
  console.log(users)
  res.render("appoint", {
    users: users,
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
  });

})

router.post("/appointments", async function (req, res, next) {
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
      await sendEmail(doctor.email, 'EMERGENCY APPOINTMENT FOR YOU', `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Patient Appointment Notification</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
          }
      
          p {
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
          }
      
          .container {
            background-color: #ffffff;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
      
          h1 {
            color: #007BFF;
            font-size: 24px;
            margin-bottom: 20px;
          }
      
          .note {
            color: #666666;
            margin-top: 10px;
          }
        </style>
      </head>
      <body style="font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
        <div style="background-color: #ffffff; max-width: 600px; margin: 20px auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <h1 style="color: #007BFF; font-size: 24px; margin-bottom: 20px;">Hey Dr. ${doctor.fullName},</h1>
          
          <p style="color: #333333; font-size: 16px; line-height: 1.6;">
            A patient named ${appointment.patientName} with a ${appointment.severityLevel} health condition is waiting for you to approve their appointment.
          </p>
              
          <p style="color: #666666; margin-top: 10px;">Note: ${appointment.notes}</p>
          
          <p style="color: #007BFF; font-weight: bold; margin-top: 20px; font-size: 16px; line-height: 1.6;">Your dedication to patient care is highly appreciated. Thank you for your commitment to providing excellent healthcare!</p>
        </div>
      </body>
      </html>
      
      `);
    }

    req.flash("success", "Your Appointment Has been taken under review");
    res.redirect("/appointment");
  } catch (error) {
    req.flash("error", "Sorry, appointment booking failed");
    res.redirect("/appointment");
  }
});

router.get("/viewappoint", async function (req, res, next) {
  const doctor = await userModel.findOne({
    username: req.session.passport.user
  }).populate("appointment")
  console.log(doctor)

  res.render("allappns", { doctor })
})
router.get("/ptrpt", async function (req, res, next) {
  res.render("patientuserid")
})
router.get("/llm", async function (req, res, next) {
  res.render("labuserid")
})
router.post("/submitpatient", async function (req, res, next) {
  const userId = req.body.userId;
  const user = await patient.findOne({ _id: userId });

  // Check if the user is found
  if (user) {
    // Redirect to /submitpatient/userId
    res.redirect(`/submitpatient/${userId}`);
  } else {
    // Handle case when user is not found, you might want to render an error page or redirect to a different page
    res.status(404).send("User not found");
  }
});
router.get("/submitpatient/:userId", async function (req, res, next) {
  const userId = req.params.userId;
  // Fetch the user data or perform any other necessary operations
  const users = await patient.findOne({ _id: userId });

  // Render the patientpr template with the user data
  res.render("patientpr", { users });
});
router.post("/submitreport", async function (req, res, next) {
  const regex = req.body.userId;
  const users = await LabReport.findOne({ _id: regex });
  if (users) {
    // Redirect to /submitpatient/userId
    res.redirect(`/submitreport/${users._id}`);
  } else {
    // Handle case when user is not found, you might want to render an error page or redirect to a different page
    res.status(404).send("User not found");
  }
  
});
router.get("/submitreport/:userId",async function(req,res,next){
  const userId = req.params.userId;
  // Fetch the user data or perform any other necessary operations
  const users = await LabReport.findOne({ _id: userId });

  // Render the patientpr template with the user data
  res.render("patientrp", { users });


});
router.get("/daktars", async function (req, res, next) {
  res.redirect('/daktar')
})





const allMedicines = [
  'Acetaminophen',
  'Aspirin',
  'Ibuprofen',
  'Lisinopril',
  'Simvastatin',
  'Levothyroxine',
  'Metformin',
  'Atorvastatin',
  'Amlodipine',
  'Omeprazole',
  'Amoxicillin',
  'Losartan',
  'Gabapentin',
  'Sertraline',
  'Hydrochlorothiazide',
  'Metoprolol',
  'Escitalopram',
  'Aspirin',
  'Clopidogrel',
  'Furosemide',
  'Diazepam',
  'Alprazolam',
  'Fluoxetine',
  'Citalopram',
  'Pantoprazole',
  'Ranitidine',
  'Ciprofloxacin',
  'Doxycycline',
  'Hydrocodone/Acetaminophen',
  'Oxycodone/Acetaminophen',
  'Tramadol',
  'Warfarin',
  'Metoprolol',
  'Albuterol',
  'Fluticasone/Salmeterol',
  'Montelukast',
  'Insulin (Various Types)',
  'Atenolol',
  'Risperidone',
  'Aripiprazole',
  'Duloxetine',
  'Venlafaxine',
  'Lorazepam',
  'Clonazepam',
  'Carvedilol',
  'Valsartan',
  'Pioglitazone',
  'Sitagliptin',
  'Esomeprazole',
  'Dexamethasone',
  'Ezetimibe',
  'Celecoxib',
  'Naproxen',
  'Metoclopramide',
  'Methylphenidate',
  'Lansoprazole',
  'Meloxicam',
  'Hydralazine',
  'Phenytoin',
  'Divalproex',
  'Levetiracetam',
  'Olanzapine',
  'Quetiapine',
  'Ipratropium/Albuterol',
  'Budesonide/Formoterol',
  'Latanoprost',
  'Tiotropium',
  'Ropinirole',
  'Pregabalin',
  'Fluconazole',
  'Amiodarone',
  'Digoxin',
  'Nitroglycerin',
  'Hydromorphone',
  'Morphine',
  'Lisinopril/Hydrochlorothiazide',
  'Sildenafil',
  'Tadalafil',
  'Finasteride',
  'Levonorgestrel/Ethinyl Estradiol',
  'Drospirenone/Ethinyl Estradiol',
  'Cyclobenzaprine',
  'Alendronate',
  'Raloxifene',
  'Latuda',
  'Lurasidone',
  'Metronidazole',
  'Hydroxychloroquine',
  'Prednisone',
  'Methylprednisolone',
  'Acyclovir',
  'Valacyclovir',
  'Cephalexin',
  'Amoxicillin/Clavulanate',
  'Ceftriaxone',
  'Cefuroxime',
  'Famotidine',
  'Ondansetron',
  'Metoclopramide',
  'Sumatriptan',
  'Naproxen',
  'Ketorolac',
  'Mometasone',
  'Desloratadine',
  'Loratadine',
  'Oxcarbazepine',
  'Nortriptyline',
  'Zolpidem',
  'Zopiclone',
  'Amitriptyline',

];


router.get('/suggestions', (req, res) => {
  console.log('Received suggestion request');
  const input = req.query.input.toLowerCase();

  // Filter medicines that start with the input
  const suggestions = allMedicines.filter(medicine => medicine.toLowerCase().startsWith(input));
  console.log('Suggestions:', suggestions);
  res.json(suggestions);
});






module.exports = router;
