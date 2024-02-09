const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  severityLevel: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    required: false
  },
  connumber: {
    type: Number,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  accepted:{
    type:Boolean
  }
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);

module.exports = Appointment; 
