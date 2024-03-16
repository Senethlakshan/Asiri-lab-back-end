const mongoose = require('mongoose');

const userDetailsSchema = new mongoose.Schema({
  email: { type: String, required: true },
  contactNumber: { type: String, required: true },
  companyName: { type: String, required: false },
  profileName: { type: String, required: false },
  proposerCode: { type: String, required: false },
  designation: { type: String, required: false },
  address: { type: String, required: false },
  dob: { type: Date, required: false }
});

module.exports = mongoose.model('UserDetails', userDetailsSchema);
