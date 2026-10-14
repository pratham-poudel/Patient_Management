const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  consultant: {
    type: String,
  },
  remarks: {
    type: String,
  },
  createdAt: {
    type: Date, // Stores the exact date and time in ISO format
    default: Date.now, // Automatically sets the current date and time
  },
});

const NewPatient = mongoose.models.NewPatient || mongoose.model('NewPatient', patientSchema);

module.exports = NewPatient;
