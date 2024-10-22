const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Schema for individual invoice items
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
  },
});

// Schema for the invoice
const invoiceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Invoice', 'Expenditure'],
    required: true,
  },
  billNo: {
    type: Number,  // Bill number will be auto-incremented
    unique: true,
  },
  customer: {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
      min: 1,
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
  },
  items: [itemSchema],
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Apply auto-increment plugin to the billNo field
invoiceSchema.plugin(AutoIncrement, { inc_field: 'billNo' });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
