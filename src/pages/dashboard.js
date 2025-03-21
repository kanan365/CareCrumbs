import { useSession, signOut, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// PDF styles remain unchanged
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#FE6807',
  },
  subheader: {
    fontSize: 18,
    marginBottom: 10,
    color: '#FE6807',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    borderBottomStyle: 'solid',
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
  },
  tableCol: {
    width: '20%',
    padding: 5,
  },
  tableCell: {
    fontSize: 10,
    padding: 5,
  },
  footer: {
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
    color: '#555',
  },
});

// Updated PDF Document for donated food to include donor info and organization details
const DonatedFoodPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Care Crumbs</Text>
      <Text style={styles.subheader}>Donated Food Report</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Food Name</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Quantity</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Donation Date</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Donor</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Organization</Text>
          </View>
        </View>

        {data.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.name}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.quantity}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{new Date(item.donationDate).toLocaleDateString()}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.donorName || 'Anonymous'}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.organization || 'Not specified'}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.footer}>Generated on {new Date().toLocaleDateString()}</Text>
    </Page>
  </Document>
);

// Other PDF components remain unchanged
const InventoryPDF = ({ data, title }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Care Crumbs</Text>
      <Text style={styles.subheader}>{title}</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Food Name</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Quantity</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Added Date</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Expiry Date</Text>
          </View>
        </View>

        {data.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.name}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{item.quantity}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{new Date(item.expiryDate).toLocaleDateString()}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.footer}>Generated on {new Date().toLocaleDateString()}</Text>
    </Page>
  </Document>
);


