import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Signin = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    emailOrMobile: "",
    password: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/homepage");
    }
  }, [session, status, router]);

  // Custom toast options with your logo and Nighty Demo font
  const toastOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
    style: {
      background: '#FE6807',
      color: '#ffffff',
      borderRadius: '20px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      padding: '15px 20px',
      fontSize: '16px',
      fontFamily: 'Nighty Demo, sans-serif'
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.emailOrMobile || !formData.password) {
      setError("Please fill in all fields");
      toast.error("Please fill in all fields", toastOptions);
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      console.log("Attempting signin with:", {
        emailOrMobile: formData.emailOrMobile
      });
  
      const res = await signIn("credentials", {
        emailOrMobile: formData.emailOrMobile,
        password: formData.password,
        redirect: false,
      });
  
      console.log("SignIn response:", res);
  
      if (res && res.error) {
        console.error("SignIn error:", res.error);
        setError(res.error || "Invalid credentials");
        toast.error(res.error || "Invalid email/mobile or password", toastOptions);
      } else if (res && !res.error) {
        console.log("Login successful, showing toast");
        
        // Show success toast
        toast.success("Login successful! Redirecting to homepage...", toastOptions);
        
        // Use router.push with a slight delay to ensure toast is visible
        setTimeout(() => {
          router.push("/homepage");
        }, 2000);
      } else {
        console.error("Unexpected signin response:", res);
        setError("Signin failed. Try again!");
        toast.error("Signin failed. Try again!", toastOptions);
      }
    } catch (err) {
      console.error("SignIn exception:", err);
      setError("Signin failed. Try again!");
      toast.error("Signin failed. Try again!", toastOptions);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleGoogleSignin = async () => {
    try {
      console.log("Attempting Google signin");
      setLoading(true);
  
      // Show a toast notification that we're signing in with Google
      toast.info("Signing in with Google...", toastOptions);
  
      // Wait for the toast to show before redirecting (shorter delay)
      setTimeout(async () => {
        await signIn("google", {
          callbackUrl: "/homepage"
        });
      }, 1500); // Reduced delay time
    } catch (error) {
      console.error("Google signin error:", error);
      toast.error("Google signin failed. Try again!", toastOptions);
      setLoading(false);
    }
  };
  
  return (
    <div className="Signin">
      {/* Toast Container with proper configuration */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <div className="signin-container">
        <h2 className="welcome-heading">Welcome Back to Care Crumbs 🍽️❤️</h2>
        <div className="signin-description">
          <p>
            Sign in to continue supporting food donation and making an impact. Every meal shared brings hope to someone in need. 💙🍽️
          </p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="logo-container">
            <Image src="/logo.svg" alt="Care Crumbs" width={80} height={48} />
          </div>
          <h2 className="signin-heading">Signin</h2>

          <div className="form-content">
            <div className="input-container">
              <input
                type="text"
                name="emailOrMobile"
                placeholder="Enter Email or Mobile Number"
                value={formData.emailOrMobile}
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
              <div className="signinbutton">
                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "SIGNING IN..." : "SIGNIN"}
                </button>
              </div>

              <div className="signin-para">
                <p className="signin">
                  New to Care Crumbs? <a href="/users/signup">SIGNUP</a>
                </p>
              </div>

              <div className="forgot-password-container">
                <a href="/forget-password" className="forgot-password-link">Forgot Password?</a>
              </div>

              <div className="googlegifbutton">
                <button
                  className="google-signin"
                  type="button"
                  onClick={handleGoogleSignin}
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
        .Signin {
          display: flex; 
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100vw;
          overflow: hidden; /* Prevent scrolling */
        }
        
        .signin-container {
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
        
        .signin-description {
          margin: 10px 20vw;
          font-size: 1.2rem;
          font-family: 'Nighty Demo', sans-serif;
        }
        
        .signin-description p {
          margin: 0;
        }
        
        .signin-form {
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
        
        .signin-heading {
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

        .signin-form input {
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
        
        .signin-form input:focus,
        .signin-form input:hover {
          border: 2px solid white;
        }
        
        .signin-form input::placeholder {
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
        
        .welcome-image-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 2px;
          flex-direction: column;
        }
        
        .welcome-icon {
          width: 7vw;
          cursor: pointer;
          margin-bottom: 3px;
          margin-top: -3px;
        }
        
        .signinbutton button {
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

        .signinbutton button:hover:not(:disabled) {
          transform: scale(1.05);
        }
        
        .signinbutton button:disabled {
          background-color: #333;
          cursor: not-allowed;
        }
        
        .signin-para p {
          margin-top: 4px;
          margin-bottom: 4px;
          font-size: 0.85rem;
        }
        
        .signin-para a {
          color: white;
          text-decoration: none;
        }
        
        .forgot-password-container {
          margin-top: 3px;
          margin-bottom: 3px;
        }
        
        .forgot-password-link {
          color: white;
          text-decoration: none;
          font-size: 0.85rem;
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

export default Signin;