// components/card.js
import React from "react";
import { useRouter } from "next/router";

export default function FoodCard({ item, addToCart }) {
  const router = useRouter();

  const handleAddToCart = () => {
    // Show loader (you can implement a global loading state)
    document.getElementById("loader").style.display = "block";
    
    // Simulate loading (replace with actual API call)
    setTimeout(() => {
      addToCart(item);
      document.getElementById("loader").style.display = "none";
    }, 500);
  };

  return (
    <div className="food-card">
      <img src={item.image} alt={item.name} className="food-image" />
      <h2 className="food-name">{item.name}</h2>
      <p className="food-price">₹{item.price}</p>
      <button className="add-to-cart-btn" onClick={handleAddToCart}>
        <img src="/images/Cart.svg" alt="Cart" className="cart-icon" />
        Add to cart
      </button>

      <style jsx>{`
        .food-card {
          background-color: rgba(51, 51, 51, 0.8);
          border-radius: 15px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          transition: transform 0.3s ease;
        }
        
        .food-card:hover {
          transform: translateY(-5px);
        }
        
        .food-image {
          width: 100%;
          height: 180px;
          border-radius: 10px;
          object-fit: cover;
          margin-bottom: 15px;
        }
        
        .food-name {
          color: white;
          font-family: serif;
          font-size: 28px;
          font-weight: bold;
          margin: 10px 0 5px;
          text-align: center;
        }
        
        .food-price {
          color: #FF6B00;
          font-size: 22px;
          font-weight: bold;
          margin: 0 0 15px;
        }
        
        .add-to-cart-btn {
          background-color: #FF6B00;
          color: white;
          border: none;
          border-radius: 25px;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.3s ease;
          width: 80%;
          margin-top: auto;
        }
        
        .add-to-cart-btn:hover {
          background-color: #FF8C00;
        }
        
        .cart-icon {
          width: 20px;
          height: 20px;
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
}