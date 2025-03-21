import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Head from "next/head";
import { useState, useEffect } from "react";

export default function SearchFood() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [foodItems, setFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Fetch food items from the database
  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        const response = await fetch('/api/food-items');
        if (response.ok) {
          const data = await response.json();
          setFoodItems(data);
          setFilteredItems(data);
        } else {
          console.error('Failed to fetch food items');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching food items:', error);
        setLoading(false);
      }
    };
  
    // Fetch cart items
    const fetchCartItems = async () => {
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          setCart(data);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    if (session) {
      fetchFoodItems();
      fetchCartItems();
    }
  }, [session]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    const term = searchTerm.toLowerCase().trim();
    
    if (term === "") {
      setFilteredItems(foodItems);
    } else {
      const results = foodItems.filter(item => 
        item.name.toLowerCase().includes(term) || 
        (item.description && item.description.toLowerCase().includes(term))
      );
      setFilteredItems(results);
    }
    
    setSearchPerformed(true);
  };

  // Add item to cart
  const addToCart = async (foodItem, quantity) => {
    if (quantity <= 0 || quantity > foodItem.stock) {
      return; // Don't proceed if quantity is invalid
    }
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodItemId: foodItem._id,
          quantity: quantity,
          userId: session.user.id
        }),
      });

      if (response.ok) {
        // Update local cart state
        const existingItemIndex = cart.findIndex(item => item.foodItemId === foodItem._id);
        
        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedCart = [...cart];
          updatedCart[existingItemIndex].quantity += quantity;
          setCart(updatedCart);
        } else {
          // Add new item
          setCart([...cart, {
            foodItemId: foodItem._id,
            name: foodItem.name,
            quantity: quantity,
            imageUrl: foodItem.imageUrl
          }]);
        }
        
        // Update food item stock in the UI
        const updatedFoodItems = [...foodItems];
        const itemIndex = updatedFoodItems.findIndex(item => item._id === foodItem._id);
        if (itemIndex >= 0) {
          updatedFoodItems[itemIndex].stock -= quantity;
          // Reset selected quantity for this item
          updatedFoodItems[itemIndex].selectedQuantity = 0;
          setFoodItems(updatedFoodItems);
          
          // Also update filtered items
          const updatedFilteredItems = [...filteredItems];
          const filteredIndex = updatedFilteredItems.findIndex(item => item._id === foodItem._id);
          if (filteredIndex >= 0) {
            updatedFilteredItems[filteredIndex].stock -= quantity;
            updatedFilteredItems[filteredIndex].selectedQuantity = 0;
            setFilteredItems(updatedFilteredItems);
          }
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  // Handle quantity change for the selector
  const changeQuantity = (id, amount) => {
    // Update in filtered items
    const updatedFilteredItems = [...filteredItems];
    const itemIndex = updatedFilteredItems.findIndex(item => item._id === id);
    
    if (itemIndex >= 0) {
      const currentQuantity = updatedFilteredItems[itemIndex].selectedQuantity || 0;
      const maxStock = updatedFilteredItems[itemIndex].stock || 0;
      
      // Ensure quantity doesn't go below 0 or above available stock
      const newQuantity = Math.max(0, Math.min(maxStock, currentQuantity + amount));
      updatedFilteredItems[itemIndex].selectedQuantity = newQuantity;
      setFilteredItems(updatedFilteredItems);
    }
    
    // Also update in all food items
    const updatedFoodItems = [...foodItems];
    const allItemIndex = updatedFoodItems.findIndex(item => item._id === id);
    
    if (allItemIndex >= 0) {
      const currentQuantity = updatedFilteredItems[itemIndex].selectedQuantity;
      updatedFoodItems[allItemIndex].selectedQuantity = currentQuantity;
      setFoodItems(updatedFoodItems);
    }
  };

  if (!session) {
    router.push("/signin"); // Redirect to signin if not logged in
    return null;
  }

  return (
    <>
      <Head>
        <title>Care Crumbs - Search Food</title>
      </Head>
      <div className="main-content">
        <div id="navbar">
          <img src="/logo.svg" alt="Care Crumbs logo" className="logo"/>
          <h1>Search Food Items</h1>
          <div id="nav-icons">
            <Link href="/cart" className="nav-btn">
              <img src="/images/Cart.svg" alt="Cart" className="nav-icon" />
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </Link>
            <Link href="/profile" className="nav-btn">
              <img src="/images/Profile.svg" alt="Profile" className="nav-icon" />
            </Link>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search food items by name..."
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <img src="/images/Search.svg" alt="Search" className="search-icon" />
              </button>
            </div>
          </form>
        </div>

        {/* Food Items Section */}
        <div className="food-items-container">
          <h2>Search Results</h2>
          
          {loading ? (
            <p className="loading">Loading food items...</p>
          ) : searchPerformed && filteredItems.length === 0 ? (
            <div className="no-results">
              <img src="/images/no-results.svg" alt="No results" className="no-results-icon" />
              <p>No food items found matching "{searchTerm}"</p>
              <button className="reset-search" onClick={() => {
                setSearchTerm("");
                setFilteredItems(foodItems);
                setSearchPerformed(false);
              }}>
                Show All Items
              </button>
            </div>
          ) : (
            <div className="food-items-grid">
              {filteredItems.map((item) => (
                <div key={item._id} className="food-card">
                  <div className="food-image-container">
                    <img 
                      src={item.imageUrl || "/images/default-food.jpg"} 
                      alt={item.name} 
                      className="food-image" 
                    />
                  </div>
                  <div className="food-details">
                    <h3>{item.name}</h3>
                    <p className="food-description">{item.description || "No description available"}</p>
                    <p className="stock-info">
                      Available: <span className={item.stock > 0 ? "in-stock" : "out-of-stock"}>
                        {item.stock || 0} items
                      </span>
                    </p>
                    
                    <div className="quantity-control">
                      <button 
                        className="quantity-btn" 
                        onClick={() => changeQuantity(item._id, -1)}
                        disabled={!(item.selectedQuantity) || item.selectedQuantity <= 0}
                      >
                        -
                      </button>
                      <span className="quantity">{item.selectedQuantity || 0}</span>
                      <button 
                        className="quantity-btn" 
                        onClick={() => changeQuantity(item._id, 1)}
                        disabled={item.stock <= (item.selectedQuantity || 0)}
                      >
                        +
                      </button>
                    </div>
                    
                    <button 
                      className="add-to-cart-btn" 
                      onClick={() => addToCart(item, item.selectedQuantity || 0)}
                      disabled={!(item.selectedQuantity) || item.selectedQuantity <= 0 || item.stock <= 0}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Links with SVG Icons */}
        <div className="nav-buttons">
          <Link href="/homepage" className="btn">
            <img src="/images/Home.svg" alt="Home" className="icon" />
          </Link>
          <Link href="/search-food" className="btn active">
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

          .search-container {
            width: 90%;
            max-width: 800px;
            margin-top: 100px;
            margin-bottom: 20px;
          }

          .search-form {
            width: 100%;
          }

          .search-input-container {
            display: flex;
            position: relative;
            width: 100%;
          }

          .search-input {
            width: 100%;
            padding: 15px 60px 15px 20px;
            border-radius: 50px;
            border: 2px solid rgba(81, 80, 80, 0.5);
            background-color: rgba(255, 255, 255, 0.1);
            font-size: 16px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }

          .search-input:focus {
            outline: none;
            border-color: #ef6807;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
          }

          .search-btn {
            position: absolute;
            right: 5px;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            margin-right: 1px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .search-btn:hover {
            background-color: #ef6807;
          }

          .search-icon {
            width: 20px;
            height: 20px;
            filter: invert(1);
          }

          .food-items-container {
            width: 90%;
            max-width: 1200px;
            padding: 20px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          h2 {
            color: White;
            text-align: center;
            margin-bottom: 30px;
            font-size: 28px;
          }

          .loading {
            text-align: center;
            padding: 20px;
            font-size: 18px;
            color: #666;
          }

          .no-results {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px 20px;
            text-align: center;
          }

          .no-results-icon {
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
            opacity: 0.6;
          }

          .no-results p {
            font-size: 18px;
            color: #666;
            margin-bottom: 20px;
          }

          .reset-search {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.2s;
          }

          .reset-search:hover {
            background-color: #3e8e41;
          }

          .food-items-grid {
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
            display: flex;
            justify-content: center;
            align-items: center;
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

          .stock-info {
            color: white;
            font-weight: 500;
            margin-bottom: 15px;
          }
          
          .in-stock {
            color: #4CAF50;
            font-weight: bold;
          }
          
          .out-of-stock {
            color: #f44336;
            font-weight: bold;
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

          .add-to-cart-btn {
            width: 100%;
            padding: 10px 0;
            border: none;
            border-radius: 8px;
            background-color: #ef6807;
            color: white;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .add-to-cart-btn:hover:not(:disabled) {
            background-color: #3e8e41;
          }

          .add-to-cart-btn:disabled {
            background-color: rgba(255, 255, 255, 0.3);
            cursor: not-allowed;
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

          .btn.active {
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            padding: 10px;
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

            .food-items-grid {
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

            .food-items-container {
              width: 95%;
              padding: 15px;
            }

            .search-container {
              width: 95%;
              margin-top: 80px;
              margin-bottom: 15px;
            }

            .search-input {
              padding: 12px 50px 12px 15px;
              font-size: 14px;
            }

            .search-btn {
              width: 35px;
              height: 35px;
            }

            h2 {
              font-size: 22px;
              margin-bottom: 20px;
            }

            .no-results-icon {
              width: 80px;
              height: 80px;
            }

            .no-results p {
              font-size: 16px;
            }
          }
        `}</style>
      </div>
    </>
  );
}