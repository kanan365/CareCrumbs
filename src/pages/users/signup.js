import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Signup = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    mobile: "",
    password: "",
    profileImage: null,
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Simplified toast options for better reliability
  const toastOptions = {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    style: {
      backgroundColor: '#FE6807',
      color: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      padding: '15px 20px',
      fontSize: '16px',
      fontFamily: 'Nighty Demo, sans-serif'
    }
  };

  // Test toast when component mounts (remove this after confirming toast works)
  useEffect(() => {
    // Uncomment this to test if toast is working on page load
    // toast.info("Signup page loaded", toastOptions);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    if (error) setError(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      setFormData(prevData => ({
        ...prevData,
        profileImage: file
      }));

      // Set preview
      setProfilePreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.email || !formData.mobile || !formData.password) {
      setError("Please fill in all required fields");
      toast.error("Please fill in all required fields", toastOptions);
      return;
    }

    // Mobile number validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      toast.error("Please enter a valid 10-digit mobile number", toastOptions);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      toast.error("Please enter a valid email address", toastOptions);
      return;
    }

    // Password strength validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      toast.error("Password must be at least 8 characters long", toastOptions);
      return;
    }

    setLoading(true);
    setError(null);

    // Create FormData for multipart upload
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('mobile', formData.mobile);
    formDataToSend.append('password', formData.password);

    // Append profile image if exists
    if (formData.profileImage) {
      formDataToSend.append('profileImage', formData.profileImage);
    }

    try {
      console.log("Attempting to signup with:", { 
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        hasImage: !!formData.profileImage 
      });
      
      const response = await axios.post("/api/auth/signup", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log("Signup Success:", response.data);

      // Show success toast
      toast.success("Signup successful! Logging you in...", toastOptions);
      
      // Auto sign in the user after successful registration with credentials
      const signInResult = await signIn("credentials", {
        redirect: false,
        emailOrMobile: formData.email, // Make sure this matches what your authorize function expects
        password: formData.password,
        callbackUrl: "/homepage"
      });
      
      if (signInResult?.error) {
        console.error("SignIn Error after signup:", signInResult.error);
        toast.error("Signup successful but automatic login failed. Please sign in manually.", toastOptions);
        // Redirect to signin page if auto-login fails
        setTimeout(() => {
          router.push("/users/signin");
        }, 5000);
        return;
      }
      
      // Reset form after successful signup
      setFormData({
        email: "",
        name: "",
        mobile: "",
        password: "",
        profileImage: null
      });
      setProfilePreview(null);
      
      // Redirect to homepage after successful signup and login
      toast.success("Login successful! Redirecting to Homepage...", toastOptions);
      
      // Use router.push with the callback URL from signInResult
      setTimeout(() => {
        router.push("/homepage");
      }, 5000);
      
    } catch (error) {
      console.error("Signup Error:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Signup failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage, toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleGoogleSignup = async () => {
    try {
      console.log("Attempting Google signup with callback URL: /homepage");
      setLoading(true);
      
      // Show toast before redirect
      toast.info("Signing up with Google...", toastOptions);
      
      // Using callbackUrl to ensure proper redirection after Google authentication
      await signIn("google", { 
        callbackUrl: "/homepage"
      });
      
      // Note: Code after this point won't run because of the redirect
    } catch (error) {
      console.error("Google signup exception:", error);
      toast.error("Google signup failed. Try again!", toastOptions);
      setLoading(false);
    }
  };

  return (
    <div className="Signup">
      {/* Place ToastContainer at top level, outside other elements */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <div className="signup-container">
        <h2 className="welcome-heading">Welcome to Care Crumbs 🍽️❤️</h2>
        <div className="signup-description">
          <p>
            Join Care Crumbs, a platform dedicated to reducing food waste and feeding
            those in need. Every meal shared brings hope to someone in need. 💙🍽️
          </p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="logo-container">
            <Image src="/logo.svg" alt="Care Crumbs" width={80} height={48} />
          </div>
          <h2 className="signup-heading">Signup</h2>

          <div className="form-content">
            <div className="input-container">
              <input
                type="text"
                name="name"
                placeholder="Enter Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Enter Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="mobile"
                placeholder="Enter Mobile No"
                value={formData.mobile}
                onChange={handleChange}
                required
              />

              <div className="password-container">
                <input
                  type={passwordVisible ? "text" : "password"}
                  name="password"
                  placeholder="Enter Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={togglePasswordVisibility}
                >
                  {passwordVisible ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="button-containers">
              <div className="profile-image-container">
                <h2 className="profile-image-label">Upload Profile Image</h2>
                <label htmlFor="profileImage">
                  {profilePreview ? (
                    <div className="profile-preview">
                      <img
                        src={profilePreview}
                        alt="Profile Preview"
                        className="profile-preview-image"
                      />
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <span>Choose Image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="profileImage"
                    name="profileImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <div className="signupbutton">
                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "SIGNING UP..." : "SIGNUP"}
                </button>
              </div>

              <div className="signup-para">
                <p className="signin">
                  Already have an account? <a href="/users/signin">SIGNIN</a>
                </p>
              </div>

              <div className="googlegifbutton">
                <button
                  className="google-signin"
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                >
                  <Image
                    src="/google2.gif"
                    alt="Google Signin"
                    width={30}
                    height={30}
                  />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      <style jsx>{`
        .Signup {
          display: flex; 
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100vw;
          overflow: hidden; /* Prevent scrolling */
        }
        
        .signup-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: url('/food-bg.svg');
          background-size: cover;              
          background-position: center center;   
          background-attachment: fixed;         
          background-repeat: no-repeat;         
          height: 100vh;      
          width: 100vw;               
          margin: 0; 
          padding: 0;
          color: white;
          text-align: center;
          font-family: 'Nighty Demo', sans-serif;
          overflow: hidden; /* Prevent scrolling */
        }
        
        .welcome-heading {
          font-size: 2.5rem;
          margin-top: 0;
          margin-bottom: 5px;
          font-family: 'Nighty Demo', sans-serif;
        }
        
        .signup-description {
          margin: 10px 20vw;
          font-size: 1.2rem;
          font-family: 'Nighty Demo', sans-serif;
        }
        
        .signup-description p {
          margin: 0;
        }
        
        .signup-form {
          padding: 15px;
          border-radius: 50px 400px 400px 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 40%;
          max-height: 65vh; /* Restrict height to prevent overflow */
          background: #FE6807;
          box-shadow: 0px 4px 10px #FE6807;
          font-family: 'Nighty Demo', sans-serif;
          position: relative;
          margin-top: 20px;
        }
        
        .logo-container {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 10;
        }
        
        .signup-heading {
          font-size: 2.2rem;
          margin-top: 5px;
          margin-bottom: 20px;
          font-family: 'Nighty Demo', sans-serif;
        }
        
        .form-content {
          display: flex;
          justify-content: space-between;
          width: 100%;
          padding: 5px;
          margin-top: 0;
          margin-bottom: 0;
        }
        
        .input-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 60%;
        }

        .signup-form input {
          width: 100%;
          height: 36px;
          padding: 6px 8px;
          margin: 20px 0 30px 0;
          border-radius: 10px;
          border: 2px solid transparent;
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 0.85rem;
          transition: border 0.3s ease;
          font-family: 'Nighty Demo', sans-serif;
        }
        
        .signup-form input:focus,
        .signup-form input:hover {
          border: 2px solid white;
        }
        
        .signup-form input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .password-container {
          width: 100%;
          position: relative;
        }
        
        .eye-icon {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          color: white;
          cursor: pointer;
          background-color: transparent;
          border: none;
          margin-top: -2px;
          margin-right: -15px;
        }

        .error-message {
          color: white;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 10px;
          width: 100%;
          text-align: center;
          font-size: 0.85rem;
        }
        
        .button-containers {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 40%;
          margin-top: 30px;
          font-family: 'Nighty Demo', sans-serif;
        }
        
        .profile-image-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
          width: 100%;
        }
        
        .profile-image-label {
          font-size: 1rem;
          margin-bottom: 10px;
        }
        
        .upload-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.2);
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          color: white;
          border: 2px dashed white;
        }
        
        .profile-preview {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid white;
        }
        
        .profile-preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .signupbutton button {
          width: 100%;
          padding: 8px;
          font-size: 1.5rem;
          background-color: black;
          border: none;
          color: white;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.3s ease;
          margin-top: 3px;
          font-family: "Nighty Demo", sans-serif;
        }

        .signupbutton button:hover:not(:disabled) {
          transform: scale(1.05);
        }
        
        .signupbutton button:disabled {
          background-color: #333;
          cursor: not-allowed;
        }
        
        .signup-para p {
          margin-top: 4px;
          margin-bottom: 4px;
          font-size: 0.85rem;
        }
        
        .signup-para a {
          color: white;
          text-decoration: none;
        }
        
        .google-signin {
          margin-top: 5px;
          height: 45px;
          width: 45px;
          border-radius: 50%;
          background-color: white;
          border: none;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: transform 0.3s ease;
        }
        
        .google-signin:hover:not(:disabled) {
          transform: scale(1.05);
        }
        
        .google-signin:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>

      {/* Add custom toast styles with Nighty Demo font */}
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          overflow: hidden; /* Prevent scrolling on body */
        }
        
        /* Import font */
        @font-face {
          font-family: 'Nighty Demo';
          src: url('/fonts/Nightdemo.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        
        /* Customize toast container */
        .Toastify__toast-container {
          width: auto;
          max-width: 400px;
        }
        
        /* Customize toast */
        .Toastify__toast {
          border-radius: 20px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          background-color: #FE6807;
          color: white;
          padding: 10px 16px;
          margin-bottom: 10px;
        }
        
        /* Customize toast body */
        .Toastify__toast-body {
          font-family: 'Nighty Demo', sans-serif;
          display: flex;
          align-items: center;
        }
        
        /* Custom toast progress bar color */
        .Toastify__progress-bar--default {
          background: white;
        }
        
        /* Close button */
        .Toastify__close-button {
          color: white;
          opacity: 0.7;
        }
        
        /* Customize toast types */
        .Toastify__toast--default {
          background: #FE6807;
          color: white;
        }
        
        .Toastify__toast--error {
          background: #FE6807;
          color: white;
        }
        
        .Toastify__toast--warning {
          background: #FE6807;
          color: white;
        }
        
        .Toastify__toast--success {
          background: #FE6807;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default Signup;