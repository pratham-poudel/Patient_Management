const mongoose = require('mongoose');

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
        enum: ['Invoice', 'Expenditure'], // Only allow these two values
        required: true,
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
      match: /^[0-9]{10}$/, // Ensures valid 10-digit phone number
    },
  },
  items: [itemSchema], // Array of item schemas
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

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
