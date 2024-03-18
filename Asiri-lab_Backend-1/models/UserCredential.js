const mongoose = require('mongoose');

const userCredentialSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'PatientDetails' },
  date: { type: Date, default: Date.now },
  refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }], // Store multiple refresh tokens
  role: { type: String, required: true},
  otp: { type: String },
  otp_expiration: { type: Date },
  
});

module.exports = mongoose.model('UserCredential', userCredentialSchema);
