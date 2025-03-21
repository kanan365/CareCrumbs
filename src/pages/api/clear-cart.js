import { connectToDatabase } from "../../lib/mongodb";
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
    
    const { db } = await connectToDatabase();
    
    // Delete all cart items for the current user
    const result = await db.collection("cart").deleteMany({ userId: session.user.id });
    
    return res.status(200).json({ 
      success: true,
      message: 'Cart cleared successfully',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Error clearing cart" });
  }
}