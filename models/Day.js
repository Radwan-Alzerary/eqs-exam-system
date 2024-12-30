// models/Day.js
const mongoose = require("mongoose");

const DaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("Day", DaySchema);
