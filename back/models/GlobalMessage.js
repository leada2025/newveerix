// models/GlobalMessage.js
const mongoose = require('mongoose');

const globalMessageSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['customer', 'admin'],
    required: true
  },
  time: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GlobalMessage', globalMessageSchema);