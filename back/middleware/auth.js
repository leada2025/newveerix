// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Populate role name + permissions
    const user = await User.findById(decoded.id).populate("role");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role?.name || null, // "admin", "customer", etc.
      permissions: user.role?.permissions || [] // 👈 now permissions available
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = auth;
