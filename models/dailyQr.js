// models/Day.js
const mongoose = require("mongoose");

const dailyQr = new mongoose.Schema({
  QrValue: {
    type: String,
    required: true,
    unique: true
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  active:{
    type:Boolean
  }
});

module.exports = mongoose.model("DailyQr", dailyQr);
