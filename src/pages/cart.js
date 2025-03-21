import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Head from "next/head";
import { useState, useEffect } from "react";

export default function Cart() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [foodItemsData, setFoodItemsData] = useState({});

  // Fetch cart items from the database
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          setCartItems(data);

          // Get details for all food items in cart
          fetchFoodDetails(data);
        } else {
          console.error('Failed to fetch cart items');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cart:', error);
        setLoading(false);
      }
    };

    if (session) {
      fetchCartItems();
    }
  }, [session]);

  // Fetch detailed info for food items in cart
  const fetchFoodDetails = async (cartData) => {
    try {
      // Create a set of all food item IDs
      const foodItemIds = [...new Set(cartData.map(item => item.foodItemId))];

      // Fetch details for each food item
      const itemDetails = {};

      for (const id of foodItemIds) {
        const response = await fetch(`/api/food-items/${id}`);
        if (response.ok) {
          const data = await response.json();
          itemDetails[id] = data;
        }
      }

      setFoodItemsData(itemDetails);
    } catch (error) {
      console.error('Error fetching food details:', error);
    }
  };

  // Update item quantity in cart
  const updateQuantity = async (cartItemId, newQuantity, foodItemId, currentQuantity) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItemId,
          quantity: newQuantity
        }),
      });

      if (response.ok) {
        // Update local cart state
        setCartItems(prevItems => prevItems.map(item =>
          item._id === cartItemId ? { ...item, quantity: newQuantity } : item
        ));

        // Update food item data local state if we have it
        if (foodItemsData[foodItemId]) {
          const quantityDiff = newQuantity - currentQuantity;
          setFoodItemsData(prev => ({
            ...prev,
            [foodItemId]: {
              ...prev[foodItemId],
              stock: prev[foodItemId].stock - quantityDiff
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId) => {
    try {
      const cartItem = cartItems.find(item => item._id === cartItemId);

      if (!cartItem) return;

      const response = await fetch(`/api/cart?id=${cartItemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update local cart state
        setCartItems(prevItems => prevItems.filter(item => item._id !== cartItemId));

        // Update food item stock in local state if we have it
        const foodItemId = cartItem.foodItemId;
        if (foodItemsData[foodItemId]) {
          setFoodItemsData(prev => ({
            ...prev,
            [foodItemId]: {
              ...prev[foodItemId],
              stock: prev[foodItemId].stock + cartItem.quantity
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  // Process donation (replaces checkout)
  // In Cart.js, replace the processDonation function with this:
  const goToDonationForm = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // Redirect to the donation form page
    router.push("/donation-form");
  };



  // Calculate total items
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!session) {
    router.push("/signin"); // Redirect to signin if not logged in
    return null;
  }

  return (
    <>
      <Head>
        <title>Cart - Care Crumbs</title>
      </Head>
      <div className="main-content">
        <div id="navbar">
          <img src="/logo.svg" alt="Care Crumbs logo" className="logo" />
          <h1>Your Cart</h1>
          <div id="nav-icons">
            <Link href="/cart" className="nav-btn">
              <img src="/images/Cart.svg" alt="Cart" className="nav-icon" />
              {cartItems.length > 0 && <span className="cart-badge">{cartItems.length}</span>}
            </Link>
            <Link href="/profile" className="nav-btn">
              <img src="/images/Profile.svg" alt="Profile" className="nav-icon" />
            </Link>
          </div>
        </div>

        {/* Cart Items Section */}
        <div className="cart-items-container">
          <h2>Items in Your Cart</h2>

          {loading ? (
            <p className="loading">Loading cart items...</p>
          ) : cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <a href="/homepage" className="continue-shopping-btn">
                Continue Shopping
              </a>
            </div>
          ) : (
            <>
              <div className="cart-items-grid">
                {cartItems.map((item) => {
                  const foodItem = foodItemsData[item.foodItemId] || {};
                  return (
                    <div key={item._id} className="food-card">
                      <div className="food-image-container">
                        <img
                          src={item.imageUrl || foodItem.imageUrl || "/images/default-food.jpg"}
                          alt={foodItem.name || item.name || "Food item"}
                          className="food-image"
                        />
                      </div>
                      <div className="food-details">
                        <h3>{foodItem.name || item.name || "Food item"}</h3>
                        <p className="food-description">
                          {foodItem.description || "No description available"}
                        </p>

                        <div className="quantity-control">
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item._id, item.quantity - 1, item.foodItemId, item.quantity)}
                          >
                            -
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item._id, item.quantity + 1, item.foodItemId, item.quantity)}
                            disabled={foodItem.stock <= 0}
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="remove-btn"
                          onClick={() => removeFromCart(item._id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Total Items:</span>
                  <span>{totalItems}</span>
                </div>

                <div className="cart-actions">
                  <a href="/homepage" className="continue-shopping-btn">
                    Continue Shopping
                  </a>
                  <button onClick={goToDonationForm} className="donate-btn">
                    Proceed to Donate
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="nav-buttons">
          <Link href="/homepage" className="btn">
            <img src="/images/Home.svg" alt="Home" className="icon" />
          </Link>
          <Link href="/search-food" className="btn">
            <img src="/images/Search.svg" alt="Search Food" className="icon" />
          </Link>
          <Link href="/cart" className="btn">
            <img src="/images/Cart.svg" alt="Cart" className="icon" />
          </Link>

          <Link href="/dashboard" className="btn">
            <img src="/images/Dashboard.svg" alt="Dashboard" className="icon" />
          </Link>
          <Link href="/profile" className="btn">
            <img src="/images/Profile.svg" alt="Profile" className="icon" />
          </Link>
        </div>


        <style jsx global>{`
          body {
            margin: 0;
            padding: 0; 
            box-sizing: border-box;
            font-family: 'Nighty Demo', sans-serif;
            background-image: url('/images/Homepagemain.svg');
            background-size: cover;
            background-repeat: no-repeat;
            background-attachment: fixed;
            width: 100%;
            height: 100%;
          }
        `}</style>

        <style jsx>{`
          .main-content {
            display: flex;
            height: 100vh;  
            margin: 0;
            flex-direction: column;
            align-items: center;
            width: 100%;
            justify-content: cenetr;
          }
            
           #navbar{
            position: fixed;
            width: 100%;
            height: 70px;
            background-color: rgba(81, 80, 80, 0.3);
            backdrop-filter: blur(5px); 
            display: flex;
            align-items: center;
            justify-content: space-between;
            justify-content: space-betwee;z-index: 100;
          }

          .logo{
            height: 10vh;
            margin-left: 20px;
          }

          #navbar h1{
            color: white;
            font-size: 40px;
            font-family: 'Nighty Demo', sans-serif;
          }
          
          #nav-icons{
            width: 120px;
            height: 100px;
            margin-right: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

        .nav-buttons {
         position: fixed;
         bottom: 50px;
         left: 50%;
         transform: translateX(-50%);
         width: 50%; /* Default width is 50% of the viewport */
         max-width: 800px; /* Limits the width for larger screens */
         height: 8vh; /* Default height is 8% of the viewport height */
         background-color: rgba(84, 82, 82, 0.3);
         backdrop-filter: blur(5px);
         color: white;
         display: flex;
         justify-content: space-between;
         align-items: center;
         border-radius: 50px;
         padding: 0 5vw; /* Default padding based on viewport width */
         z-index: 100;
         box-sizing: border-box; /* Ensures padding is included in width/height calculations */
          }


          .nav-icon, .icon {
            width: 30px;
            height: 30px;
            transition: 0.3s; 
                  
            }
          .nav-icon, .icon:hover {
            width: 35px;
            height: 35px;
            
          }

          .btn, .nav-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .social-btn {
            background-color: rgba(255, 255, 255, 0.1);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            transition: all 0.3s ease;
          }

          .social-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
            
          }

          .social-btn {
            background-color: rgba(255, 255, 255, 0.1);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            transition: all 0.3s ease;
          }

          .social-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
            
          }

          .cart-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background-color: #ff6b6b;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }

          .cart-items-container {
            width: 90%;
            max-width: 1200px;
            margin-top: 100px;
            padding: 20px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          h2 {
            color: #ef6807;
            text-align: center;
            margin-bottom: 30px;
            font-size: 28px;
          }

          .loading, .empty-cart {
            text-align: center;
            padding: 20px;
            font-size: 18px;
            color: #666;
          }

          .empty-cart {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }

          .cart-items-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 25px;
          }

          .food-card {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .food-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          }

          .food-image-container {
            height: 50%;
            display:flex;
            justify-content: center;
            align-items: center;
            border-radius: 25px;
          }

          .food-image {
            width: 80%;
            height: 80%;
            object-fit: cover;
            border-radius: 25px;
            transition: transform 0.3s ease;
          }

          .food-card:hover .food-image {
            transform: scale(1.05);
          }

          .food-details {
            padding: 15px;
          }

          .food-details h3 {
            margin: 0 0 10px;
            color: #ef6807;
            font-size: 20px;
          }

          .food-description {
            color: white;
            font-size: 14px;
            margin-bottom: 10px;
            height: 40px;
            overflow: hidden;
          }

          .quantity-control {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            justify-content: center;
          }

          .quantity-btn {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: none;
            background-color: rgba(255, 255, 255, 0.3);
            color: #333;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
          }

          .quantity-btn:hover:not(:disabled) {
            background-color: #ef6807;
          }

          .quantity-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .quantity {
            margin: 0 15px;
            font-size: 18px;
            font-weight: 500;
            width: 30px;
            text-align: center;
            color: white;
          }

          .remove-btn {
          font-family: 'Nighty demo';
            width: 100%;
            padding: 5px 0 8px 0;
            border: none;
            border-radius: 25px;
            background-color: #ef6807;
            color: white;
            font-size: 1.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .remove-btn:hover {
            background-color: #ff5252;
          }

          .cart-summary {
            margin-top: 30px;
            background-color: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 18px;
            font-weight: 500;
            color: white;
            border-bottom: 1px solid #eee;
          }

          .cart-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            gap: 20px;
          }

           .continue-shopping-btn , .donate-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-family: 'Nighty demo';
            font-size: 1.5rem;
            font-weight: 500;
            cursor: pointer;
            text-align: center;
            transition: background-color 0.2s;
            text-decoration: none;
            flex: 1;
          }

          

          .continue-shopping-btn {
            background-color: #f0f0f0;
            color: #ef6807;
          }

          .continue-shopping-btn:hover {
            background-color: #ef6807;
            color: white;
          }

          .donate-btn {
            background-color: #ef6807;
            color: white;
          }

          .donate-btn:hover {
            background-color: #3e8e41;
          }

          .nav-buttons {
            position: fixed;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            width: 50%;
            max-width: 800px;
            height: 8vh;
            background-color: rgba(84, 82, 82, 0.3);
            backdrop-filter: blur(5px);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 50px;
            padding: 0 5vw;
            z-index: 100;
            box-sizing: border-box;
          }

          .nav-icon, .icon {
            width: 30px;
            height: 30px;
            transition: 0.3s;        
          }
          
          .btn, .nav-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
          }

          @media (max-width: 768px) {
            .nav-buttons {
              width: 80%;
            }

            #navbar {
              height: 9vh;
              gap: 20px;
            }

            .logo {
              height: 8vh;
              margin-left: 10px;
            }

            #navbar h1 {
              font-size: 1rem;
            }

            .nav-icon, .icon {
              width: 20px;
              height: 20px;
            }

            .cart-items-grid {
              grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
              gap: 15px;
            }

            .food-image-container {
              height: 140px;
            }

            .food-details h3 {
              font-size: 16px;
            }

            .food-description {
              font-size: 12px;
              height: 32px;
            }

            #nav-icons {
              margin-right: 20px;
              width: 80px;
              height: 60px;
            }

            .cart-items-container {
              width: 95%;
              padding: 15px;
              margin-top: 80px;
            }

            h2 {
              font-size: 22px;
              margin-bottom: 20px;
            }

            .cart-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    </>
  );
}