// Import necessary modules
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserCredential = require('../models/UserCredential');
const UserDetails = require('../models/UserDetails');

const router = express.Router();

const validRoles = ['admin', 'manager', 'employee'];

// Registration route
router.post('/register', async (req, res) => {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 12);

         // Validate role
    if (!validRoles.includes(req.body.role)) {
        return res.status(400).send("Invalid role specified.");
      }

        // Create a new UserDetails entry
        const userDetails = new UserDetails({
            email: req.body.email,
            contactNumber: req.body.contactNumber,
            companyName: req.body.companyName,
            profileName: req.body.profileName,
            proposerCode: req.body.proposerCode,
            designation: req.body.designation,
            address: req.body.address,
            dob: req.body.dob
        });
        await userDetails.save();

        // Create a new UserCredential entry with the hashed password
        const userCredential = new UserCredential({
            username: req.body.username,
            password: hashedPassword,
            userId: userDetails._id, // Linking UserDetails with UserCredential
            role: req.body.role
        });
        await userCredential.save();

        // Respond with success message (Consider sending a confirmation email here)
        res.status(201).send({ message: "User registered successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error registering the user.");
    }
});



router.post('/login', async (req, res) => {
    try {
        // Find the user by username
        const userCredential = await UserCredential.findOne({ username: req.body.username });
        if (!userCredential) {
            return res.status(400).send("User not found.");
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(req.body.password, userCredential.password);
        if (!isMatch) {
            return res.status(400).send("Invalid credentials.");
        }

        // Generate an access token
        const accessToken = jwt.sign(
            { userID: userCredential._id, username: userCredential.username },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // Adjust token validity as needed
        );

        // Generate a refresh token
        const refreshToken = jwt.sign(
            { userID: userCredential._id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' } // Adjust token validity as needed
        );

        // Save the refresh token with the user's credentials
        // Assuming your schema can handle multiple tokens
        userCredential.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
        await userCredential.save();

        // Respond with both tokens
        res.json({
            message: "User Login successfully.. ",
            accessToken: accessToken,
            refreshToken: refreshToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error during the login process.");
    }
});

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).send("Refresh token required");
  
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      // Find the user and remove the refresh token
      await UserCredential.updateOne(
        { _id: decoded.userID },
        { $pull: { refreshTokens: { token: refreshToken } } }
      );
      res.send("Successfully logged out");
    } catch (error) {
      res.status(500).send("Server error");
    }
  });
  

  router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).send("Refresh token required");
  
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const userCredential = await UserCredential.findById(decoded.userID);
      const tokenExists = userCredential.refreshTokens.some(tokenObj => tokenObj.token === refreshToken);
  
      if (!tokenExists) return res.status(403).send("Invalid refresh token");
  
      // Issue a new access token
      const newAccessToken = jwt.sign({ userID: userCredential._id, username: userCredential.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ accessToken: newAccessToken });
    } catch (error) {
      res.status(403).send("Invalid or expired refresh token");
    }
  });

module.exports = router;
