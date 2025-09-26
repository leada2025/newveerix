const mongoose = require("mongoose");

const MoleculeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  amount: { type: Number, default: 0 }, // 💰 fixed quote price
});

module.exports = mongoose.model("Molecule", MoleculeSchema);
