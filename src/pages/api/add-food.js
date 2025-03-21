import { connectToDatabase } from "../../lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  // Get user session for authentication using the server-side method
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const { db } = await connectToDatabase();
    const {
      name,
      quantity,
      manufactureDate,
      expiryDate,
      daysUntilExpiry,
      imageUrl,
      userId,
      description
    } = req.body;
    
    // Validate required fields
    if (!name || !quantity || !manufactureDate || !expiryDate || !imageUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Use session.user.id if userId is not provided
    const userIdentifier = userId || session.user.id;
    
    // Insert food item into database with days until expiry field
    const result = await db.collection('foods').insertOne({
      name,
      quantity: parseInt(quantity),
      // Add stock field to track available quantity
      stock: parseInt(quantity),
      manufactureDate: new Date(manufactureDate),
      expiryDate: new Date(expiryDate),
      daysUntilExpiry: daysUntilExpiry || 0, // Store the days until expiry
      imageUrl,
      description: description || "",
      userId: userIdentifier,
      createdAt: new Date()
    });
    
    // Set up scheduled deletion of expired food items
    // This creates a TTL (Time To Live) index on the expiryDate field if it doesn't exist
    const indexExists = await db.collection('foods').indexExists('expiryDate_ttl');
    if (!indexExists) {
      await db.collection('foods').createIndex({ "expiryDate": 1 }, { expireAfterSeconds: 0, name: "expiryDate_ttl" });
    }
    
    return res.status(201).json({
      message: 'Food added successfully',
      foodId: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Server error', details: error.message });
  }
}