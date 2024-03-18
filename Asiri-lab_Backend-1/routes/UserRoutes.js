const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const UserCredential = require('../models/UserCredential');
const UserDetails = require('../models/PatientSchema'); 
const roleCheck = require('../middleware/roleMiddleware');

const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// Updated route with role check
router.get('/viewall', [passport.authenticate('jwt', { session: false }), roleCheck(['admin'])], async (req, res) => {
  try {
    const users = await UserCredential.find().populate('userId');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


// Route to get user details by ObjectId
router.get('/userbyId/:id', async (req, res) => {
  try {
      const userId = req.params.id; // Get the ObjectId passed in the URL
      const user = await UserCredential.findById(userId); // Find the user by ID
      const userbyid = await UserDetails.findById(user.userId);

      userId

      if (!user) {
          return res.status(404).send({ message: 'User not found.' });
      }

      const userPassdata ={

        username :user.username,
        role: user.role,

      }

      res.status(200).json(
      {
        message: "User found !",
        params: userPassdata,
        userdata : userbyid

      }
        
      );
  } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Server error occurred while fetching user details.' });
  }
});



router.put('/update/:userId', [passport.authenticate('jwt', { session: false }), roleCheck(['admin'])], async (req, res) => {
    const { userId } = req.params;
    const { email, contactNumber, username, password, role } = req.body;
    
    try {
        // Update UserDetails
        const updatedUserDetails = await UserDetails.findByIdAndUpdate(userId, { email, contactNumber }, { new: true });
        if (!updatedUserDetails) {
            return res.status(404).send("User details not found.");
        }

        // Optionally, update the username, password, and role in UserCredential
        // Ensure you hash the password if it's being updated
        let updateData = {};
        if (username) updateData.username = username;
        if (password) {
            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 12);
            updateData.password = hashedPassword;
        }
        if (role) updateData.role = role;

        const updatedUserCredential = await UserCredential.findOneAndUpdate({ userId: userId }, updateData, { new: true });
        if (!updatedUserCredential) {
            return res.status(404).send("User credentials not found.");
        }

        res.json({ message: "User updated successfully.", userDetails: updatedUserDetails, userCredential: updatedUserCredential });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});


router.delete('/delete/:userId', [passport.authenticate('jwt', { session: false }), roleCheck(['admin'])], async (req, res) => {
    try {
        const { userId } = req.params;
        // Find and delete UserDetails entry
        const userDetailsDeletion = await UserDetails.findByIdAndDelete(userId);
        // If no UserDetails found, return error
        if (!userDetailsDeletion) return res.status(404).send("User details not found.");

        // Find and delete UserCredential entry linked to UserDetails
        const userCredentialDeletion = await UserCredential.findOneAndDelete({ userId: userId });
        // If no UserCredential found, return error
        if (!userCredentialDeletion) return res.status(404).send("User credentials not found.");

        res.json({ message: "User deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});


// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your preferred service
    auth: {
      user: process.env.EMAIL_USERNAME, // Your email
      pass: process.env.EMAIL_PASSWORD, // Your email password
    },
  });
  
 
  router.post('/send-otp', async (req, res) => {
    const { username, email } = req.body;
    
    // Find user by username
    const userCredential = await UserCredential.findOne({ username: username }).populate('userId');
    if (!userCredential) {
      return res.status(404).send("User not found.");
    }
  
    // Validate email against UserDetails
    const userDetails = await UserDetails.findById(userCredential.userId);
    if (!userDetails || userDetails.email !== email) {
      return res.status(404).send("Invalid email for the provided username.");
    }
  
    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    const otp_expiration = new Date(new Date().getTime() + 5*60000); // OTP expires in 30 minutes
  
    // Save OTP and expiration to user document
    userCredential.otp = otp;
    userCredential.otp_expiration = otp_expiration;
    await userCredential.save();
  
    // Send OTP via email
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}`,
    };
  
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
        res.status(500).send("Failed to send OTP.");
      } else {
        console.log('Email sent: ' + info.response);
        res.send("OTP sent to your email.");
      }
    });
  });



  router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
  
    // First, find the UserDetails entry by email
    const userDetails = await UserDetails.findOne({ email: email });
    if (!userDetails) {
      return res.status(404).send("User details not found.");
    }
  
    // Then, find the UserCredential entry linked to the UserDetails
    const userCredential = await UserCredential.findOne({ userId: userDetails._id });
    if (!userCredential) {
      return res.status(404).send("User credentials not found.");
    }
  
    // Now, validate the OTP and its expiration
    if (userCredential.otp !== otp || new Date() > userCredential.otp_expiration) {
      return res.status(400).send("Invalid or expired OTP.");
    }
  
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    userCredential.password = hashedPassword;
    userCredential.otp = null; // Clear OTP
    userCredential.otp_expiration = null; // Clear OTP expiration
    await userCredential.save();
  
    res.send("Password has been reset successfully.");
  });
  


module.exports = router;
