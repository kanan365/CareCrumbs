// pages/api/food-items/[id].js
import { connectToDatabase } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the food item ID from the URL
  const { id } = req.query;

  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid food item ID' });
  }

  // Get user session for authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { db } = await connectToDatabase();

    // Find the food item by ID
    const foodItem = await db.collection('foods').findOne({
      _id: new ObjectId(id)
    });

    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    // Convert the MongoDB _id to a string
    const formattedItem = {
      ...foodItem,
      _id: foodItem._id.toString(),
      // Ensure stock field exists, default to quantity if missing
      stock: foodItem.stock !== undefined ? foodItem.stock : foodItem.quantity
    };

    return res.status(200).json(formattedItem);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}