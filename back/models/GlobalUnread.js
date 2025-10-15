const mongoose = require('mongoose');

const globalUnreadSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminUnread: { type: Number, default: 0 },
    customerUnread: { type: Number, default: 0 } // unread for admin
});

module.exports = mongoose.model('GlobalUnread', globalUnreadSchema);
