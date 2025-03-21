// pages/api/delete-food.js
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { foodId } = req.query;
    
    if (!foodId) {
      return res.status(400).json({ message: 'Food ID is required' });
    }

    const { db } = await connectToDatabase();
    
    // Verify the food item belongs to the user
    const food = await db.collection("foods").findOne({
      _id: new ObjectId(foodId),
      userId: session.user.id
    });

    if (!food) {
      return res.status(404).json({ message: 'Food item not found or you do not have permission to delete it' });
    }

    // Delete the food item
    const result = await db.collection("foods").deleteOne({
      _id: new ObjectId(foodId),
      userId: session.user.id
    });

    if (result.deletedCount === 1) {
      return res.status(200).json({ message: 'Food item deleted successfully' });
    } else {
      return res.status(500).json({ message: 'Failed to delete food item' });
    }
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Error connecting to database" });
  }
}