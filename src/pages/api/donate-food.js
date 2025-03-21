// pages/api/donate-food.js
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const session = await getServerSession(req, res, authOptions);
    
    // Validate session
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { 
      foodId, 
      donationDate, 
      organization, 
      location, 
      donorName, 
      userId,
      name,
      quantity,
      imageUrl
    } = req.body;

    // Validate required fields
    if (!foodId || !donationDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the food item to donate
    const foodItem = await db.collection("inventory").findOne({ 
      _id: new ObjectId(foodId),
      userId: userId  // Ensure the food belongs to the user
    });

    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    // Create donated food record
    const donatedFood = {
      name: name || foodItem.name,
      quantity: quantity || foodItem.quantity,
      donationDate: new Date(donationDate),
      organization: organization || null,
      location: location || null,
      donorName: donorName || "Anonymous",
      userId: userId,  // Store as string
      originalFoodId: foodId,
      imageUrl: imageUrl || foodItem.imageUrl,
      createdAt: new Date()
    };

    // Insert donated food record
    const result = await db.collection("donatedFood").insertOne(donatedFood);

    // Delete the food item from inventory
    await db.collection("inventory").deleteOne({ _id: new ObjectId(foodId) });

    return res.status(200).json({
      success: true,
      message: 'Food donated successfully',
      donatedFoodId: result.insertedId
    });
  } catch (error) {
    console.error("Error donating food:", error);
    return res.status(500).json({
      message: "Error donating food",
      error: error.message
    });
  }
}