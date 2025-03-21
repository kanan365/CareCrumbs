import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EditProfile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    image: "",
    linkedinUrl: "",
    githubUrl: "",
    websiteUrl: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    // Get user data on component mount
    const fetchUserData = async () => {
      setIsDataLoading(true);
      const sessionData = await getSession();
      if (sessionData) {
        // Fetch user profile data from database
        try {
          const response = await fetch(`/api/users/profile?email=${sessionData.user.email}`);

          if (response.ok) {
            try {
              // Try to parse the response as JSON
              const userData = await response.json();
              console.log("Profile data fetched:", userData); // Debug

              // Set the form data with current user data
              setFormData({
                name: userData.name || sessionData.user.name || "",
                email: userData.email || sessionData.user.email || "",
                mobile: userData.mobile || "",
                image: userData.image || sessionData.user.image || "",
                linkedinUrl: userData.linkedinUrl || "",
                githubUrl: userData.githubUrl || "",
                websiteUrl: userData.websiteUrl || ""
              });
            } catch (parseError) {
              console.error("Error parsing JSON response:", parseError);
              // Fallback to session data if JSON parsing fails
              setFormData({
                name: sessionData.user.name || "",
                email: sessionData.user.email || "",
                mobile: "",
                image: sessionData.user.image || "",
                linkedinUrl: "",
                githubUrl: "",
                websiteUrl: ""
              });
            }
          } else {
            console.error("API response not OK:", response.status);
            // Fallback to session data if API call fails
            setFormData({
              name: sessionData.user.name || "",
              email: sessionData.user.email || "",
              mobile: "",
              image: sessionData.user.image || "",
              linkedinUrl: "",
              githubUrl: "",
              websiteUrl: ""
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to session data if API call fails
          setFormData({
            name: sessionData.user.name || "",
            email: sessionData.user.email || "",
            mobile: "",
            image: sessionData.user.image || "",
            linkedinUrl: "",
            githubUrl: "",
            websiteUrl: ""
          });
        } finally {
          setIsDataLoading(false);
        }
      } else {
        setIsDataLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!session && !isDataLoading && !router.query.loading) {
      router.push("/signin");
    }
  }, [session, router, isDataLoading]);

  if (!session || isDataLoading) {
    return <div className="loading">Loading...</div>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Increase file size limit to 20MB
      if (file.size > 30 * 1024 * 1024) {
        setMessage("Image too large. Please select an image under 30MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prevState => ({
          ...prevState,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("Processing request...");

    try {
      // Make sure email is included
      if (!formData.email) {
        throw new Error("Email is required");
      }

      console.log("Submitting data:", formData); // Debug the form data being sent

      // Make sure this matches your actual API route structure
      const response = await fetch('/api/users/updateProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Include the session user's email for authentication on API side
          email: session.user.email
        }),
        // Add credentials to ensure cookies are sent with the request
        credentials: 'include'
      });

      console.log("Response status:", response.status); // Log response status

      // Get response as text first
      const responseText = await response.text();
      console.log("Raw response:", responseText);

      let data;
      try {
        // Then try to parse as JSON if possible
        data = JSON.parse(responseText);
        console.log("Parsed response data:", data);
      } catch (parseError) {
        console.error("Error parsing response as JSON:", parseError);
        setMessage(`Error: Could not parse server response. Server returned: ${responseText.substring(0, 100)}...`);
        setIsLoading(false);
        return;
      }

      if (response.ok) {
        // Success response
        setMessage(data.message || "Profile updated successfully!");

        // Create and dispatch a custom event for profile updates
        const event = new CustomEvent('profileUpdated', {
          detail: formData
        });
        window.dispatchEvent(event);

        // Wait for 1 second before redirecting (shorter for better UX)
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
      } else {
        // Error response
        setMessage(`Error: ${data.error || data.message || "Unknown error occurred"}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Edit Profile</title>
      </Head>
      <div className="main-content">
        <div id="navbar">
          <img src="/logo.svg" alt="Care Crumbs logo" className="logo" />
          <h1>Edit Profile</h1>
          <div id="nav-icons">
            <Link href="/cart" className="nav-btn">
              <img src="/images/Cart.svg" alt="Cart" className="nav-icon" />
            </Link>
            <Link href="/profile" className="nav-btn">
              <img src="/images/Profile.svg" alt="Profile" className="nav-icon" />
            </Link>
          </div>
        </div>

        <div className="edit-profile-container">
          <form onSubmit={handleSubmit} className="edit-form">
            {message && <div className="message">{message}</div>}

            <div className="forminputs">
              <div className="forminput1">
                <div className="profile-img-container">
                  <div className="profile-img-preview">
                    <img
                      src={formData.image || "/default-avatar.png"}
                      alt="Profile Preview"
                    />
                  </div>
                  <div className="image-upload">
                    <label htmlFor="image-upload" className="custom-file-upload">
                      Change Image
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your Email"
                    required
                    readOnly
                  />
                </div>
              </div>

              <div className="forminput2">
                <div className="form-group">
                  <label htmlFor="mobile">Mobile Number</label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="Your Mobile Number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="linkedinUrl">LinkedIn URL</label>
                  <input
                    type="url"
                    id="linkedinUrl"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/your-username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="githubUrl">GitHub URL</label>
                  <input
                    type="url"
                    id="githubUrl"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/your-username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="websiteUrl">Website URL</label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
              <a href="/profile" className="cancel-btn">
                Cancel
              </a>
            </div>
          </form>
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
            justify-content: center;
          }
          
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 24px;
            color: white;
          }
            
          #navbar {
            position: fixed;
            top: 0;
            width: 100%;
            height: 70px;
            background-color: rgba(81, 80, 80, 0.3);
            backdrop-filter: blur(5px); 
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 100;
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

          .edit-profile-container {
            width: 70%;
            height: 75%;
            margin-top: 30px;
            padding: 20px;
            background-color: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(5px);
            border-radius: 190px 100px  25px 25px;
            
          }

          .edit-form {
            display: flex;
            flex-direction: column;
            width: 100%;
          }

          .message {
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 10px;
            text-align: center;
            background-color: #fe6807;
            color: white;
          }

          .profile-img-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
          }

          .profile-img-preview {
            width: 13vw;
            
            border-radius: 50%;
            overflow: hidden;
            margin-bottom: 12px;
          }

          .profile-img-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .custom-file-upload {
            background-color: #FE6807;
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            transition: 0.3s;
            font-size: 16px;
          }

          .custom-file-upload:hover {
            background-color: rgba(255, 255, 255, 0.2);
            color: #FE6807;
          }

          input[type="file"] {
            display: none;
          }

          .forminputs{
          width: 100%;
          height: 50%;
          display: flex;
          jusitify-content: space-between;
          gap: 50px;
          align-items: center;
          }

          .forminput1{
          padding: 20px;
           width: 40vw;
            height: 50vh;
          }

          .forminput2{
          padding: 10px;
           width: 45vw;
           height: 50vh;
           display: flex;
           flex-direction: column;
           justify-content: center;
           align-items: center;
          }
          .forminput2 input{
           height: 2vh;
          
          }
          
          
          .form-group {
          width: 100%;
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 5px;
            color: white;
            font-size: 18px;
          }

          .form-group input {
            width: 90%;
            padding: 12px;
            border: none;
            border-radius: 20px;
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 16px;
            font-family: 'Nighty Demo', sans-serif;
          }

          .form-group input::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }

          .form-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            
          }

          .save-btn, .cancel-btn {
            padding: 12px 25px;
            border: none;
            border-radius: 25px;
            font-family: 'Nighty Demo', sans-serif;
            font-size: 18px;
            background-color: #fe6807;
            cursor: pointer;
            color:white;
            transition: 0.3s;
            text-align: center;
            text-decoration: none;
            display: inline-block;
          }

          

          .save-btn:hover, .cancel-btn:hover{
            padding: 12px 25px;
            border: none;
            border-radius: 25px;
            font-family: 'Nighty Demo', sans-serif;
            font-size: 20px;
            background-color:rgb(255, 255, 255);
            cursor: pointer;
            color:#fe6807;
            transition: 0.3s;
            text-align: center;
            text-decoration: none;
            display: inline-block;
          }

         

          @media (max-width: 768px) {
            .nav-buttons {
              width: 80%;
            }
          }

        `}</style>
      </div >
    </>
  );
}