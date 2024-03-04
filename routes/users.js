const mongoose = require('mongoose');
const plm=require('passport-local-mongoose');
mongoose.connect("mongodb+srv://prathampoudel2:qtBVfzC7KnRDQHlV@ganapati.y3awfpi.mongodb.net/?retryWrites=true&w=majority&appName=ganapati");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  nickname: {
    type: String,
  },
  bio:{
    type:String,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String, // Assuming you store the path or URL to the profile picture
    default: 'default.jpg', // Provide a default value if needed
  },
  medicalname:{
    type:String,
  },
  connumber:{
    type:String,
  },
  address:{
    type:String,
  },
  speciality:{
    type:String,
  },
  patient: [{
    type: mongoose.Schema.Types.ObjectId , ref :"Patient"
  }],
  patientlab: [{
    type: mongoose.Schema.Types.ObjectId , ref :"LabReport"
  }],
  appointment: [{
    type: mongoose.Schema.Types.ObjectId , ref :"Appointment"
  }]

});
userSchema.plugin(plm);
const User = mongoose.model('User', userSchema);


module.exports = User;
