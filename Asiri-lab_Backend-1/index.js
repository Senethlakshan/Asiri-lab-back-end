const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const userRoutes = require("./routes/UserRoutes");
const createComProfilerRoutes = require("./routes/CompanyProfileRoutes");

require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());


// Passport middleware
require('./config/passport')(passport);
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auth/user',userRoutes);
app.use('/api/auth/admin/s1',createComProfilerRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
