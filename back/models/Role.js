// models/Role.js
const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., admin, customer, manager
  permissions: [{ type: String }] // e.g., ["manage_users", "view_quotes", "edit_quotes"]
}, { timestamps: true });

module.exports = mongoose.model("Role", RoleSchema);
