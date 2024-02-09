const mongoose = require('mongoose');
const plm=require('passport-local-mongoose');


const labReportSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId , ref :"User"
  },
  regtime: {
    type: Date,
    default: Date.now
},
  dname: {
    type: String,
    required: true,
  },
  medicalname: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  connumber: {
    type: String,
    required: true,
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
  date: {
    type: Date,
    default: Date.now,
  },
    glucose: {
      type: Number,
    },
    cholesterol: {
      type: Number,
    },
    triglycerides: {
      type: Number,
    },
    creatinine: {
      type: Number,
    },
    urea: {
      type: Number,
    },
      alt: {
        type: Number,
      },
      ast: {
        type: Number,
      },
      alkalinePhosphatase: {
        type: Number,
      },
      totalBilirubin: {
        type: Number,
      },
    
      sodium: {
        type: Number,
      },
      potassium: {
        type: Number,
      },
      chloride: {
        type: Number,
      },
    
      totalProtein: {
        type: Number,
      },
      albumin: {
        type: Number,
      },
      globulin: {
        type: Number,
      },
  

      hdlCholesterol: {
        type: Number,
      },
      ldlCholesterol: {
        type: Number,
      },
      vldlCholesterol: {
        type: Number,
      },
      hemoglobin: {
        type: Number,
      },
      whiteBloodCells: {
        type: Number,
      },
      plateletCount: {
        type: Number,
      },
    },
);
labReportSchema.plugin(plm);
labReportSchema.virtual('formatime').get(function () {
  return this.regtime.toLocaleString(); // Adjust the format as needed
});

const LabReport = mongoose.model('LabReport', labReportSchema);

module.exports = LabReport;
