const mongoose = require('mongoose');
const plm=require('passport-local-mongoose');
const { stringify } = require('uuid');


// Define the patient schema
const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  dname:{
    type: String,
    required: true
  },
  medicalname:{
    type: String , 
    required : true
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  symptoms: {
    type: [String],
    required: true,
  },
  medicinesUsed: {
    type: [String],
  },
  regtime: {
    type: Date,
    default: Date.now
},
doctor: {
  type: mongoose.Schema.Types.ObjectId , ref :"User"
},
email: {
  type: String,
  required: true,
},
  // Add more fields as needed
});
patientSchema.virtual('formatime').get(function () {
  return this.regtime.toLocaleString(); // Adjust the format as needed
});
patientSchema.plugin(plm);
// Create the patient model

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
