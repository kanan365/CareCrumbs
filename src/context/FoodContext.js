// context/FoodContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const FoodContext = createContext();

// Provider component
export function FoodProvider({ children }) {
  // Cart state
  const [cartItems, setCartItems] = useState([]);
  
  // Food items data
  const [foodItems, setFoodItems] = useState([
    {
      id: 1,
      name: "Burger",
      price: 8.99,
      image: "/images/burger.png",
      description: "Delicious beef burger with cheese, lettuce, and tomato"
    },
    {
      id: 2,
      name: "Burger",
      price: 8.99,
      image: "/images/burger.png",
      description: "Delicious beef burger with cheese, lettuce, and tomato"
    },
    {
      id: 3,
      name: "Burger",
      price: 8.99,
      image: "/images/burger.png",
      description: "Delicious beef burger with cheese, lettuce, and tomato"
    },
    {
      id: 4,
      name: "Burger",
      price: 8.99,
      image: "/images/burger.png",
      description: "Delicious beef burger with cheese, lettuce, and tomato"
    },
    {
      id: 5,
      name: "Burger",
      price: 8.99,
      image: "/images/burger.png",
      description: "Delicious beef burger with cheese, lettuce, and tomato"
    },
    {
      id: 6,
      name: "Burger",
      price: 8.99,
      image: "/images/burger.png",
      description: "Delicious beef burger with cheese, lettuce, and tomato"
    },
    {
      id: 7,
      name: "Burger",
      price: 8.99,
      image: "/images/burger.png",
      description: "Delicious beef burger with cheese, lettuce, and tomato"
    },
    {
      id: 8,
      name: "Burger",
      price: 8.99,
      image: "/images/burger.png",
      description: "Delicious beef burger with cheese, lettuce, and tomato"
    },
    {
      id: 9,
      name: "Burger",
      price: 8.99,
      image: "/images/burger.png",
      description: "Delicious beef burger with cheese, lettuce, and tomato"
    },
    {
      id: 10,
      name: "Burger",
      price: 8.99,
      image: "/images/burger.png",
      description: "Delicious beef burger with cheese, lettuce, and tomato"
    }
  ]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error parsing cart data from localStorage:", error);
        localStorage.removeItem('cartItems');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart
  const addToCart = (foodItem) => {
    // Check if the item is already in the cart
    const existingItem = cartItems.find(item => item.id === foodItem.id);
    
    if (existingItem) {
      // If it exists, update the quantity
      updateQuantity(foodItem.id, existingItem.quantity + 1);
    } else {
      // If it doesn't exist, add it with quantity 1
      setCartItems([...cartItems, { ...foodItem, quantity: 1 }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  // Update quantity of an item in the cart
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Create the context value with all necessary properties and functions
  const contextValue = {
    foodItems,
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  // Provide the context value to children
  return (
    <FoodContext.Provider value={contextValue}>
      {children}
    </FoodContext.Provider>
  );
}

// Custom hook to use the food context
export function useFood() {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFood must be used within a FoodProvider');
  }
  return context;
}