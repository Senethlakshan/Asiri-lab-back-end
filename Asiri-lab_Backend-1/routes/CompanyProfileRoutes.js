// company profile and policies save service CREATEDT 2/24/2024

const express = require('express');
const mongoose = require('mongoose');
const CompanyProfile = require('../models/CompanyProfileSchema');
const Policy = require('../models/PolicySchema');
const router = express.Router();

const passport = require('passport');
const roleCheck = require('../middleware/roleMiddleware');

// Helper function to generate unique IDs
function generateUniqueID(prefix, length = 4) {
  return `${prefix}${Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0')}`;
}



router.post('/create-company-profile', [passport.authenticate('jwt', { session: false }), roleCheck(['admin'])], async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { companyName, br_number, profile_name, address, contactNumber, createDateTime, policies } = req.body;
    
    // Generate unique companyID
    const companyID = generateUniqueID(companyName.substring(0, 3).toUpperCase(), 4);

    // Create and save the company profile
    const newCompany = new CompanyProfile({
      companyID,
      companyName,
      br_number,
      profile_name,
      address,
      contactNumber,
      createDateTime
    });

    await newCompany.save({ session });

    // Iterate through policies and create each one
    for (const policy of policies) {
      const newPolicy = new Policy({
        policyID: generateUniqueID('POL', 5),
        policyNumber: policy.policyNumber,
        createDate: policy.createDate,
        commenceDate: policy.commenceDate,
        status: policy.status,
        companyID: companyID // Link policy to the company
      });
      await newPolicy.save({ session });
    }

    await session.commitTransaction();
    res.status(201).send({ message: "Company and policies created successfully" });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).send("Failed to create company and policies");
  } finally {
    session.endSession();
  }
});

module.exports = router;
