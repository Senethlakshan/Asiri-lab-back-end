const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PatientDetails = require('../models/PatientSchema');
const UserCredential = require('../models/UserCredential');
const { sendEmail } = require('../utils/mailer'); 
const passport = require('passport');
const roleCheck = require('../middleware/roleMiddleware');
const multer = require('multer');
const paths = require('path');

const router = express.Router();



// Define storage for the images
const storage = multer.diskStorage({
  // Destination for files
  destination: function (req, file, callback) {
    const uploadPath = paths.join(__dirname, '../images/uploads');
    callback(null, uploadPath);
  },

  // Add back the extension
  filename: function (req, file, callback) {
      callback(null, Date.now() + paths.extname(file.originalname));
  },
});

// Upload parameters for multer
const upload = multer({
  storage: storage,
  limits: {
      fileSize: 1024 * 1024 * 5 // 5 MB
  },
  fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
          cb(null, true);
      } else {
          cb(null, false);
          return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
      }
  }
}).single('photo');



const validRoles = ['admin', 'manager', 'employee'];


// [passport.authenticate('jwt', { session: false }), roleCheck(['admin','manager'])]

// Registration route
router.post('/register',upload, async (req, res) => {
    try {


      // Assuming NIC is properly validated and sanitized
      const PatientuniqueId = `PRN${req.body.nicNumber.slice(-3)}`;

      // Check if the email already exists
      const emailExists = await PatientDetails.findOne({ email: req.body.email });
      if (emailExists) {
          return res.status(400).send("Email already in use.");
      }

        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 12);

         // Validate role
    if (!validRoles.includes(req.body.role)) {
        return res.status(400).send("Invalid role specified.");
      }

        // Create a new patientDetails entry
        const patientDetails = new PatientDetails({
           
            PatientuniqueId,
            email: req.body.email,
            contactNumber: req.body.contactNumber,
            nicNumber: req.body.nicNumber,
            dob: req.body.dob,
            address: req.body.address,
            photo: req.file ? req.file.path : null
                      
        });
        await patientDetails.save();

        // Create a new UserCredential entry with the hashed password
        const userCredential = new UserCredential({
            username: req.body.username,
            password: hashedPassword,
            userId: patientDetails._id, // Linking patientDetails with UserCredential
            role: req.body.role
        });
        await userCredential.save();

        // Respond with success message to email
        res.status(201).send({ message: "User registered successfully!" });

        //send email to user register sucessfull

      const emailHtml = `
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
            background: #f9f9f9;
          }
          .header {
            background-color: green;
            color: white;
            padding: 10px;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            text-align: center;
            font-size: 24px; /* Increase font size */
          }
          .footer {
            background-color: green;
            color: white;
            padding: 20px;
            border-bottom-left-radius: 10px;
            border-bottom-right-radius: 10px;
            text-align: left;
            font-size: 14px; /* Decrease font size for footer */
          }
          .content {
            padding: 20px;
            font-size: 18px; /* Increase font size for content */
          }
        </style>
      </head>
      <body>
        <div class="header">Welcome to Nawaloka Laboratory!</div>
        <div class="content">
          <p>Hello <strong>${req.body.username}</strong>,</p>
          <p>You have been successfully registered with us. Your Patient ID is: <strong>${PatientuniqueId}</strong>.</p>
          <p>Thank you for choosing us!</p>
        </div>
        <div class="footer">
          <p>The entry of Nawaloka Hospitals into the state dominated healthcare sector in 1985, saw the private health care system take root in Sri Lanka. The launch of the hospital and the overwhelming response it received from the people demonstrated a long felt need for superior healthcare in a pleasant environment.</p>
          <p>General Line : +94 (0) 115577111</p>
          <p>Channeling Hotline : +94 (0) 115777888</p>
          <p>Fax : +94 (0) 11 2430393</p>
          <p>Email : nawaloka@slt.lk</p>
          <p>Nawaloka Hospitals PLC</p>
          <p>23, Deshamanya H. K Dharmadasa Mawatha, Colombo 2, Sri Lanka.</p>
        </div>
      </body>
      </html>
  `;

  // Use the sendEmail function with the dynamically generated HTML
  const emailSent = await sendEmail({
      to: req.body.email,
      subject: 'Registration successfully !',
      html: emailHtml
  });

      

    } catch (error) {
        console.error(error);
        res.status(500).send("Error registering the user.");
    }
});


// Updated login route to set JWT in HTTP-only cookies
router.post('/login', async (req, res) => {
  try {
      const userCredential = await UserCredential.findOne({ username: req.body.username });
      if (!userCredential) {
          return res.status(400).send("User not found.");
      }

      const isMatch = await bcrypt.compare(req.body.password, userCredential.password);
      if (!isMatch) {
          return res.status(400).send("Invalid credentials.");
      }

      const accessToken = jwt.sign(
          { userID: userCredential._id, username: userCredential.username },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
          { userID: userCredential._id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: '7d' }
      );

      userCredential.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
      await userCredential.save();

      // Set tokens as HTTP-only cookies
      res.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 900000 // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      const userdata = {
        userID: userCredential._id, 
        username: userCredential.username,
        userId: userCredential.userId,
        role: userCredential.role,
      };

      res.status(200).send({
        message: "Login successful",
        user: userdata
    }
      );
  } catch (error) {
      console.error(error);
      res.status(500).send("Server error during the login process.");
  }
});

// Updated logout route to clear cookies
router.post('/logout', (req, res) => {

  res.clearCookie('accessToken', { path: '/', httpOnly: true, secure: false });
  res.clearCookie('refreshToken', { path: '/', httpOnly: true, secure: false });
  res.send("Successfully logged out");


});



router.post('/refresh', async (req, res) => {
  // Attempt to get the refreshToken from the cookies
  const refreshToken = req.cookies['refreshToken'];
  if (!refreshToken) return res.status(401).send("Refresh token required");

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userCredential = await UserCredential.findById(decoded.userID);
    const tokenExists = userCredential.refreshTokens.some(tokenObj => tokenObj.token === refreshToken);

    if (!tokenExists) return res.status(403).send("Invalid refresh token");

    // Issue a new access token
    const newAccessToken = jwt.sign({ userID: userCredential._id, username: userCredential.username }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).send("Invalid or expired refresh token");
  }
});





module.exports = router;
