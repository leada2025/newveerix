const express = require("express");
const router = express.Router();
const Molecule = require("../models/Molecule");
const authorize = require("../middleware/authorize");
// ✅ Get all molecules (sorted by name)
router.get("/", async (req, res) => {
  try {
    const molecules = await Molecule.find().sort({ name: 1 });
    res.json(molecules);
  } catch (err) {
    console.error("Fetch molecule error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Add new molecule (with optional amount)
router.post("/",authorize(["manage_quotes"]), async (req, res) => {
  try {
    const { name, amount } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "Molecule name is required." });
    }

    const newMol = new Molecule({
      name: name.trim(),
      amount: Number(amount) || 0, // ← gently handle missing amount
    });

    const saved = await newMol.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Add molecule error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update molecule name or amount
router.patch("/:id",authorize(["manage_quotes"]), async (req, res) => {
  try {
    const updateData = {};

    if (req.body.name) updateData.name = req.body.name.trim();
    if (req.body.amount !== undefined) updateData.amount = Number(req.body.amount);

    const updated = await Molecule.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("Update molecule error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

// ✅ Delete molecule
router.delete("/:id",authorize(["manage_quotes"]), async (req, res) => {
  try {
    await Molecule.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete molecule error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
