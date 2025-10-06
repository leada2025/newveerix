// migrateUsers.js
const mongoose = require("mongoose");
const User = require("./models/User");
const Role = require("./models/Role");

mongoose.connect("mongodb://127.0.0.1:27017/newveerix");

async function migrateUsers() {
  const adminRole = await Role.findOne({ name: "admin" });
  const customerRole = await Role.findOne({ name: "customer" });

  await User.updateOne({ email: "admin@veerix.com" }, { role: adminRole._id });
  await User.updateOne({ email: "kamal@gmail.com" }, { role: customerRole._id });

  console.log("Users migrated successfully ✅");
  process.exit();
}

migrateUsers();
