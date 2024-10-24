var express = require("express");
const jwt = require("jsonwebtoken");

var router = express.Router();
const userModel = require("./users");
const upload = require("./multer");
const passport = require("passport");
const localStrategy = require("passport-local");

const LabReport = require("./lab"); // Import your LabReport model
const patient = require("./patient");
const Appointment = require("./appointment")
const nodemailer = require('nodemailer');
const Invoice = require("./saman");


const membership = require("./membership");
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
      from: 'chandrautahospital01@gmail.com',
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

const { GoogleGenerativeAI } = require('@google/generative-ai');
const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function run(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
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
      username: req.username,
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
  const token = await jwt.sign({ username: req.body.username }, process.env.JWT_SECRET, { expiresIn: '100y' }); // Set to a very long time if needed
  res.cookie("doctoken", token);
  await userdata.save();

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

    <a href="https://patient-management-gs7d.onrender.com/login" style="display: inline-block; background-color: #007BFF; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px;">Log In Now</a>

    <p style="color: #666666; margin-top: 20px;">Thank you for choosing our hospital. We look forward to providing you with excellent service.</p>

    <p style="color: #333333; font-weight: bold; margin-top: 20px;">Best Regards,<br>[Chandrauta Hospital] Team</p>
  </div>

</body>
</html>

    `);
  res.redirect("/profile");
});

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("welcome");
});
router.get("/adminmajau", function (req, res, next) {
  res.render("index");
});

router.get("/login", function (req, res, next) {
  res.render("login");
});




router.post("/login", async function (req, res) {
  try {
    const token = jwt.sign({ username: req.body.username }, process.env.JWT_SECRET, { expiresIn: '100y' }); // Set to a very long time if needed

    const user = await userModel.findOne({ username: req.body.username });
    res.cookie("doctoken", token);
    if (user) {
      if (user.username == req.body.username && user.password == req.body.password) {
        res.redirect("/profile");
      } else {
        res.send("Invalid Credentials")
      }
    }


  } catch (error) {
    res.send(error)
  }


});


router.get("/register", isadminLoggedIn, function (req, res, next) {
  res.render("register");
});

router.get("/registerbyadmin", function (req, res, next) {
  res.render("registeradmin");
});
router.get("/logout", isLoggedIn, function (req, res, next) {
  res.clearCookie("doctoken");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  try {
    // Check if the token is present
    if (req.cookies.doctoken) {
      // Verify the JWT token
      const decodedToken = jwt.verify(req.cookies.doctoken, process.env.JWT_SECRET);

      // Assign username or payload to the request object
      req.username = decodedToken.username; // Extract username or other payload

      // Proceed to the next middleware or route handler
      next();
    } else {
      // Redirect to login if token is not present
      res.redirect("/login");
    }
  } catch (error) {
    // If token is invalid or verification fails, redirect to login
    res.redirect("/login");
  }
}
async function isadminLoggedIn(req, res, next) {
  try {
    // Check if the token is present
    if (req.cookies.doctoken) {
      // Verify the JWT token
      const decodedToken = jwt.verify(req.cookies.doctoken, process.env.JWT_SECRET);
      const user = await userModel.findOne({ username: decodedToken.username });
      if (user.type == "admin" || user.type == "superadmin") {
        req.username = decodedToken.username; // Extract username or other payload

        // Proceed to the next middleware or route handler
        next();
      } else {
        res.send("You are not authorized to access this Route")
      }
    }
  } catch (error) {
    // If token is invalid or verification fails, redirect to login
    res.redirect("/login");
  }
}


router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.username }).populate("patient patientlab appointment");
  const patientlab = await LabReport.find();
  if (user.type == "doctor") {
    res.render("doctorprofile", { user, patientlab });
  } else if (user.type == "account") {
    res.render("accountprofile", { user });
  } else if (user.type == "admin") {
    res.render("adminprofile", { user, patientlab });
  } else if (user.type == "superadmin") {
    res.render("adminprofile", { user, patientlab });
  }


});

router.get("/edit", function (req, res, next) {
  res.render("edit");
});

router.get("/change", function (req, res, next) {
  res.render("change");
});

router.post("/change", async function (req, res, next) {
  const user = await userModel.findOne({ username: req.username });
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

router.get("/lreport", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.username });
  res.render("lreport", {
    successMessage: req.flash("success"),
    errorMessage: req.flash("error"),
    user
  });
});
router.post("/submitLabReport", isLoggedIn, async function (req, res) {
  try {
    const doctor = await userModel.findOne({
      username: req.username,
    });

    if (!doctor) {
      req.flash("error", "Doctor not found");
      return res.redirect("/lreport");
    }

    const labReport = new LabReport({
      patientName: req.body.patient_name,
      age: req.body.age,
      email: req.body.email,
      sex: req.body.sex,
      doctorName: req.body.doctor_name,
      medicalName: doctor.medicalname,
      date: req.body.date ? new Date(req.body.date) : new Date(), // Ensure date is valid
      address: req.body.address, // Use address from req.body if available
      hb: req.body.hb_result,
      tlc: req.body.tlc_result,
      basophil: req.body.basophil_result,
      dlc: req.body.dlc_result,
      poly: req.body.poly_result,
      lympho: req.body.lympho_result,
      mono: req.body.mono_result,
      eosino: req.body.eosino_result,
      esr: req.body.esr_result,
      pcv: req.body.pcv_result,
      bleedingTime: req.body.bleeding_time_result,
      clottingTime: req.body.clotting_time_result,
      pt: req.body.pt_result,
      inr: req.body.inr_result,
      plateletCount: req.body.platelet_count_result,
      reticCount: req.body.retic_count_result,
      rbcCount: req.body.rbc_count_result,
      mcv: req.body.mcv_result,
      mch: req.body.mch_result,
      mchc: req.body.mchc_result,
      bloodgroup: req.body.blood_group_result,
      crp: req.body.crp_result,
      raFactor: req.body.ra_factor_result,
      hPylori: req.body.h_pylori_result,
      hiv: req.body.hiv_result,
      hbsAgTest: req.body.hbs_ag_test_result,
      hcv: req.body.hcv_result,
      vdrl: req.body.vdrl_result,
      dengue: req.body.dengue_result,
      scrub: req.body.scrub,
      mp: req.body.mp_result,
      troponin: req.body.troponin_result,
      sTyphiO: req.body.s_typhi_o_result,
      sTyphiH: req.body.s_typhi_h_result,
      sParaTyphiAH: req.body.s_para_typhi_ah_result,
      sParaTyphiBH: req.body.s_para_typhi_bh_result,
      bloodSugarF: req.body.blood_sugar_f_result,
      bloodSugarPP: req.body.blood_sugar_pp_result,
      bloodSugarR: req.body.blood_sugar_r_result,
      fasting: req.body.fasting_result,
      firstHour: req.body.first_hour_result,
      secondHour: req.body.second_hour_result,
      thirdHour: req.body.third_hour_result,
      bloodUrea: req.body.blood_urea_result,
      serumCreatinine: req.body.serum_creatinine_result,
      serumUricAcid: req.body.serum_uric_acid_result,
      sCholesterol: req.body.s_cholesterol_result,
      sTriglycerides: req.body.s_triglycerides_result,
      vldlCholesterol: req.body.vldl_cholesterol_result,
      hdlCholesterol: req.body.hdl_cholesterol_result,
      ldlCholesterol: req.body.ldl_cholesterol_result,
      sBilirubinTotal: req.body.s_bilirubin_total_result,
      sBilirubinDirect: req.body.s_bilirubin_direct_result,
      sProteinsTotal: req.body.s_proteins_total_result,
      sAlbumin: req.body.s_albumin_result,
      ggtp: req.body.ggtp_result,
      sAlkalinePhos: req.body.s_alkaline_phos_result,
      sgpt: req.body.sgpt_result,
      sgot: req.body.sgot_result,
      sSodium: req.body.s_sodium_result,
      sPotassium: req.body.s_potassium_result,
      sChloride: req.body.s_chloride_result,
      sPhosphorous: req.body.s_phosphorous_result,
      serumCalcium: req.body.serum_calcium_result,
      hba1c: req.body.hba1c_result,
      amylase: req.body.amylase_result,
      ckMb: req.body.ck_mb_result,
      colour: req.body.colour,
      specificgravity: req.body.specificgravity,
      appearance: req.body.appearance,
      chemicalexamination: req.body.chemicalexamination,
      reaction: req.body.reaction,
      albumen: req.body.albumen,
      sugar: req.body.sugar,
      ketonebodies: req.body.ketonebodies,
      blood: req.body.blood,
      puscells: req.body.puscells,
      rbc: req.body.rbc,
      epcells: req.body.epcells,
      crystals: req.body.crystals,
      cast: req.body.cast,
      others: req.body.others,
      pregnancytest: req.body.pregnancytest,
      colourofstool: req.body.colourofstool,
      consistancyofstool: req.body.consistancyofstool,
      mucousofstool: req.body.mucousofstool,
      chemicalexaminationofstool: req.body.chemicalexaminationofstool,
      reactionofstool: req.body.reactionofstool,
      reducingsubstanceofstool: req.body.reducingsubstanceofstool,
      occultbloodofstool: req.body.occultbloodofstool,
      protozoalparasitesofstool: req.body.protozoalparasitesofstool,
      bloodofstool: req.body.bloodofstool,
      puscellsofstool: req.body.puscellsofstool,
      rbcofstool: req.body.rbcofstool,
      helmenthicparasitesofstool: req.body.helmenthicparasitesofstool,
      othersofstool: req.body.othersofstool,
      noteofstool: req.body.noteofstool,
      noteofwidaltest: req.body.noteofwidaltest,

      labAssistant: req.body.lab_assistant,
    },);

    // Save the lab report and update the doctor's patientlab
    doctor.patientlab.push(labReport._id);
    await doctor.save();
    await labReport.save();

    const qrCodeData = `https://patient-management-gs7d.onrender.com/submitreport/${labReport._id}`;

    // Send email notification
    await sendEmail(
      labReport.email,
      'Lab Report',
      `
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
      `
    );

    req.flash("success", "Patient Data Recorded successfully");
    res.redirect("/lreport"); // Redirect to the desired page
  } catch (error) {
    console.error(error);
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
    username: req.username,
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
    username: req.username,
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



  const docs = await userModel.findOne({ username: req.username })
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

  await userModel.updateOne(
    { username: req.username },
    { $pull: { appointment: appointmentIdToRemove } }
  );




  res.redirect("/viewappoint")

})














