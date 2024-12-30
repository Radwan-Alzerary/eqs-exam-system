const mongoose = require("mongoose");
const shortid = require("shortid");

const VisitSchema = new mongoose.Schema({
  _id: { type: String, default: shortid.generate },
  name: { type: String },
  nickname: { type: String },
  indstrial: { type: String },
  enterprise: { type: String },
  email: { type: String },
  CareerTitle: { type: String },
  phoneNumber: { type: Number },
  registered: { type: Boolean, default: false },
  approved: { type: Boolean, default: false }, // <-- Add this field
  password: { type: String },
  registeredDate: { type: Date },
  inviteFrom: { type: String },
  coming: { type: Boolean, default: false },
  comingDate: { type: Date },
  note: { type: String },
});

const Visit = mongoose.model("Visit", VisitSchema);

module.exports = Visit;
