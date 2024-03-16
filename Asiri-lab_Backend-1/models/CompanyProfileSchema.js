const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({
  companyID: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  br_number: { type: String, required: true, unique: true },
  profile_name: { type: String, required: true },
  address: { type: String, required: true },
  contactNumber: { type: String, required: true },
  createDateTime: { type: Date, default: Date.now },
  proposerCode: { type: String, required: true },

});

const CompanyProfile = mongoose.model('CompanyProfile', companyProfileSchema);

module.exports = CompanyProfile;
