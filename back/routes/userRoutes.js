// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const auth = require("../middleware/auth");
const Role = require("../models/Role");
const authorize = require("../middleware/authorize");
// @desc    Register new user (optional)
// @route   POST /api/users/register
// routes/userRoutes.js
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, city, companyName, GSTno } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    let roleId = role;
    if (typeof role === "string") {
      const roleDoc = await Role.findOne({ name: role });
      if (!roleDoc) return res.status(400).json({ message: "Invalid role" });
      roleId = roleDoc._id;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: roleId,
      city,
      companyName,
      GSTno,
    });

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        city: user.city,
        companyName: user.companyName,
        GSTno: user.GSTno,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// @desc    Login user
// @route   POST /api/users/login
// login route
// login route
// routes/userRoutes.js (login)
// routes/userRoutes.js (login)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).populate("role");
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const roleName = user.role?.name || "customer";
  const permissions = user.role?.permissions || [];

  res.json({
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: roleName,
      permissions
    }
  });
});


router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      city: user.city,
      companyName: user.companyName,
      GSTno: user.GSTno,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @desc    Update user profile
// @route   PUT /api/users/profile
router.put("/profile", async (req, res) => {
  try {
    const { id, name, email, password, city, companyName, GSTno } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    user.city = city || user.city;          // <-- added
    user.companyName = companyName || user.companyName; // <-- added
    user.GSTno = GSTno || user.GSTno;       // <-- added

    if (password) {
      user.password = password; // hashed automatically by pre-save hook
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      city: updatedUser.city,
      companyName: updatedUser.companyName,
      GSTno: updatedUser.GSTno,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/add-employee", auth, async (req, res) => {
  try {
    const { name, email, password, role, city, companyName, GSTno } = req.body;

    const roleDoc = await Role.findById(role);
    if (!roleDoc || roleDoc.name === "customer") {
      return res.status(400).json({ message: "Invalid role selection" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email,
      password,
      role,
      city,
      companyName,
      GSTno,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: roleDoc.name,
      city: user.city,
      companyName: user.companyName,
      GSTno: user.GSTno,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Get all employees (excluding customers & admins)
router.get("/employees", auth, authorize(["manage_users"]), async (req, res) => {
  try {
  

    const employees = await User.find()
      .populate("role", "name")
      .lean();

    const filtered = employees.filter(
      (u) => u.role?.name !== "admin" && u.role?.name !== "customer"
    );

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ✅ Update Employee (admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    // only admin can update


    const { name, email, password, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // update fields
    user.name = name || user.name;
    user.email = email || user.email;

    if (password) user.password = password;

    if (role) {
      const roleDoc = await Role.findById(role);
      if (!roleDoc) return res.status(400).json({ message: "Invalid role" });
      user.role = roleDoc._id;
    }

    await user.save();

    res.json({
      message: "Employee updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Delete Employee (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
   

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// ===============================
// ✅ Get all customers (admin only)
// ===============================
// ✅ Get all customers (only customers)
router.get("/customers", auth, authorize(["manage_users"]), async (req, res) => {
  try {
    const customers = await User.find()
      .populate("role", "name")
      .lean();

    const filtered = customers
      .filter((u) => u.role?.name === "customer")
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        city: u.city,
        companyName: u.companyName,
        GSTno: u.GSTno,
        active: u.active,
      }));

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// ===============================
// ✅ Update Customer (admin only)
// ===============================
router.put("/customers/:id", auth, authorize(["manage_users"]), async (req, res) => {
  try {
    const { name, email, password, city, companyName, GSTno } = req.body;

    const user = await User.findById(req.params.id).populate("role", "name");
    if (!user) return res.status(404).json({ message: "Customer not found" });

    if (user.role?.name !== "customer") {
      return res.status(400).json({ message: "This user is not a customer" });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.city = city || user.city;
    user.companyName = companyName || user.companyName;
    user.GSTno = GSTno || user.GSTno;
    if (password) user.password = password;

    await user.save();

    res.json({
      message: "Customer updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: "customer",
        city: user.city,
        companyName: user.companyName,
        GSTno: user.GSTno,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle Active/Inactive for a customer
router.patch(
  "/customers/:id",
  auth,
  authorize(["manage_users"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).populate("role", "name");
      if (!user) return res.status(404).json({ message: "Customer not found" });
      if (user.role?.name !== "customer")
        return res.status(400).json({ message: "This user is not a customer" });

      // Toggle active if present
      if (typeof req.body.active === "boolean") {
        user.active = req.body.active;
      }

      // Optional: also allow name/email/password update in same endpoint
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) user.password = req.body.password;

      await user.save();

      res.json({
        message: "Customer updated successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: "customer",
          active: user.active,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


router.delete("/customers/:id", auth, authorize(["manage_users"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("role", "name");
    if (!user) return res.status(404).json({ message: "Customer not found" });

    if (user.role?.name !== "customer") {
      return res.status(400).json({ message: "This user is not a customer" });
    }

    await user.deleteOne();
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
