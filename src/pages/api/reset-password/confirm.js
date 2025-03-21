// File: pages/api/reset-password/confirm.js
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailOrMobile, resetCode, newPassword } = req.body;
  console.log(`Processing password reset confirmation for: ${emailOrMobile}`);

  try {
    const { db } = await connectToDatabase();
    
    // Find the OTP in the database
    const resetRequest = await db.collection("passwordResets").findOne({
      emailOrMobile: emailOrMobile,
      otp: resetCode,
      expires: { $gt: new Date() } // Check if OTP is not expired
    });
    
    if (!resetRequest) {
      console.log(`Invalid or expired OTP for: ${emailOrMobile}`);
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    console.log(`Valid OTP found for user ID: ${resetRequest.userId}`);
    
    // Store password directly without hashing
    const plainPassword = newPassword;
    console.log(`Password prepared for storage`);
    
    // Make sure userId is properly handled as ObjectId
    const userId = typeof resetRequest.userId === 'string' 
      ? new ObjectId(resetRequest.userId) 
      : resetRequest.userId;
    
    // Update user password with better error handling
    const updateResult = await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          password: plainPassword,
          updatedAt: new Date()
        }
      }
    );
    
    console.log("Update result:", updateResult);
    
    if (updateResult.matchedCount === 0) {
      console.log(`No user found with ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (updateResult.modifiedCount === 0) {
      console.log(`Password may already be the same for user ID: ${userId}`);
      // Still consider this a success, just no changes were needed
    }
    
    console.log(`Password updated successfully for user ID: ${userId}`);
    
    // Delete the used OTP
    await db.collection("passwordResets").deleteOne({ _id: resetRequest._id });
    console.log(`Deleted used OTP from database`);
    
    return res.status(200).json({
      success: true,
      message: 'Password successfully reset'
    });
    
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ 
      error: 'Failed to reset password', 
      details: error.message 
    });
  }
}