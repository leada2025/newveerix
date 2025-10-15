const express = require("express");
const router = express.Router();
const GlobalMessage = require("../models/GlobalMessage");
const GlobalUnread = require("../models/GlobalUnread");

// Get all messages grouped by customer with unread counts
router.get("/all", async (req, res) => {
  try {
    const messages = await GlobalMessage.find()
      .sort({ time: 1 })
      .populate("customerId", "name email"); // populate name/email

    // Get unread counts for all customers
    const unreadCounts = await GlobalUnread.find();
    const unreadMap = {};
    unreadCounts.forEach(u => {
      unreadMap[u.customerId] = u.adminUnread;
    });

    // Prepare response
    const result = messages.map(msg => ({
      _id: msg._id,
      customerId: msg.customerId._id,
      customerName: msg.customerId.name,
      message: msg.message,
      sender: msg.sender,
      time: msg.time,
      adminUnread: unreadMap[msg.customerId._id] || 0
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching global messages:", err);
    res.status(500).json({ error: "Server error fetching messages" });
  }
});

// Get all messages for a specific customer
router.get("/:customerId", async (req, res) => {
  try {
    const messages = await GlobalMessage.find({ customerId: req.params.customerId })
      .sort({ time: 1 });
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages for customer:", err);
    res.status(500).json({ error: "Server error fetching messages" });
  }
});

// Save a new message (admin or customer)
// Save a new message (admin or customer)
router.post("/", async (req, res) => {
  try {
    const { customerId, message, sender } = req.body;

    if (!customerId || !message || !sender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Increment unread if sender is customer
    if (sender === "customer") {
      await GlobalUnread.findOneAndUpdate(
        { customerId },
        { $inc: { adminUnread: 1 } },
        { upsert: true, new: true }
      );
    }else if (sender === "admin") {
  await GlobalUnread.findOneAndUpdate(
    { customerId },
    { $inc: { customerUnread: 1 } },
    { upsert: true, new: true }
  );
}

    // Save the message
    const newMessage = new GlobalMessage({
      customerId,
      message,
      sender,
      time: new Date(),
        readByCustomer: false, 
    });
    await newMessage.save();

    // Populate customer name
    // After saving message
const populatedMessage = await GlobalMessage.findById(newMessage._id).populate(
  "customerId",
  "name"
);

// Always get latest unread count
const unreadRecord = await GlobalUnread.findOne({ customerId });
const totalUnread = unreadRecord ? unreadRecord.adminUnread : 0;

const payload = {
  _id: populatedMessage._id,
  customerId: populatedMessage.customerId._id,
  customerName: populatedMessage.customerId.name,
  message: populatedMessage.message,
  sender: populatedMessage.sender,
  time: populatedMessage.time,
  adminUnread: totalUnread, // send actual total unread
};

const io = req.app.get("io");
if (io) io.emit("global_chat_message", payload);



    res.status(201).json(payload);
  } catch (err) {
    console.error("Error saving global message:", err);
    res.status(500).json({ error: "Server error saving message" });
  }
});

// Reset unread count for a customer (when admin opens chat)
router.post("/reset-unread/:customerId", async (req, res) => {
  try {
    await GlobalUnread.findOneAndUpdate(
      { customerId: req.params.customerId },
      { adminUnread: 0 },
      { upsert: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to reset unread:", err);
    res.status(500).json({ error: "Failed to reset unread" });
  }
});
// GET /api/globalChat/unread/:customerId
router.get('/unread/:customerId', async (req, res) => {
  try {
    const record = await GlobalUnread.findOne({ customerId: req.params.customerId });
    res.json({ adminUnread: record ? record.adminUnread : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ adminUnread: 0 });
  }
});
router.get('/unread-customer/:customerId', async (req, res) => {
  try {
    const record = await GlobalUnread.findOne({ customerId: req.params.customerId });
    res.json({ customerUnread: record ? record.customerUnread : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ customerUnread: 0 });
  }
});
// Reset unread count for customer (when they open chat)
router.post('/reset-customer-unread/:customerId', async (req, res) => {
  try {
    await GlobalUnread.findOneAndUpdate(
      { customerId: req.params.customerId },
      { customerUnread: 0 },
      { upsert: true }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to reset customer unread:", err);
    res.status(500).json({ error: "Failed to reset customer unread" });
  }
});

module.exports = router;
