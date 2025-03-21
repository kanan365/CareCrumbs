// pages/api/get-inventory.js
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import { getSession } from "next-auth/react";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    const inventory = await db
      .collection("foods")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ 
      inventory: inventory.map(item => ({
        ...item,
        _id: item._id.toString()
      }))
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Error connecting to database" });
  }
}