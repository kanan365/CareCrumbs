import React, { useState } from "react";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const ForgetPassword = () => {
  const [step, setStep] = useState(1); // Step 1: Enter email, Step 2: Enter OTP
  const [formData, setFormData] = useState({
    email: "",
    resetCode: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);

  // Custom toast options with your logo and Nighty Demo font
  const toastOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    style: {
      background: '#FE6807',
      color: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      padding: '15px 20px',
      fontSize: '16px',
      fontFamily: 'Nighty Demo, sans-serif'
    },
    icon: () => (
      <img 
        src="/logo.svg" 
        alt="Care Crumbs Logo" 
        style={{ width: '24px', height: '24px', marginRight: '10px' }} 
      />
    )
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    // Clear error when typing
    if (error) setError(null);
  };

  const handleSendReset = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      setError("Please enter your email");
      toast.error("Please enter your email", toastOptions);
      return;
    }

    // Basic validation
    if (!formData.email.includes('@')) {
      setError("Please enter a valid email address");
      toast.error("Please enter a valid email address", toastOptions);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Sending OTP request for email:", formData.email);
      
      // Call the email OTP sender API
      const response = await axios.post('/api/reset-password/send', {
        emailOrMobile: formData.email,
        method: 'email'
      });
      
      console.log("OTP response:", response.data);
      
      // In development mode, you can display the OTP for testing
      if (response.data.otp && process.env.NODE_ENV === 'development') {
        console.log('Development OTP:', response.data.otp);
      }
      
      toast.success("OTP sent to your email!", toastOptions);
      setResetSent(true);
      setStep(2);
    } catch (err) {
      console.error("Password reset request failed:", err);
      
      if (err.response) {
        const errorMessage = err.response.data?.error || "Failed to send OTP. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage, toastOptions);
        console.error("Error details:", err.response.data);
      } else if (err.request) {
        setError("No response from server. Please check your connection.");
        toast.error("No response from server. Please check your connection.", toastOptions);
      } else {
        setError("Request error: " + err.message);
        toast.error("Request error: " + err.message, toastOptions);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!formData.resetCode) {
      setError("Please enter the OTP");
      toast.error("Please enter the OTP", toastOptions);
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setError("Please enter and confirm your new password");
      toast.error("Please enter and confirm your new password", toastOptions);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match", toastOptions);
      return;
    }

    // Basic password strength validation
    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      toast.error("Password must be at least 8 characters long", toastOptions);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Sending reset request with data:", {
        email: formData.email,
        resetCode: formData.resetCode,
        passwordLength: formData.newPassword.length
      });
      
      // Call the OTP verification and password update API
      const response = await axios.post('/api/reset-password/confirm', {
        emailOrMobile: formData.email,
        resetCode: formData.resetCode,
        newPassword: formData.newPassword
      });
      
      console.log("Reset password response:", response.data);
      
      toast.success("Password reset successful! You can now login with your new password.", toastOptions);
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = "/users/signin";
      }, 2000);
    } catch (err) {
      console.error("Password reset failed:", err);
      
      if (err.response) {
        // The server responded with a status code outside the 2xx range
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        
        const errorMessage = err.response.data?.error || "Failed to reset password. Please check your OTP and try again.";
        setError(errorMessage);
        toast.error(errorMessage, toastOptions);
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No response received:", err.request);
        setError("No response from server. Please check your connection and try again.");
        toast.error("No response from server. Please check your connection and try again.", toastOptions);
      } else {
        // Something happened in setting up the request
        console.error("Error message:", err.message);
        setError("Error setting up request: " + err.message);
        toast.error("Error setting up request: " + err.message, toastOptions);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendResetCode = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Call the same OTP sender API again
      const response = await axios.post('/api/reset-password/send', {
        emailOrMobile: formData.email,
        method: 'email'
      });
      
      // In development mode, you can display the OTP for testing
      if (response.data.otp && process.env.NODE_ENV === 'development') {
        console.log('Development OTP:', response.data.otp);
      }
      
      toast.success("OTP resent to your email!", toastOptions);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to resend OTP. Please try again.";
      toast.error(errorMessage, toastOptions);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ForgetPassword">
      <ToastContainer
        closeButton={true}
        theme="light"
      />

      <div className="forget-password-container">
        <h2 className="welcome-heading">Forgot Your Password? 🔐</h2>
        <div className="forget-password-description">
          <p>
            No worries! We'll help you reset your password. {step === 1 ? "Enter your email to receive a reset code." : "Enter the OTP and set your new password."} 💙🍽️
          </p>
        </div>

        <div className="forget-password-form">
          <div className="logo-container">
            <Image src="/logo.svg" alt="Care Crumbs" width={80} height={48} />
          </div>
          <h2 className="forget-password-heading">Reset Password</h2>

          <div className="form-content">
            {step === 1 ? (
              // STEP 1: Enter email
              <form onSubmit={handleSendReset} className="step-form">
                <div className="input-container">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter Your Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  
                  {error && <div className="error-message">{error}</div>}
                  
                  <div className="action-button">
                    <button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "SENDING..." : "SEND OTP"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              // STEP 2: Enter OTP and new password
              <form onSubmit={handleResetPassword} className="step-form">
                <div className="input-container reset-form">
                  <div className="reset-info">
                    <p>We've sent an OTP to <strong>{formData.email}</strong></p>
                  </div>
                  
                  <input
                    type="text"
                    name="resetCode"
                    placeholder="Enter OTP"
                    value={formData.resetCode}
                    onChange={handleChange}
                    required
                  />
                  
                  <input
                    type="password"
                    name="newPassword"
                    placeholder="New password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                  />
                  
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  
                  {error && <div className="error-message">{error}</div>}
                  
                  <div className="resend-link">
                    <button 
                      type="button" 
                      onClick={resendResetCode} 
                      disabled={loading}
                    >
                      Didn't receive OTP? Resend
                    </button>
                  </div>
                  
                  <div className="action-button">
                    <button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "RESETTING..." : "RESET PASSWORD"}
                    </button>
                  </div>
                  
                  <div className="back-link">
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      disabled={loading}
                    >
                      Change email
                    </button>
                  </div>
                </div>
              </form>
            )}
            
            <div className="bottom-links">
              <div className="signin-link">
                <p>
                  Remember your password? <a href="/users/signin">SIGNIN</a>
                </p>
              </div>
              
              <div className="signup-link">
                <p>
                  New to Care Crumbs? <a href="/users/signup">SIGNUP</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ForgetPassword {
          display: flex; 
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }
        
        .forget-password-container {
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
          overflow: hidden;
        }
        
        .welcome-heading {
          font-size: 2.5rem;
          margin-top: 0;
          margin-bottom: 5px;
          font-family: 'Nighty Demo', sans-serif;
        }
        
        .forget-password-description {
          margin: 10px 20vw;
          font-size: 1.2rem;
          font-family: 'Nighty Demo', sans-serif;
        }
        
        .forget-password-description p {
          margin: 0;
        }
        
        .forget-password-form {
          padding: 15px;
          border-radius: 50px 400px 400px 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 40%;
          max-height: 70vh;
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
        
        .forget-password-heading {
          font-size: 2.2rem;
          margin-top: 5px;
          margin-bottom: 10px;
          font-family: 'Nighty Demo', sans-serif;
        }
        
        .form-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          padding: 5px;
        }
        
        .step-form {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        
        .input-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 80%;
        }
        
        input {
          width: 100%;
          height: 40px;
          padding: 8px 12px;
          margin-bottom: 15px;
          border-radius: 10px;
          border: 2px solid transparent;
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 0.9rem;
          transition: border 0.3s ease;
          font-family: 'Nighty Demo', sans-serif;
        }
        
        input:focus,
        input:hover {
          border: 2px solid white;
          outline: none;
        }
        
        input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .error-message {
          color: white;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 15px;
          width: 100%;
          text-align: center;
          font-size: 0.85rem;
        }
        
        .action-button {
          width: 100%;
          margin-bottom: 15px;
        }
        
        .action-button button {
          width: 100%;
          padding: 10px;
          font-size: 1.2rem;
          background-color: black;
          border: none;
          color: white;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.3s ease;
          font-family: "Nighty Demo", sans-serif;
        }
        
        .action-button button:hover:not(:disabled) {
          transform: scale(1.05);
        }
        
        .action-button button:disabled {
          background-color: #333;
          cursor: not-allowed;
        }
        
        .reset-form input {
          margin-bottom: 15px;
        }
        
        .reset-info {
          background-color: rgba(0, 0, 0, 0.2);
          padding: 10px;
          border-radius: 10px;
          margin-bottom: 15px;
          width: 100%;
        }
        
        .reset-info p {
          margin: 0;
          font-size: 0.9rem;
        }
        
        .resend-link,
        .back-link {
          width: 100%;
          text-align: center;
          margin-bottom: 10px;
        }
        
        .resend-link button,
        .back-link button {
          background: none;
          border: none;
          color: white;
          text-decoration: underline;
          cursor: pointer;
          font-family: 'Nighty Demo', sans-serif;
          font-size: 0.85rem;
          padding: 5px;
        }
        
        .resend-link button:hover,
        .back-link button:hover {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .bottom-links {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 15px;
          width: 100%;
        }
        
        .signin-link,
        .signup-link {
          margin: 5px 0;
        }
        
        .signin-link p,
        .signup-link p {
          margin: 0;
          font-size: 0.9rem;
        }
        
        .signin-link a,
        .signup-link a {
          color: white;
          text-decoration: none;
          font-weight: bold;
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

export default ForgetPassword;