import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Head from "next/head";
import { useState, useEffect } from "react";

export default function DonationForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [foodItemsData, setFoodItemsData] = useState({});
  const [showFoodItems, setShowFoodItems] = useState(false);
  const [donationDetails, setDonationDetails] = useState({
    city: "",
    area: "",
    foundation: "",
    notes: ""
  });

  // Fetch cart items from the database
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch('/api/cart', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCartItems(data);
          
          // Get details for all food items in cart
          if (data.length > 0) {
            fetchFoodDetails(data);
          } else {
            // If cart is empty, redirect to cart page
            router.push("/cart");
          }
        } else {
          console.error('Failed to fetch cart items');
          router.push("/cart");
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cart:', error);
        setLoading(false);
      }
    };

    if (session) {
      fetchCartItems();
    } else {
      router.push("/signin");
    }
  }, [session, router]);

  // Fetch detailed info for food items in cart
  const fetchFoodDetails = async (cartData) => {
    try {
      // Create a set of all food item IDs
      const foodItemIds = [...new Set(cartData.map(item => item.foodItemId))];
      
      // Fetch details for each food item
      const itemDetails = {};
      
      for (const id of foodItemIds) {
        const response = await fetch(`/api/food-items/${id}`, {
          credentials: 'include'
        });
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDonationDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle food items display
  const toggleFoodItems = () => {
    setShowFoodItems(prev => !prev);
  };

  // Process donation submission
  const processDonation = async (e) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      router.push("/cart");
      return;
    }

    // Validate required fields
    if (!donationDetails.city || !donationDetails.area || !donationDetails.foundation) {
      alert("Please fill all required fields");
      return;
    }

    try {
      // Debug logging - check session data
      console.log("Session data:", session);
      console.log("User ID being sent:", session?.user?.id);

      // Format cart items for donation
      const donationItems = cartItems.map(item => ({
        foodItemId: item.foodItemId,
        quantity: item.quantity,
        foodName: foodItemsData[item.foodItemId]?.name || item.name || "Unknown Food Item",
        imageUrl: foodItemsData[item.foodItemId]?.imageUrl || item.imageUrl
      }));

      // Prepare payload with optional chaining for safety
      const payload = {
        donationItems,
        userId: session?.user?.id, // Add optional chaining
        donationDate: new Date().toISOString(),
        city: donationDetails.city,
        area: donationDetails.area,
        foundation: donationDetails.foundation,
        notes: donationDetails.notes
      };

      console.log("Sending payload:", payload);

      // Send donation to API with credentials
      const response = await fetch('/api/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add Authorization header if you're using JWT 
          'Authorization': `Bearer ${session?.accessToken || ''}`
        },
        credentials: 'include', // Ensure cookies are sent with the request
        body: JSON.stringify(payload),
      });

      console.log("Donation response status:", response.status);

      if (response.ok) {
        // Clear cart after successful donation
        const clearCartResponse = await fetch('/api/clear-cart', {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (clearCartResponse.ok) {
          // Redirect to dashboard after successful donation
          router.push("/dashboard?donated=true");
        }
      } else {
        // Try to get detailed error information
        let errorMessage = "Unknown error";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        
        console.error("Donation failed:", response.status, errorMessage);
        alert(`Donation failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error processing donation:', error);
      alert("Failed to process donation. Please try again.");
    }
  };

  // Calculate total items
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!session) {
    return null; // Don't render anything if not logged in
  }

  return (
    <>
      <Head>
        <title>Donation Form - Care Crumbs</title>
      </Head>
      <div className="main-content">
        <div id="navbar">
          <img src="/logo.svg" alt="Care Crumbs logo" className="logo"/>
          <h1>Donation Form</h1>
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

        {/* Donation Form Container */}
        <div className="donation-form-container">
          {loading ? (
            <p className="loading">Loading cart items...</p>
          ) : (
            <>
              <h2>Complete Your Donation</h2>
              
              {/* Show Food Items Button */}
              <div className="show-foods-button-container">
                <button 
                  type="button" 
                  onClick={toggleFoodItems} 
                  className="show-foods-btn"
                >
                  {showFoodItems ? "Hide Food Items" : `Show Food Items (${totalItems})`}
                </button>
              </div>
              
              {/* Food Items Popup */}
              {showFoodItems && (
                <div className="food-items-popup">
                  <div className="food-items-popup-content">
                    <div className="popup-header">
                      <h3>Items You're Donating</h3>
                      <button 
                        type="button" 
                        onClick={toggleFoodItems} 
                        className="close-popup-btn"
                      >
                        &times;
                      </button>
                    </div>
                    
                    <div className="donation-items">
                      {cartItems.map((item) => {
                        const foodItem = foodItemsData[item.foodItemId] || {};
                        return (
                          <div key={item._id} className="donation-item">
                            <div className="donation-item-image">
                              <img 
                                src={item.imageUrl || foodItem.imageUrl || "/images/default-food.jpg"} 
                                alt={foodItem.name || item.name || "Food item"} 
                              />
                            </div>
                            <div className="donation-item-details">
                              <h4>{foodItem.name || item.name || "Food item"}</h4>
                              <p>Quantity: {item.quantity}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="donation-total">
                      <p>Total Items: <strong>{totalItems}</strong></p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Donation Details Form - Always Visible */}
              <form onSubmit={processDonation} className="donation-details-form">
                <h3>Donation Details</h3>
                
                <div className="form-group">
                  <label htmlFor="city">City <span className="required">*</span></label>
                  <input 
                    type="text" 
                    id="city" 
                    name="city" 
                    value={donationDetails.city} 
                    onChange={handleInputChange}
                    required 
                    placeholder="Enter city name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="area">Area<span className="required">*</span></label>
                  <input 
                    type="text" 
                    id="area" 
                    name="area" 
                    value={donationDetails.area} 
                    onChange={handleInputChange}
                    required 
                    placeholder="Enter area name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="foundation">Foundation/Organization <span className="required">*</span></label>
                  <input 
                    type="text" 
                    id="foundation" 
                    name="foundation" 
                    value={donationDetails.foundation} 
                    onChange={handleInputChange}
                    required 
                    placeholder="Enter foundation or organization name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Additional Notes</label>
                  <textarea 
                    id="notes" 
                    name="notes" 
                    value={donationDetails.notes} 
                    onChange={handleInputChange}
                    placeholder="Enter any additional notes or special instructions"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <a href="/cart" className="cancel-btn">
                    Cancel
                  </a>
                  <button type="submit" className="submit-donation-btn">
                    Donate
                  </button>
                </div>
              </form>
            </>
          )}
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
            min-height: 100vh;  
            margin: 0;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding-bottom: 150px;
            box-sizing: border-box;
          }
            
          #navbar {
            position: fixed;
            width: 100%;
            height: 70px;
            background-color: rgba(81, 80, 80, 0.3);
            backdrop-filter: blur(5px); 
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 100;
          }

          .logo {
            height: 10vh;
            margin-left: 20px;
          }
            
          #navbar h1 {
            color: white;
            font-size: 40px;
            font-family: 'Nighty Demo', sans-serif;
          }
          
          #nav-icons {
            width: 120px;
            height: 100px;
            margin-right: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
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

          .donation-form-container {
            width: 90%;
            max-width: 800px;
            margin-top: 100px;
            padding: 20px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          h2, h3 {
            color: white;
            text-align: center;
          }

          h2 {
            margin-bottom: 30px;
            font-size: 28px;
          }

          h3 {
            margin-bottom: 20px;
            font-size: 22px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }

          .loading {
            text-align: center;
            padding: 20px;
            font-size: 18px;
            color: #666;
          }

          /* Show Foods Button */
          .show-foods-button-container {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
          }

          .show-foods-btn {
          font-family: 'Nighty Demo';
            background-color: #ef6807;
            color: white;
            border: none;
            border-radius: 25px;
            padding: 12px 20px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition:  0.5s;
          }

          .show-foods-btn:hover {
            background-color:rgb(255, 255, 255);
            color: #ef6807;
          }

          /* Food Items Popup */
          .food-items-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .food-items-popup-content {
            background-color: #ef6807;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            border-radius: 15px;
            padding: 20px;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          }

          .popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .popup-header h3 {
            margin: 0;
            border: none;
          }

          .close-popup-btn {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: white;
          }

          .close-popup-btn:hover {
            color: #333;
          }

          .donation-items {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 300px;
            overflow-y: auto;
            padding: 10px 0;
          }

          .donation-item {
            display: flex;
            align-items: center;
            background-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border-radius: 35px;
            padding: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .donation-item-image {
            width: 60px;
            height: 60px;
            border-radius: 35px;
            overflow: hidden;
            margin-right: 15px;
          }

          .donation-item-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .donation-item-details h4 {
            margin: 0 0 5px 0;
            font-size: 1.5rem;
             color: #ef6807;
             background-color: rgba(255, 255, 255, 0.9);
             text-align: center;
             border-radius: 25px;
             padding:5px 15px;
          }

          .donation-item-details p {
            margin: 0;
            color: white;
          }

          .donation-total {
            margin-top: 15px;
            padding-top: 15px;
            color: white;
            border-top: 1px dashed white;
            font-size: 18px;
          }

          .donation-details-form {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 30px;
            padding: 20px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: white;
          }

          .required {
            color: #e74c3c;
          }

          

          .form-group input,
          .form-group textarea {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background-color: rgba(255, 255, 255, 0.1);
            font-size: 16px;
            box-sizing: border-box;
            color: white;
          }

          .form-group input:focus,
          .form-group textarea:focus {
            border-color: #4CAF50;
            outline: none;
          }

          .form-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            gap: 20px;
          }

          .cancel-btn,
          .submit-donation-btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            text-align: center;
            transition: background-color 0.2s;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
          }

          .cancel-btn {
            background-color: #f0f0f0;
            color: #333;
          }

          .cancel-btn:hover {
            background-color: #e0e0e0;
          }

          .submit-donation-btn {
            background-color: #4CAF50;
            color: white;
          }

          .submit-donation-btn:hover {
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
              font-size: 1.2rem;
            }

            .nav-icon, .icon {
              width: 20px;
              height: 20px;
            }

            #nav-icons {
              margin-right: 20px;
              width: 80px;
              height: 60px;
            }

            .donation-form-container {
              width: 95%;
              padding: 15px;
              margin-top: 80px;
            }

            h2 {
              font-size: 22px;
              margin-bottom: 20px;
            }

            h3 {
              font-size: 18px;
            }

            .form-actions {
              flex-direction: column;
            }

            .food-items-popup-content {
              width: 95%;
              max-height: 90vh;
            }
          }
        `}</style>
      </div>
    </>
  );
}