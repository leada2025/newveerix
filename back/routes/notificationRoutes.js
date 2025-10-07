const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

// 📥 Get all notifications for a user
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ➕ Save new notification
router.post("/", auth, async (req, res) => {
  try {
    const { title, message, type, relatedId } = req.body;

    const notification = new Notification({
      userId: req.user._id,
      title,
      message,
      type,
      relatedId,
    });

    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 👁 Mark ONE notification as seen
router.patch("/:id/seen", auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { seen: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 👁 Mark ALL notifications as seen
router.patch("/seen", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, seen: false },
      { seen: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notifications as seen:", err);
    res.status(500).json({ message: err.message });
  }
});

// 🗑 Clear all seen notifications
router.delete("/clear", auth, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id, seen: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
