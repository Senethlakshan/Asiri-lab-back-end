const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PatientSchema = new mongoose.Schema({

  PatientuniqueId: { type: String, required: true, unique: true }, 
  email: { type: String, required: true },
  contactNumber: { type: String, required: true },
  nicNumber: { type: String, required: true, unique: true }, 
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  photo: { type: String, required: false }
 
  
});

module.exports = mongoose.model('PatientDetails', PatientSchema);
