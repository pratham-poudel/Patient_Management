const mongoose = require('mongoose')
const memberSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String},
    phone:{type: Number},
    dob: {type: String},
    address: {type: String, required: true },
    approved: {type: Boolean, default: false}
})
module.exports = mongoose.model('Member', memberSchema)