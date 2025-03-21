// pages/api/food-items.js
import { connectToDatabase } from "../../lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get user session for authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { db } = await connectToDatabase();

    // Fetch all non-expired food items (where expiryDate is greater than current date)
    const foodItems = await db.collection('foods')
      .find({
        expiryDate: { $gt: new Date() },
        // Add stock field to track available quantity
        stock: { $exists: true, $gt: 0 }
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Map the items to include a proper _id string and stock field
    const formattedItems = foodItems.map(item => {
      return {
        ...item,
        _id: item._id.toString(),
        // Ensure stock field exists, default to quantity if missing
        stock: item.stock !== undefined ? item.stock : item.quantity
      };
    });

    return res.status(200).json(formattedItems);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Server error', details: error.message });
  }
}