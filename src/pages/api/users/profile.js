// src/pages/api/users/profile.js
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Use getServerSession instead of getSession for API routes
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }
    
    // Only allow users to access their own profile data
    if (email !== session.user.email) {
      return res.status(403).json({ error: 'Not authorized to access this profile' });
    }
    
    const { db } = await connectToDatabase();
    
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      // If user not found in database, return basic session data
      return res.status(200).json({
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      });
    }
    
    // Return user data
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}