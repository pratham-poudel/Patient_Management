// models/Party.js
const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    panVatNo: {
        type: String,
        required: true,
        unique: true,
    },
    registrationNo: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Party', partySchema);
