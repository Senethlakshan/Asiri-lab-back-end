// create by seneth 2/25/2024

const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const cors = require('cors');
const userRoutes = require("./routes/UserRoutes");
const createComProfilerRoutes = require("./routes/CompanyProfileRoutes");

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
    origin: 'http://localhost:5173', 
    credentials: true, 
    optionsSuccessStatus: 200 // For legacy browser support
  };

  app.use(cors(corsOptions));

// Passport middleware
require('./config/passport')(passport);
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auth/user',userRoutes);
app.use('/api/auth/admin/s1',createComProfilerRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
