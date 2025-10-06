// routes/roleRoutes.js
const express = require("express");
const Role = require("../models/Role");
const auth = require("../middleware/auth");
const router = express.Router();
const authorize = require("../middleware/authorize");
// helper: check admin


// ✅ Create new role
router.post("/", auth, authorize(["manage_users"]), async (req, res) => {
  try {


    const { name, permissions } = req.body;
    const role = new Role({ name, permissions });
    await role.save();
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get all roles (admin only)
router.get("/", auth, authorize(["manage_users"]), async (req, res) => {
  try {
 

    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update role (admin only)
router.put("/:id", auth, authorize(["manage_users"]), async (req, res) => {
  try {
  
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(role);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete role (admin only)
router.delete("/:id", auth, authorize(["manage_users"]), async (req, res) => {
  try {
 

    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: "Role deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// routes/roleRoutes.js
router.get("/employee-roles", auth,  authorize(["manage_users"]),  async (req, res) => {
  try {


    const roles = await Role.find({ 
      name: { $nin: ["admin", "customer"] } 
    });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
