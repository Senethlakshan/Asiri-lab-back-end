// create by seneth 2/25/2024

const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const cors = require('cors');
const userRoutes = require("./routes/UserRoutes");
const patientRoutes = require("./routes/PatientsRoutes");
const appointmentRoutes = require("./routes/AppoinmentRoutes");


require('dotenv').config();


const cookieParser = require('cookie-parser');


const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());



// CORS configuration 
const corsOptions = {
    origin: 'http://localhost:3000', 
    credentials: true, 
    optionsSuccessStatus: 200 // For legacy browser support
  };

  app.use(cors(corsOptions));

// Passport middleware
require('./config/passport')(passport);
app.use(passport.initialize());

// Routes
app.use('/api/v1/user',patientRoutes);
app.use('/api/v1/user/details',userRoutes);
app.use('/api/v1/user/appointment',appointmentRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
