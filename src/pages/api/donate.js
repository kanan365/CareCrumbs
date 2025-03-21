import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]"; // Make sure this path is correct for your project

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Get session using next-auth's getServerSession (more reliable than getSession)
    const session = await getServerSession(req, res, authOptions);
    
    console.log("Server session data:", session);
    
    // If no session exists but there's a token in the cookies, try to use that
    if (!session) {
      console.log("No session found. Checking request body for user information...");
      
      // Check if user info is in the request body
      const { userId, userEmail } = req.body;
      
      if (!userId && !userEmail) {
        console.error("No authentication information available");
        return res.status(401).json({ message: 'Unauthorized - No session found' });
      }
      
      // Continue with the user info from the request body
      console.log("Using user info from request body:", { userId, userEmail });
    }
    
    // Extract data from request body
    const { donationItems, userId, userEmail, donationDate, city, area, foundation, notes } = req.body;
    
    // Debug logs
    console.log("Request body:", req.body);
    
    if (!donationItems || !Array.isArray(donationItems) || donationItems.length === 0) {
      return res.status(400).json({ message: 'Invalid donation data - Empty or invalid donation items' });
    }
    
    const { db } = await connectToDatabase();
    
    // Determine user ID and name with fallbacks
    let donorId;
    let donorName = "Anonymous";
    let userRecord;
    
    if (session && session.user) {
      // Try to get user ID and name from session
      donorId = session.user.id || session.user._id;
      donorName = session.user.name || "Anonymous";
      console.log("Using session user ID:", donorId, "and name:", donorName);
    } else if (userEmail) {
      // Try to look up user by email
      userRecord = await db.collection("users").findOne({ email: userEmail });
      if (userRecord) {
        donorId = userRecord._id.toString();
        donorName = userRecord.name || "Anonymous";
        console.log("Found user by email:", donorId, "and name:", donorName);
      }
    } else if (userId) {
      // Use provided userId
      try {
        // Check if userId is valid
        userRecord = await db.collection("users").findOne({ 
          $or: [
            { _id: new ObjectId(userId) },
            { _id: userId }
          ]
        });
        
        if (userRecord) {
          donorId = userRecord._id.toString();
          donorName = userRecord.name || "Anonymous";
          console.log("Found user by ID:", donorId, "and name:", donorName);
        }
      } catch (error) {
        console.error("Error validating userId:", error);
      }
    }
    
    // If we still don't have a valid donorId, create a temporary one
    if (!donorId) {
      console.warn("No valid user ID found. Using anonymous donation.");
      donorId = "" + new Date().getTime();
    }
    
    // Format the location string
    const location = [city, area].filter(Boolean).join(", ");
    
    // Insert each donation item into the donatedFood collection with all details
    const donationRecords = donationItems.map(item => ({
      userId: donorId,
      donorName: donorName,
      foodItemId: item.foodItemId,
      name: item.foodName, // Store as 'name' for consistency with frontend
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      donationDate: new Date(donationDate),
      location: location,
      organization: foundation || "",
      notes: notes || "",
      createdAt: new Date()
    }));
    
    console.log("Prepared donation records:", donationRecords);
    
    const result = await db.collection("donatedFood").insertMany(donationRecords);
    console.log("Donation saved result:", result);
    
    // Update food item stock in the inventory
    for (const item of donationItems) {
      try {
        await db.collection("foodItems").updateOne(
          { _id: new ObjectId(item.foodItemId) },
          { $inc: { stock: -item.quantity } }
        );
      } catch (error) {
        console.error(`Error updating stock for item ${item.foodItemId}:`, error);
        // Continue with other items even if one fails
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Donation processed successfully',
      donationIds: Object.values(result.insertedIds).map(id => id.toString())
    });
    
  } catch (error) {
    console.error("Database error in donate API:", error);
    return res.status(500).json({ 
      message: "Error processing donation",
      error: error.message 
    });
  }
}