router.get("/profiles/:id", isLoggedIn, async function (req, res, next) {
  try {
    
  const regex = req.params.id;
  const users = await LabReport.findOne({ _id: regex });

  if (!users.interpretation) {
    const review = await run(`${users} This is the pathology report of a patient. Please analyze the report based only on the non-null data provided. Do not assume or infer results for any missing or null data. Provide an overall interpretation of the available results in one concise paragraph.
`);
    users.interpretation = review;
    await users.save();
  }


  res.render("report", { users });
  } catch (error) {
    res.send(error.message)
  }

});

router.get("/appointment", async function (req, res, next) {
  try {
    const users = await userModel.find(
      { type: { $in: ["doctor", "superadmin"] } }, // Include users whose type is "doctor" or "superadmin"
      { fullName: 1, speciality: 1, profilePic: 1 } // Include only fullName, speciality, and profilePic
    );
  
  
  
    res.render("appoint", {
      users: users,
      successMessage: req.flash("success"),
      errorMessage: req.flash("error"),
    });
  } catch (error) {
    res.send(error.message)
    
  }

});



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

router.get("/viewappoint", isLoggedIn, async function (req, res, next) {
  try {
    const doctor = await userModel.findOne({
      username: req.username
    }).populate("appointment")
  
  
    res.render("allappns", { doctor })
  } catch (error) {
    res.send(error.message)
    
  }
 
})
router.get("/ptrpt", async function (req, res, next) {
  res.render("patientuserid")
})
router.get("/llm", async function (req, res, next) {
  res.render("labuserid")
})
router.post("/submitpatient", async function (req, res, next) {
  const regex = req.body.userId;
  try {
    if (regex.length
      < 24 || regex.length > 24) {
      res.send("Invalid ID")
    } else {
      const user = await patient.findOne({ _id: regex });
      if (user) {

        res.redirect(`/submitpatient/${regex}`);
      } else {

        res.status(404).send("User not found");
      }
    }
  }
  catch (err) {
    res.send(err.message)
  }



});
router.get("/submitpatient/:userId", async function (req, res, next) {
  const userId = req.params.userId;
  try {
    // Fetch the user data or perform any other necessary operations
    const users = await patient.findOne({ _id: userId });

    // Render the patientpr template with the user data
    res.render("patientpr", { users });
  } catch (error) {
    res.send(error.message)
  }

});
router.post("/submitreport", async function (req, res, next) {
  const regex = req.body.userId;
  try {
    if (regex.length < 24 || regex.length > 24) {
      res.send("Invalid ID")
    } else {
      const users = await LabReport.findOne({ _id: regex });
      if (users) {
        // Redirect to /submitpatient/userId
        res.redirect(`/submitreport/${users._id}`);
      } else {
        // Handle case when user is not found, you might want to render an error page or redirect to a different page
        res.status(404).send("User not found");
      }
    }
  } catch (error) {
    res.send(error.message)
  }





});
router.get("/submitreport/:userId", async function (req, res, next) {
  const userId = req.params.userId;
  try {
    // Fetch the user data or perform any other necessary operations
    const users = await LabReport.findOne({ _id: userId });
    if (!users.interpretation) {
      const review = await run(`${users} This is the pathology report of a patient. Please analyze the report based only on the non-null data provided. Do not assume or infer results for any missing or null data. Provide an overall interpretation of the available results in one concise paragraph.
`)
      // Render the patientpr template with the user data
      // res.send(review);
      users.interpretation = review;
      await users.save();
    }
    res.render("patientrp", { users });




  } catch (error) {
    res.send(error.message)
  }


});
router.get("/daktars", async function (req, res, next) {
  res.redirect('/daktar')
})
router.get('/suggestions', (req, res) => {

  const input = req.query.input.toLowerCase();

  // Filter medicines that start with the input
  const suggestions = allMedicines.filter(medicine => medicine.toLowerCase().startsWith(input));
  res.json(suggestions);
});
router.post("/contactus", async function (req, res, next) {
  try {
    await sendEmail('chandrautahospital01@gmail.com', 'New From Contact Us', `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
        }
        .header h1 {
            margin: 0;
            color: #444;
        }
        .content {
            padding: 20px 0;
        }
        .content p {
            margin: 10px 0;
            line-height: 1.6;
        }
        .content p span {
            font-weight: bold;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>New Contact Us Message</h1>
        </div>
        <div class="content">
            <p><span>Name:</span> ${req.body.name}</p>
            <p><span>Email:</span> ${req.body.email}</p>
            <p><span>Phone Number:</span> ${req.body.number}</p>
            <p><span>Message:</span></p>
            <p>${req.body.message}</p>
        </div>
        <div class="footer">
            &copy; 2023 Chandrauta Hospital. All rights reserved.
        </div>
    </div>
</body>
</html>`);
    res.send("Your Message Is Received")
  } catch (error) {
    res.send(error.message)
  }
});
router.get("/addmember", async function (req, res, next) {
  res.render("addmember")
});
router.post("/addmembership", async function (req, res, next) {
  try {
    const user = new membership({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      number: req.body.number,
      address: req.body.address,
      dob: req.body.dob,
    });
    await user.save(); // Save the user to the database

    if (user.email) {
      const emailTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Membership Confirmation</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 20px;
              }
              .container {
                  max-width: 600px;
                  margin: auto;
                  background: #fff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              h1 {
                  color: #333;
                  text-align: center;
              }
              p {
                  font-size: 1em;
                  color: #555;
              }
              .details {
                  margin: 20px 0;
              }
              .details p {
                  margin: 5px 0;
              }
              .footer {
                  text-align: center;
                  margin-top: 20px;
                  font-size: 0.9em;
                  color: #777;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Membership Request Received</h1>
              <p>Dear <strong>${user.name}</strong>,</p>
              <p>Thank you for submitting your membership details. We have received your information and our representative will contact you shortly to confirm your membership.</p>
              <div class="details">
                  <p><strong>Membership Details:</strong></p>
                  <p><strong>Name:</strong> ${user.name}</p>
                  <p><strong>Email:</strong> ${user.email}</p>
                  <p><strong>Phone Number:</strong> ${user.number}</p>
                  <p><strong>Address:</strong> ${user.address}</p>
                  <p><strong>Date of Birth:</strong> ${user.dob}</p>
              </div>
              <p>We look forward to having you as a member of our hospital. If you have any questions, feel free to contact us at 076-540531</p>
              <div class="footer">
                  <p>&copy; 2024 Prakash Medical Pvt Ltd. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
      `;

      await sendEmail(user.email, 'Your Membership Request is Received', emailTemplate);
    }

    res.status(200).send('Membership request received.');
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.get("/addedmemberrequests", isLoggedIn, async function (req, res, next) {
  try {
    const users = await membership.find()
    const unapprovedUsers = [];
    users.forEach(user => {
      if (!user.approved) {
        unapprovedUsers.push(user);
      }
    })
    // res.send(unapprovedUsers)
    res.render("addedmemberrequests", { unapprovedUsers })
  } catch (error) {
    res.send(error.message)
    
  }
 
});
router.post("/approveMembership", async function (req, res, next) {
  try {
    const userId = req.body.id;
    const user = await membership.findOne({ _id: userId });
    user.approved = true;
    await user.save();

    if (user.email) {

      await sendEmail(user.email, 'Membership Succesfully Approved', `Your Membership Request has been approved. You can now enjoy the benefits of being a member of our hospital. If you have any questions, feel free to contact us at 076-540531`);
    }
    res.send({ message: 'Membership approved successfully' });
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.get("/viewmember", function (req, res, next) {
  res.render("searchmember")
});
router.get("/member/:memberId", async function (req, res, next) {
  try {
    const regex = req.params.memberId;
    const users = await membership.findOne({ phone: regex });

    if (!users) {
      res.send("User Not Found")
    } else {
      if (users.approved) {
        res.send(users);
      } else {
        res.send("User Not Approved Yet")
      }

    }

  } catch (error) {
    res.send(error.message)

  }

});
router.get("/createInvoice", isLoggedIn,function (req, res, next) {
  res.render("createInvoice");
});
router.post('/submit-invoice', async (req, res) => {
  try {
    const { customer, items, totalPrice } = req.body;

    // Create a new invoice instance
    const newInvoice = new Invoice({
      type: 'Invoice',
      customer: {
        name: customer.name,
        address: customer.address,
        age: customer.age,
        phone: customer.phone,
      },
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
      totalPrice: totalPrice,
    });

    // Save the invoice to the database
    await newInvoice.save();

    res.status(201).json({ message: 'Invoice submitted successfully', invoice: newInvoice._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit the invoice', details: error.message });
  }
});
router.get("/printinvoice/:id", isLoggedIn, async function (req, res, next) {
  try {
    const regex = req.params.id;
    const invoice = await Invoice.findOne({ _id: regex });
    const merchant = await userModel.findOne({ username: req.username });
    console.log(invoice);
    res.render("printinvoice", { invoice, merchant: merchant.medicalname });
  } catch (error) {
    res.send(error.message)
  }
});
router.get("/printinvoicefromuser/:id", async function (req, res, next) {
  try {
    const regex = req.params.id;
    const invoice = await Invoice.findOne({ _id: regex });
    const merchant = invoice.merchant || null;
    console.log(invoice);
    res.render("printinvoice", {invoice, merchant});
  } catch (error) {
    res.send(error.message)
  }
});
router.get("/createExpenditure",isLoggedIn, function (req, res, next) {
  res.render("createExpenditure");
});
router.post('/submit-expenditure', async (req, res) => {
  try {
    const { customer, items, totalPrice } = req.body;

    // Create a new invoice instance
    const newInvoice = new Invoice({
      type: 'Expenditure',
      customer: {
        name: customer.name,
        address: customer.address,
        age: customer.age,
        phone: customer.phone,
      },
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
      totalPrice: totalPrice,
    });

    // Save the invoice to the database
    await newInvoice.save();

    res.status(201).json({ message: 'Invoice submitted successfully', invoice: newInvoice._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit the invoice', details: error.message });
  }
});
router.get("/printexpenditure/:id", isLoggedIn, async function (req, res, next) {
  try {
    const regex = req.params.id;
    const invoice = await Invoice.findOne({ _id: regex });
    const merchnat = await userModel.findOne({ username: req.username });

    console.log(invoice);
    res.render("printinvoice", { invoice, merchnat: merchnat.medicalname });
  } catch (error) {
    res.send(error.message)
  }
});
router.get("/checkdaysheet", function (req, res, next) {
  res.render("checkdaysheet");
});
router.get('/api/day-sheet', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day

    // Fetch invoices and expenditures within the date range
    const invoices = await Invoice.find({
      createdAt: {
        $gte: start,
        $lte: end,
      }
    });

    // Calculate the total collection (only from invoices, not expenditures)
    const totalCollection = invoices
      .filter(invoice => invoice.type === 'Invoice')
      .reduce((sum, invoice) => sum + invoice.totalPrice, 0);

    res.json({ success: true, invoices, totalCollection });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching day sheet.' });
  }
});
router.get("/search-bill", function (req, res, next) {
  res.render("search-bill");
});
router.get('/api/search', async (req, res) => {
  const { name } = req.query;

  try {
    // Perform a case-insensitive search for the customer's name
    const bills = await Invoice.find({ 
      'customer.name': { $regex: name, $options: 'i' } 
    }).limit(10); // Limit the number of results for performance

    res.json(bills); // Return the results as JSON
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error, please try again later' });
  }
});


module.exports = router;
