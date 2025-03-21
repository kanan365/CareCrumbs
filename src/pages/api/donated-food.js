// pages/api/donated-food.js
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  // Allow both GET and POST methods
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const session = await getServerSession(req, res, authOptions);
    
    // Get userId from session or request body
    let userId;
    
    if (session && session.user) {
      userId = session.user.id || session.user._id;
    } else if (req.body && req.body.userId) {
      userId = req.body.userId;
    } else {
      // Log the lack of authentication
      console.log("No authenticated user found in session or request body");
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    console.log("Looking for donated foods with userId:", userId); // Debug log
    
    // Check if userId exists before trying to use it
    if (!userId) {
      console.log("UserId is undefined or null after extraction");
      return res.status(400).json({ message: 'User ID is missing or invalid' });
    }
    
    // Create a flexible query that works with both string and ObjectId
    const query = { 
      $or: [
        { userId: userId } // Try with userId directly
      ]
    };
    
    // Only add toString conversion if userId exists
    try {
      query.$or.push({ userId: userId.toString() });
    } catch (e) {
      console.log("Could not convert userId to string:", e.message);
    }
    
    // Only try ObjectId if userId appears to be a valid ObjectId format
    if (typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
      query.$or.push({ userId: new ObjectId(userId) });
    }
    
    const donatedItems = await db
      .collection("donatedFood")
      .find(query)
      .sort({ donationDate: -1 })
      .toArray();
    
    console.log(`Found ${donatedItems.length} donated items`); // Debug log
    
    return res.status(200).json({
      success: true,
      donatedFood: donatedItems
    });
  } catch (error) {
    console.error("Error fetching donated items:", error);
    return res.status(500).json({
      message: "Error fetching donated items",
      error: error.message
    });
  }
}