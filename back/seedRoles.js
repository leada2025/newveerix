// seedRoles.js
const mongoose = require("mongoose");
const Role = require("./models/Role");

mongoose.connect("mongodb://127.0.0.1:27017/newveerix");

async function seedRoles() {
 
// seedRoles.js
const roles = [
  { name: "admin", permissions: ["*"] },  // 👈 wildcard for all
  { name: "customer", permissions: ["view_quotes", "create_quote"] }
];



  for (const r of roles) {
    const exists = await Role.findOne({ name: r.name });
    if (!exists) {
      await Role.create(r);
      console.log(`Created role: ${r.name}`);
    }
  }
  process.exit();
}

seedRoles();
