// pages/api/cart.js
import { connectToDatabase } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const { method } = req;
  
  try {
    const { db } = await connectToDatabase();
    
    // Get the session using getServerSession instead of getSession
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = session.user.id;
    
    // GET - Fetch cart items for the current user
    if (method === 'GET') {
      const cartItems = await db
        .collection('cart')
        .find({ userId })
        .toArray();
      
      return res.status(200).json(cartItems);
    }
    
    // POST - Add item to cart
    if (method === 'POST') {
      const { foodItemId, quantity } = req.body;
      
      if (!foodItemId || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if item already exists in cart
      const existingItem = await db
        .collection('cart')
        .findOne({ foodItemId, userId });
      
      if (existingItem) {
        // Update quantity of existing item
        await db.collection('cart').updateOne(
          { foodItemId, userId },
          { $inc: { quantity: parseInt(quantity) } }
        );
      } else {
        // Get food item details to store name and image in cart
        const foodItem = await db.collection('foods').findOne({ _id: new ObjectId(foodItemId) });
        
        if (!foodItem) {
          return res.status(404).json({ error: 'Food item not found' });
        }
        
        // Add new item to cart
        await db.collection('cart').insertOne({
          foodItemId,
          userId,
          name: foodItem.name,
          imageUrl: foodItem.imageUrl,
          quantity: parseInt(quantity),
          createdAt: new Date()
        });
      }
      
      // Update food item stock
      await db.collection('foods').updateOne(
        { _id: new ObjectId(foodItemId) },
        { $inc: { stock: -parseInt(quantity) } }
      );
      
      return res.status(200).json({ success: true });
    }
    
    // PUT - Update cart item quantity
    if (method === 'PUT') {
      const { cartItemId, quantity } = req.body;
      
      if (!cartItemId || quantity === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Get current cart item to calculate stock change
      const currentItem = await db.collection('cart').findOne({ 
        _id: new ObjectId(cartItemId), 
        userId 
      });
      
      if (!currentItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      
      const quantityDiff = parseInt(quantity) - currentItem.quantity;
      
      // Update cart item quantity
      await db.collection('cart').updateOne(
        { _id: new ObjectId(cartItemId), userId },
        { $set: { quantity: parseInt(quantity) } }
      );
      
      // Update food item stock
      await db.collection('foods').updateOne(
        { _id: new ObjectId(currentItem.foodItemId) },
        { $inc: { stock: -quantityDiff } }
      );
      
      return res.status(200).json({ success: true });
    }
    
    // DELETE - Remove item from cart
    if (method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing item id' });
      }
      
      // Get current cart item to update stock
      const cartItem = await db.collection('cart').findOne({ 
        _id: new ObjectId(id), 
        userId 
      });
      
      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      
      // Delete the cart item
      await db.collection('cart').deleteOne({ _id: new ObjectId(id), userId });
      
      // Update food item stock
      await db.collection('foods').updateOne(
        { _id: new ObjectId(cartItem.foodItemId) },
        { $inc: { stock: cartItem.quantity } }
      );
      
      return res.status(200).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling cart operation:', error);
    res.status(500).json({ error: 'Failed to process cart operation', details: error.message });
  }
}