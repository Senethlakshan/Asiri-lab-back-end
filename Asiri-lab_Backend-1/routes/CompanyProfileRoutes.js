// company profile and policies save service CREATEDT 2/24/2024

const express = require('express');
const mongoose = require('mongoose');
const CompanyProfile = require('../models/CompanyProfileSchema');
const Policy = require('../models/PolicySchema');
const UserDetails = require('../models/UserDetails');
const axios = require('axios');
const router = express.Router();

const passport = require('passport');
const roleCheck = require('../middleware/roleMiddleware');
router.use(express.json());

// Helper function to generate unique IDs
// function generateUniqueID(prefix, length = 4) {
//   return `${prefix}${Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0')}`;
// }

function generateUniqueID(prefix, length = 4) {
    // Sanitize prefix to remove specific symbols
    const sanitizedPrefix = prefix.replace(/[\/?@$%]/g, '');
    // Generate the numeric part of the ID
    const numericPart = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
    // Concatenate the sanitized prefix with the numeric part
    return `${sanitizedPrefix}${numericPart}`;
}



// create company profile
// router.post('/create-company-profile', [passport.authenticate('jwt', { session: false }), roleCheck(['admin'])], async (req, res) => {
//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();
//     const { companyName, br_number, profile_name, address, contactNumber, createDateTime, proposerCode, policies } = req.body;
    
//     // Generate unique companyID
//     const companyID = generateUniqueID(companyName.substring(0, 3).toUpperCase(), 4);

//     // Create and save the company profile
//     const newCompany = new CompanyProfile({
//       companyID,
//       companyName,
//       br_number,
//       profile_name,
//       address,
//       contactNumber,
//       createDateTime,
//       proposerCode
//       });

//     await newCompany.save({ session });

//     // Iterate through policies and create each one
//     for (const policy of policies) {
//       const newPolicy = new Policy({
//         policyID: generateUniqueID('POL', 5),
//         policyNumber: policy.policyNumber,
//         createDate: policy.createDate,
//         commenceDate: policy.commenceDate,
//         status: policy.status,
//         companyID: companyID // Link policy to the company
//       });
//       await newPolicy.save({ session });
//     }

//     await session.commitTransaction();
//     res.status(201).send({ message: "Company and policies created successfully" });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error(error);
//     res.status(500).send("Failed to create company and policies");
//   } finally {
//     session.endSession();
//   }
// });


// [passport.authenticate('jwt', { session: false }), roleCheck(['admin'])]

// create company profile
router.post('/create-company-profile', async (req, res) => {
  const { companyName, br_number, profile_name, address, contactNumber, createDateTime, proposerCode, policies } = req.body;
  
  // Generate unique companyID
  const companyID = generateUniqueID(companyName.substring(0, 3).toUpperCase(), 4);

  // Create the company profile object
  const newCompany = new CompanyProfile({
      companyID,
      companyName,
      br_number,
      profile_name,
      address,
      contactNumber,
      createDateTime,
      proposerCode
  });

  try {
      // Attempt to save the company profile
      await newCompany.save();

      // If successful, proceed to save each policy
      const policyPromises = policies.map(policy => {
          const newPolicy = new Policy({
              policyID: generateUniqueID('POL', 5),
              policyNumber: policy.policyNumber,
              createDate: policy.createDate,
              commenceDate: policy.commenceDate,
              status: policy.status,
              companyID: companyID // Link policy to the company
          });
          return newPolicy.save(); // Return the promise for later use
      });

      // Wait for all policy promises to resolve
      await Promise.all(policyPromises);

      res.status(201).send({ message: "Company and policies created successfully" });
  } catch (error) {
      console.error(error);

      // If error occurs, manually roll back by deleting the company
      // Note: This is a simplistic approach and may not handle all edge cases
      if (newCompany._id) {
          await CompanyProfile.findByIdAndDelete(newCompany._id);
      }

      res.status(500).send("Failed to create company and policies. Any partial changes were rolled back.");
  }
});



// Route to get all company profiles
router.get('/view-all-company-profiles', [passport.authenticate('jwt', { session: false }), roleCheck(['admin','manager'])], async (req, res) => {
  try {
      const companyProfiles = await CompanyProfile.find({});
      res.json(companyProfiles);
  } catch (error) {
      console.error("Error fetching company profiles:", error);
      res.status(500).send("Error fetching company profiles");
  }
});