export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState(null);

  // State for food form
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [daysUntilExpiry, setDaysUntilExpiry] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);

  // State for inventory and donated food - always set to track-inventory by default
  const [activeTab, setActiveTab] = useState("track-inventory");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [donatedItems, setDonatedItems] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // New state for donation form
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationOrganization, setDonationOrganization] = useState("");
  const [donationLocation, setDonationLocation] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState(null);

  useEffect(() => {
    // Get session on component mount to ensure we have the latest data
    const fetchSession = async () => {
      const sessionData = await getSession();
      if (sessionData) {
        setUserData(sessionData.user);
      }
    };

    fetchSession();
    setIsClient(true);

    // Fetch inventory data with silent error handling for a professional experience
    fetchInventory();
    fetchDonatedFood();

  }, []);

  // Fetch inventory data with improved error handling
  const fetchInventory = async () => {
    setDataLoading(true);
    try {
      const response = await fetch('/api/get-inventory');
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.inventory);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      // Silently handle errors, don't show to user for professional experience
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch donated food data with improved error handling
  const fetchDonatedFood = async () => {
    setDataLoading(true);
    try {
      const response = await fetch('/api/donated-food');
      if (response.ok) {
        const data = await response.json();
        setDonatedItems(data.donatedFood);
        console.log("Donated food data:", data.donatedFood); // Debug log
      } else {
        console.error("Error fetching donated food:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching donated food:", error);
      // Silently handle errors
    } finally {
      setDataLoading(false);
    }
  };

  // Check if session exists before rendering
  useEffect(() => {
    if (!session && typeof window !== 'undefined') {
      router.push("/signin"); // Redirect if not logged in
    }
  }, [session, router]);

  // Effect to refetch data when tab changes
  useEffect(() => {
    if (activeTab === 'track-inventory') {
      fetchInventory();
    } else if (activeTab === 'donated-food') {
      fetchDonatedFood();
    }
  }, [activeTab]);

  if (!session) {
    return <div className="loading">Loading...</div>; // Show loading state while checking session
  }

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate expiry date based on manufacture date and days until expiry
  const calculateExpiryDate = (manufactureDate, daysUntilExpiry) => {
    const mDate = new Date(manufactureDate);
    const expiryDate = new Date(mDate);
    expiryDate.setDate(expiryDate.getDate() + parseInt(daysUntilExpiry));
    return expiryDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      // Validate form
      if (!foodName || !quantity || !manufactureDate || !daysUntilExpiry || !image) {
        setMessage({ text: "Please fill all fields", type: "error" });
        setLoading(false);
        return;
      }

      // Create form data for image upload
      const formData = new FormData();
      formData.append("image", image);

      // Upload image first
      const imageUploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!imageUploadResponse.ok) {
        throw new Error('Image upload failed');
      }

      const { imageUrl } = await imageUploadResponse.json();

      // Calculate expiry date from manufacture date and days until expiry
      const expiryDate = calculateExpiryDate(manufactureDate, daysUntilExpiry);

      // Add food to database
      const response = await fetch('/api/add-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: foodName,
          quantity: quantity,
          manufactureDate: manufactureDate,
          expiryDate: expiryDate,
          daysUntilExpiry: parseInt(daysUntilExpiry),
          imageUrl: imageUrl,
          userId: session.user.id,
          createdAt: new Date()
        }),
      });

      if (response.ok) {
        setMessage({ text: "Food added successfully!", type: "success" });
        // Reset form
        setFoodName("");
        setQuantity("");
        setManufactureDate("");
        setDaysUntilExpiry("");
        setImage(null);
        setImagePreview(null);

        // Refresh inventory data
        fetchInventory();
      } else {
        throw new Error('Failed to add food');
      }
    } catch (error) {
      console.error('Error adding food:', error);
      setMessage({ text: error.message || "Failed to add food", type: "error" });
    }

    setLoading(false);
  };

  // Delete food item
  const deleteFood = async (foodId) => {
    if (confirm("Are you sure you want to delete this food item?")) {
      setDeleteLoading(true);
      try {
        const response = await fetch(`/api/delete-food?foodId=${foodId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Refresh inventory data
          fetchInventory();
          alert("Food item deleted successfully!");
        } else {
          throw new Error('Failed to delete food item');
        }
      } catch (error) {
        console.error('Error deleting food:', error);
        alert(error.message || "Failed to delete food item");
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // Toggle form visibility
  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      setActiveTab("track-inventory");
    }
  };

  // Open donation form
  const openDonationForm = (foodId) => {
    setSelectedFoodId(foodId);
    setShowDonationForm(true);
  };

  // Close donation form
  const closeDonationForm = () => {
    setShowDonationForm(false);
    setDonationOrganization("");
    setDonationLocation("");
    setSelectedFoodId(null);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowForm(false);
    setShowDonationForm(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Donate food item with organization details
  const donateFood = async (e) => {
    e.preventDefault();

    if (!selectedFoodId) {
      alert("No food item selected for donation");
      return;
    }

    try {
      const response = await fetch('/api/donate-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodId: selectedFoodId,
          donationDate: new Date().toISOString(),
          organization: donationOrganization,
          location: donationLocation,
          donorName: session.user.name || "Anonymous"
        }),
      });

      if (response.ok) {
        // Refresh inventory and donated food data
        fetchInventory();
        fetchDonatedFood();
        alert("Food donated successfully!");
        closeDonationForm();
      } else {
        throw new Error('Failed to donate food');
      }
    } catch (error) {
      console.error('Error donating food:', error);
      alert(error.message || "Failed to donate food");
    }
  };

  // Refresh data for the current tab
  const refreshData = () => {
    if (activeTab === 'track-inventory') {
      fetchInventory();
    } else if (activeTab === 'donated-food') {
      fetchDonatedFood();
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className="main-content">
        <div id="navbar">
          <img src="/logo.svg" alt="Care Crumbs logo" className="logo" />
          <h1>Dashboard</h1>
          <div id="nav-icons">
            <Link href="/cart" className="nav-btn">
              <img src="/images/Cart.svg" alt="Cart" className="nav-icon" />
            </Link>
            <Link href="/profile" className="nav-btn">
              <img src="/images/Profile.svg" alt="Profile" className="nav-icon" />
            </Link>
          </div>
        </div>
        <div className="profile">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h2>Manage Food Inventory</h2>
              <button onClick={toggleForm} className="toggle-form-btn">
                {showForm ? "Hide Form" : "Add New Food Item"}
              </button>
            </div>

            {showForm && (
              <div className="add-food-form">
                <h3>Add New Food Item</h3>

                {message.text && (
                  <div className={`message ${message.type}`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <div className="image-upload">
                      <div
                        className="image-preview"
                        onClick={() => document.getElementById('food-image').click()}
                      >
                        {imagePreview ? (
                          <img src={imagePreview} alt="Food preview" />
                        ) : (
                          <div className="upload-placeholder">
                            <span>Click to upload image</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        id="food-image"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                    </div>

                    <div className="form-fields">
                      <div className="form-row">
                        <label>
                          Food Name
                          <input
                            type="text"
                            value={foodName}
                            onChange={(e) => setFoodName(e.target.value)}
                            placeholder="Enter food name"
                          />
                        </label>
                      </div>

                      <div className="form-row">
                        <label>
                          Quantity
                          <input
                            type="text"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity (e.g., 500g, 1 kg, 2 pcs)"
                          />
                        </label>
                      </div>

                      <div className="form-row date-row">
                        <label>
                          Manufacture Date
                          <input
                            type="date"
                            value={manufactureDate}
                            onChange={(e) => setManufactureDate(e.target.value)}
                          />
                        </label>

                        <label>
                          Days Until Expiry
                          <input
                            type="number"
                            min="1"
                            value={daysUntilExpiry}
                            onChange={(e) => setDaysUntilExpiry(e.target.value)}
                            placeholder="Enter days"
                          />
                        </label>
                      </div>

                      <div className="form-row">
                        <button
                          type="submit"
                          className="submit-btn"
                          disabled={loading}
                        >
                          {loading ? "Saving..." : "Save Food Item"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Donation Form Modal */}
            {showDonationForm && (
              <div className="modal-overlay">
                <div className="donation-modal">
                  <h3>Donate Food Item</h3>
                  <form onSubmit={donateFood}>
                    <div className="form-row">
                      <label>
                        Organization Name
                        <input
                          type="text"
                          value={donationOrganization}
                          onChange={(e) => setDonationOrganization(e.target.value)}
                          placeholder="Enter organization name"
                          required
                        />
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        Location/Address
                        <input
                          type="text"
                          value={donationLocation}
                          onChange={(e) => setDonationLocation(e.target.value)}
                          placeholder="Enter location or address"
                          required
                        />
                      </label>
                    </div>
                    <div className="modal-actions">
                      <button type="button" onClick={closeDonationForm} className="cancel-btn">
                        Cancel
                      </button>
                      <button type="submit" className="donate-confirm-btn">
                        Confirm Donation
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {!showForm && (
              <div className="dashboard-tabs">
                <div className="tab-headers">
                  <button
                    className={`tab-btn ${activeTab === 'track-inventory' ? 'active' : ''}`}
                    onClick={() => handleTabChange('track-inventory')}
                  >
                    Track Inventory
                  </button>

                  <button
                    className={`tab-btn ${activeTab === 'donated-food' ? 'active' : ''}`}
                    onClick={() => handleTabChange('donated-food')}
                  >
                    Donated Food
                  </button>
                </div>

                <div className="tab-content">
                  {dataLoading && (
                    <div className="loading-state">
                      <p>Loading data...</p>
                    </div>
                  )}

                  {!dataLoading && activeTab === 'track-inventory' && (
                    <div className="inventory-tab">
                      <div className="tab-header">
                        <h3>Your Food Inventory</h3>
                        <div className="tab-actions">
                          {isClient && inventoryItems.length > 0 && (
                            <div className="pdf-btn">
                              <PDFDownloadLink
                                document={<InventoryPDF data={inventoryItems} title="Food Inventory Report" />}
                                fileName="food-inventory.pdf"
                              >
                                <img src="./images/pdf.svg" alt="PDF" />
                                {({ loading }) => (loading ? 'Preparing PDF...' : 'Download as PDF')}
                              </PDFDownloadLink>
                            </div>
                          )}
                        </div>
                      </div>

                      {inventoryItems.length === 0 ? (
                        <div className="empty-state">
                          <p>No food items in your inventory. Click "Add New Food Item" to get started!</p>
                        </div>
                      ) : (
                        <div className="card-grid">
                          {inventoryItems.map((item) => {
                            const expiryDate = new Date(item.expiryDate);
                            const today = new Date();
                            const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                            const addedDate = new Date(item.createdAt);

                            return (
                              <div key={item._id} className="food-card">
                                <div className="food-card-image">
                                  <img src={item.imageUrl} alt={item.name} />
                                </div>
                                <div className="food-card-content">
                                  <h4 className="food-name">{item.name}</h4>
                                  <p className="food-quantity">Quantity: {item.quantity}</p>
                                  <p className="food-added-date">Added: {formatDate(addedDate)}</p>
                                  <p className={`food-expiry ${daysRemaining <= 2 ? 'expiring-soon' : ''}`}>
                                    {daysRemaining > 0
                                      ? `Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
                                      : 'Expired'}
                                  </p>
                                  <div className="food-card-actions">
                                    <button
                                      className="donate-btn"
                                      onClick={() => openDonationForm(item._id)}
                                    >
                                      Donate
                                    </button>
                                    <button
                                      className="delete-btn"
                                      onClick={() => deleteFood(item._id)}
                                      disabled={deleteLoading}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {!dataLoading && activeTab === 'donated-food' && (
                    <div className="donated-tab">
                      <div className="tab-header">
                        <h3>Your Donated Food Items</h3>
                        <div className="tab-actions">
                          {isClient && donatedItems && donatedItems.length > 0 && (
                            <div className="pdf-btn">
                              <PDFDownloadLink
                                document={<DonatedFoodPDF data={donatedItems} />}
                                fileName="your-donated-food.pdf"
                              >
                                <img src="./images/pdf.svg" alt="PDF" />
                                {({ loading }) => (loading ? 'Preparing PDF...' : 'Download as PDF')}
                              </PDFDownloadLink>
                            </div>
                          )}
                          
                        </div>
                      </div>

                      {donatedItems && donatedItems.length === 0 ? (
                        <div className="empty-state">
                          <p>You haven't donated any food items yet. When you donate an item from your inventory, it will appear here.</p>
                        </div>
                      ) : (
                        <div className="card-grid">
                          {donatedItems && donatedItems.map((item) => (
                            <div key={item._id} className="food-card donated">
                              <div className="food-card-image">
                                <img src={item.imageUrl || "/images/placeholder-food.png"} alt={item.name} />
                              </div>
                              <div className="food-card-content">
                                <h4 className="food-name">{item.name}</h4>
                                <p className="food-quantity">Quantity: {item.quantity}</p>
                                <p className="food-donated-date">Donated on: {formatDate(item.donationDate)}</p>
                                <p className="food-donor">Donated by: {item.donorName || "Anonymous"}</p>
                                {item.organization && <p className="food-organization">Organization: {item.organization}</p>}
                                {item.location && <p className="food-location">Location: {item.location}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
            min-height: 100vh;  
            margin: 0;
            flex-direction: column;
            align-items: center;
            width: 100%;
            padding-bottom: 120px;
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
          
          .nav-icon:hover, .icon:hover {
            width: 35px;
            height: 35px;
          }

          .btn, .nav-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .profile {
            display: flex;
            margin: 120px auto 20px auto;          
            width: 80%;
            max-width: 1000px;
          }

          .dashboard-container {
            background-color: rgba(255, 255, 255, 0.1);
            width: 100%;
            border-radius: 30px;
            padding: 30px;
            backdrop-filter: blur(5px);
          }

          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
          }

          .dashboard-header h2 {
            color: #FE6807;
            font-size: 2rem;
            margin: 0;
          }

          .toggle-form-btn {
            background-color: #FE6807;
            color: white;
            border: none;
            border-radius: 25px;
            padding: 10px 20px;
            font-family: 'Nighty Demo', sans-serif;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .toggle-form-btn:hover {
            background-color: rgba(255, 255, 255, 0.2);
            color: #FE6807;
          }

          .add-food-form {
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 20px;
          }

          .add-food-form h3 {
            color: #FE6807;
            font-size: 1.5rem;
            margin-top: 0;
            text-align: center;
          }

          .message {
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            text-align: center;
            font-weight: bold;
          }

          .message.success {
            background-color: rgba(39, 174, 96, 0.2);
            color: #27ae60;
          }

          .message.error {
            background-color: rgba(231, 76, 60, 0.2);
            color: #e74c3c;
          }

          .form-group {
            display: flex;
            gap: 20px;
          }

          .image-upload {
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .image-preview {
            width: 100%;
            aspect-ratio: 1/1;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border: 2px dashed rgba(254, 104, 7, 0.5);
          }

          .image-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .upload-placeholder {
            color: white;
            text-align: center;
            padding: 20px;
          }

          .form-fields {
            flex: 2;
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .form-row {
            width: 100%;
          
          }

          .form-row label {
            display: block;
            color: white;
            margin-bottom: 5px;
            font-size: 1rem;
          }

          .form-row input {
            width: 90%;
            margin-top: 0.5vw;
            padding: 10px 15px;
            border-radius: 10px;
            border: none;
            background-color: rgba(255, 255, 255, 0.1);
            color: white;
            font-family: 'Nighty Demo', sans-serif;
          }

          .form-row input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }

          .date-row {
            display: flex;
            gap: 15px;
          }

          .date-row label {
            flex: 1;
          }
          .date-row input {
            flex: 1;
            width: 80%;
          }

          .submit-btn {
            background-color: #FE6807;
            color: white;
            border: none;
            border-radius: 10px;
            padding: 12px;
            width: 100%;
            font-family: 'Nighty Demo', sans-serif;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
          }

          .submit-btn:hover {
            background-color: rgba(254, 104, 7, 0.8);
          }

          .submit-btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }

          .tab-headers {
            color: white;
            text-align: center;
          }

          .food-info p {
            font-size: 1.1rem;
            margin-bottom: 30px;
          }

          

          .tab-headers {
            display: flex;
            flex-direction: row;
           justify-content: center;
            gap: 20px;
            margin-bottom: 20px;
          }


          .tab-header{
          display:flex;
          color: white;
          justify-content: space-between;

          }

          .tab-header img{
          width: 2vw;
          height: 2vw;
          transition: 0.5s;
          
          }

          .tab-header img:hover{
          transform: translateY(-5px);
          
          }

          .tab-header h3{
          font-size: 1.5vw;
          }

          .pdf-btn{
          margin-top: 10px;
          background-color:rgba(255,255,255,0.1);
          display: flex;
          width: 3vw;
          height: 3vw;
          align-items: center;
          justify-content: center;
          border-radius: 27px; 
          }

          .pdf-btn:hover{
          
          box-sahdow: 0px 0px 20px #ef6807;
          }
          
          
          .tab-headers button {
            font-family: 'Nighty Demo';    
            font-size: 2rem;      
            flex: 1;
            color: #ef6807;
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 20px;
            border:none;
            transition: all 0.3s ease;
          }
          .tab-headers button:hover {
            font-family: 'Nighty Demo';    
            font-size: 2rem;      
            flex: 1;
            color: white;
            background-color: rgba(255, 255, 255, 0.10);
            border-radius: 15px;
            box-shadow: inset 0px 0px 10px #ef6807;
            padding: 20px;
            border:none;
            transform: translateY(-5px);
          }

         
          /* Card Grid Layout */
          .card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          
          /* Food Card Styling */
          .food-card {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 35px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .food-card:hover {
            transform: translateY(-5px);
            box-shadow:  0 5px 15px rgba(0, 0, 0, 0.2);
          }
          
          .food-card-image {
            height: 180px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .food-card-image img {
            width: 60%;
           border-radius: 25px;
            object-fit: cover;
            transition: transform 0.3s ease;
          }
          
          .food-card:hover .food-card-image img {
            transform: scale(1.05);
          }
          
          .food-card-content {
            padding: 15px;
            color: white;
          }
          
          .food-name {
            margin: 0 0 10px 0;
            font-size: 1.5rem;
            color: #ef6807;
          }
          
          .food-quantity, .food-added-date, .food-expiry, .food-donated-date, .food-organization {
            margin: 5px 0;
            font-size: 1rem;
            color: white;
          }
          
          .expiring-soon {
            color:rgb(255, 25, 0);
            font-weight: bold;
          }
          
          .food-card .donate-btn {
          font-family: "Nighty Demo";
            background-color: #FE6807;
            color: white;
            border: none;
            border-radius: 25px;
            padding: 8px 12px;
            font-size: 1.5rem;
            cursor: pointer;
            margin-top: 10px;
            width: 100%;
            transition: background-color 0.3s ease;
          }
          
          .food-card .donate-btn:hover {
            background-color: #ef6807;
          }
          
          /* Special styling for different card types */
          .food-card.expiring {
            border-left: 4px solidrgb(255, 25, 0);
          }
          
          .food-card.donated {
            border-left: 4px solid #27ae60;
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .card-grid {
              grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            }
          }
          
          @media (max-width: 480px) {
            .card-grid {
              grid-template-columns: 1fr;
            }
          }
          
                   
          /* Add these styles to your global CSS or component-specific CSS */
          
          .food-card-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
          }
          
          .donate-btn, .delete-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s ease;
          }
          
          .donate-btn {
            background-color: #FE6807;
            color: white;
            flex: 1;
            margin-right: 6px;
          }
          
          .delete-btn {
           font-family: "Nighty Demo";
            background-color: #FE6807;
            color: white;
            border: none;
            border-radius: 25px;
            padding: 8px 12px;
            font-size: 1.5rem;
            cursor: pointer;
            margin-top: 10px;
            width: 50%;
            transition: background-color 0.3s ease;
          }
          
          .donate-btn:hover {
            background-color: #e55d00;
          }
          
          .delete-btn:hover {
            background-color: #e62e24;
          }
          
          .donate-btn:disabled, .delete-btn:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </>
  );
}