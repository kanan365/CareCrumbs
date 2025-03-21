// pages/api/users/updateProfile.js
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/mongodb";

// Configure API to accept larger requests
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '30mb' // Increased to 30MB as requested
    }
  }
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Verify user is authenticated
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get form data from request body
    const {
      name,
      email,
      mobile,
      image,
      linkedinUrl,
      githubUrl,
      websiteUrl
    } = req.body;
    
    // Make sure email exists and matches the session user's email
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Security check: Only allow users to update their own profile
    if (email !== session.user.email) {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Update the user document, or create if it doesn't exist
    const result = await db.collection('users').updateOne(
      { email },
      {
        $set: {
          name,
          email,
          mobile,
          image,
          linkedinUrl,
          githubUrl,
          websiteUrl,
          updatedAt: new Date()
        }
      },
      { upsert: true } // Create document if it doesn't exist
    );
    
    // Check if the operation was successful
    if (result.acknowledged) {
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully'
      });
    } else {
      return res.status(500).json({
        error: 'Failed to update profile',
        message: 'Database operation failed'
      });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}