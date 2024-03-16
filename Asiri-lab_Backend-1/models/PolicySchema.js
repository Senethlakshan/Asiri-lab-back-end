const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  policyID: { type: String, required: true, unique: true },
  policyNumber: { type: String, required: true, unique: true },
  createDate: { type: Date, default: Date.now },
  commenceDate: { type: Date, required: true },
  status: { type: String, required: true }, 
  companyID: { type: String, required: true, ref: 'CompanyProfile' } 
});

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy;
