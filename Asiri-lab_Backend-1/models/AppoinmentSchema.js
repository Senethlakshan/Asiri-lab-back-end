const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'PatientDetails' }, 
  date: { type: Date, required: true },
  testType: { type: String, required: true },
  status: { type: String, required: true, default: 'Pending' }, 
  notes: { type: String }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
