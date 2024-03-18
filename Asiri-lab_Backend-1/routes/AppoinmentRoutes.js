const express = require('express');
const router = express.Router();
const passport = require('passport');
const Appointment = require('../models/AppoinmentSchema');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const PatientDetails = require('../models/PatientSchema'); 

// POST: Book a new appointment
router.post('/appointments/book', async (req, res) => {
  const { userId,date,testType,notes } = req.body;
  try {
    // const userId = req.user._id; // Assuming req.user is populated by passport authentication
    const newAppointment = await Appointment.create({
      userId,
      date,
      testType,
      status: 'Pending',
      notes, 
    });
    res.status(201).json(newAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error booking appointment.");
  }
});


router.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body; 
    try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd', // Specify the currency
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating payment intent.");
  }
});






module.exports = router;