// Route to search policies based on company details
router.post('/search-policies', [passport.authenticate('jwt', { session: false }), roleCheck(['admin'])], async (req, res) => {
  const searchCriteria = req.body;

  try {
      // Build search query for CompanyProfile based on provided criteria
      let searchQuery = {};
      if (searchCriteria.companyID) searchQuery.companyID = searchCriteria.companyID;
      if (searchCriteria.companyName) searchQuery.companyName = new RegExp(searchCriteria.companyName, 'i');
      if (searchCriteria.br_number) searchQuery.br_number = searchCriteria.br_number;
      if (searchCriteria.profile_name) searchQuery.profile_name = new RegExp(searchCriteria.profile_name, 'i');
      if (searchCriteria.contactNumber) searchQuery.contactNumber = searchCriteria.contactNumber;


      // Find matching company profiles
      const matchingCompanies = await CompanyProfile.find(searchQuery);
      const companyIDs = matchingCompanies.map(company => company.companyID);

      // Find all policies linked to the matching company profiles
      const matchingPolicies = await Policy.find({ companyID: { $in: companyIDs } });

      res.json(matchingPolicies);
  } catch (error) {
      console.error("Error searching policies based on company details:", error);
      res.status(500).send("Error searching policies");
  }
});


// Update a company profile by its companyID
router.put('/update-company-profile/:companyID', [passport.authenticate('jwt', { session: false }), roleCheck(['admin'])], async (req, res) => {
  const { companyID } = req.params;
  const { companyName, br_number, profile_name, address, contactNumber, proposerCode } = req.body;

  try {
      const updatedCompany = await CompanyProfile.findOneAndUpdate({ companyID }, {
          companyName,
          br_number,
          profile_name,
          address,
          contactNumber,
          proposerCode
         
      }, { new: true });

      if (!updatedCompany) {
          return res.status(404).send({ message: "Company not found." });
      }

      res.json({ message: "Company updated successfully.", company: updatedCompany });
  } catch (error) {
      console.error(error);
      res.status(500).send("Error updating the company.");
  }
});


// Delete a company profile by its companyID
// router.delete('/delete-company-profile/:companyID', [passport.authenticate('jwt', { session: false }), roleCheck(['admin'])], async (req, res) => {
//   const { companyID } = req.params;

//   try {
//       const deletedCompany = await CompanyProfile.findOneAndDelete({ companyID });
//       if (!deletedCompany) {
//           return res.status(404).send({ message: "Company not found." });
//       }
//       res.json({ message: "Company deleted successfully." });
//   } catch (error) {
//       console.error(error);
//       res.status(500).send("Error deleting the company.");
//   }
// });


// Delete a company profile and its associated policies by companyID (CURRENTLY NOT NEEDED)
router.delete('/delete-company-profile/:companyID', async (req, res) => {
  const { companyID } = req.params;

  try {
      // Start a session and transaction for atomic operations
      const session = await mongoose.startSession();
      session.startTransaction();

      // Delete the company profile
      const deletedCompany = await CompanyProfile.findOneAndDelete({ companyID }, { session });
      if (!deletedCompany) {
          // If no company found, cancel the transaction and return an error
          await session.abortTransaction();
          session.endSession();
          return res.status(404).send({ message: "Company not found." });
      }

      // Delete all policies associated with the company
      await Policy.deleteMany({ companyID: companyID }, { session });

      // Commit the transaction and end the session
      await session.commitTransaction();
      session.endSession();

      res.json({ message: "Company and its associated policies deleted successfully." });
  } catch (error) {
      console.error(error);
      res.status(500).send("Error deleting the company and its policies.");
  }
});


// Delete multiple company profiles and their associated policies
router.post('/delete-company-profiles', async (req, res) => {
  const { companyIDs } = req.body; // Expect an array of companyIDs to delete

  try {
    // First, delete all policies associated with these company profiles
    await Policy.deleteMany({ companyID: { $in: companyIDs } });

    // Then, delete the company profiles themselves
    await CompanyProfile.deleteMany({ companyID: { $in: companyIDs } });

    res.json({ message: "Companies and their associated policies deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting the companies and their policies.");
  }
});


//call external web api get company details (fins data)   
router.post('/get-company-details', async (req, res) => {
  const { proposerCode } = req.body; 

  // Validate the input
  if (!proposerCode) {
      return res.status(400).send('proposerCode is required');
  }

  try {
      const response = await axios.post('http://secure.janashakthi.com:8080/Claim_sending_2/jersey/HRClmPolicyDetails', {
          proposerCode 
      });

   
      res.json(response.data);
  } catch (error) {
      console.error('Error calling external API:', error.message);
      res.status(500).send('Failed to retrieve company details');
  }
});


// Route to get company profile by companyID with associated policies
router.get('/company/:companyID', async (req, res) => {
    const { companyID } = req.params;

    try {
        const company = await CompanyProfile.findOne({ companyID: companyID });
        if (!company) {
            return res.status(404).send({ message: "Company not found." });
        }

        // Fetch policies associated with the company
        const policies = await Policy.find({ companyID: companyID });

        // If you also need to fetch users associated with this company, you would
        // perform a similar query to the UserDetails model. For example:
        const users = await UserDetails.find({ companyID: companyID });

        res.json({
            company: company,
            policies: policies,
             users: users, // Uncomment if you're including users
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});


module.exports = router;
