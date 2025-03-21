import { useSession, signOut, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    mobile: "",
    image: "",
    linkedinUrl: "",
    githubUrl: "",
    websiteUrl: ""
  });

  const fetchProfileData = async () => {
    setIsLoading(true);
    const sessionData = await getSession();
    
    if (sessionData) {
      console.log("Session data:", sessionData); // Debug session data
      
      try {
        // Use the correct API endpoint that matches your backend structure
        const response = await fetch(`/api/users/profile?email=${sessionData.user.email}`);
        
        if (response.ok) {
          try {
            const data = await response.json();
            console.log("Profile data from API:", data); // Debug the returned data
            
            setProfileData({
              name: data.name || sessionData.user.name || "",
              email: data.email || sessionData.user.email || "",
              mobile: data.mobile || "", 
              image: data.image || sessionData.user.image || "",
              linkedinUrl: data.linkedinUrl || "",
              githubUrl: data.githubUrl || "",
              websiteUrl: data.websiteUrl || ""
            });
          } catch (parseError) {
            console.error("Error parsing profile data:", parseError);
            // Fall back to session data
            setProfileData({
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
          console.error("Failed to fetch profile data:", response.status);
          // Fall back to session data
          setProfileData({
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
        console.error("Error fetching profile data:", error);
        // Fall back to session data
        setProfileData({
          name: sessionData.user.name || "",
          email: sessionData.user.email || "",
          mobile: "",
          image: sessionData.user.image || "",
          linkedinUrl: "",
          githubUrl: "",
          websiteUrl: ""
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch profile data on component mount
    fetchProfileData();
    
    // Add event listener for when user returns to this page
    const handleRouteChange = (url) => {
      if (url === '/profile') {
        fetchProfileData();
      }
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    
    // Clean up event listener
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!session && !isLoading) {
      router.push("/signin");
    }
  }, [session, router, isLoading]);

  // Function to ensure URLs have proper format
  const formatUrl = (url) => {
    if (!url) return '';
    
    // Check if URL starts with http:// or https://
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  // Function to handle link clicks
  const handleLinkClick = (url, e) => {
    if (!url || url.trim() === '') {
      e.preventDefault();
      return false;
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <div className="loading">Redirecting to login...</div>;
  }

  // Debug to see what's in profileData
  console.log("Current profile data:", profileData);

  return (
    <>
      <Head>
        <title>Profile</title>
      </Head>
      <div className="main-content">
        <div id="navbar">
          <img src="/logo.svg" alt="Care Crumbs logo" className="logo" />
          <h1>Profile</h1>
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
          <div className="profilecontainer">
            <div className="profilecard">
              {/* Profile Card */}
              <div className="profileimg">
                <img
                  src={profileData.image || (session?.user?.image || "/default-avatar.png")}
                  alt="User Avatar"
                />
              </div>
              <div className="userdetails">
                <h2 className="username">{profileData.name || (session?.user?.name || "User")}</h2>
                <p className="useremail">{profileData.email || (session?.user?.email || "")}</p>
                <p className="usermobile">
                  {profileData.mobile || session?.user?.mobile }
                </p>

                {/* Social Links - Fixed */}
                <div className="userlinks">
                  {profileData.linkedinUrl && profileData.linkedinUrl.trim() !== "" ? (
                    <a 
                      href={formatUrl(profileData.linkedinUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="linkedin-btn"
                      onClick={(e) => handleLinkClick(profileData.linkedinUrl, e)}
                    >
                      <img src="/images/Linkedin.svg" alt="LinkedIn" />
                    </a>
                  ) : (
                    <span className="linkedin-btn disabled">
                      <img src="/images/Linkedin.svg" alt="LinkedIn" />
                    </span>
                  )}
                  
                  {profileData.githubUrl && profileData.githubUrl.trim() !== "" ? (
                    <a 
                      href={formatUrl(profileData.githubUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="github-btn"
                      onClick={(e) => handleLinkClick(profileData.githubUrl, e)}
                    >
                      <img src="/images/Github.svg" alt="GitHub" />
                    </a>
                  ) : (
                    <span className="github-btn disabled">
                      <img src="/images/Github.svg" alt="GitHub" />
                    </span>
                  )}
                  
                  {profileData.websiteUrl && profileData.websiteUrl.trim() !== "" ? (
                    <a 
                      href={formatUrl(profileData.websiteUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="website-btn"
                      onClick={(e) => handleLinkClick(profileData.websiteUrl, e)}
                    >
                      <img src="/images/website.svg" alt="Website" />
                    </a>
                  ) : (
                    <span className="website-btn disabled">
                      <img src="/images/website.svg" alt="Website" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="profileoptions">
              <a href="/editprofile">Edit Profile</a>
              <a href="/about">About</a>
              <a href="#">Help & Feedback</a>
              <a href="#">Privacy & Security</a>
              <a href="#">Banned User & Admin</a>
            </div>
          </div>
          <div className="terms-signout">
            {/* Terms & Services */}
            <div className="termsandservices">
              <div className="termscontent">
                <h3>Terms & Services</h3>
                <p>
                  Care Crumbs facilitates food donations. Users agree to donate and receive food responsibly, ensuring safety and accurate descriptions. We are not liable for food quality or health issues. Users are responsible for their conduct and information. We may modify these terms. Donors must follow food safety guidelines. Recipients must use donations appropriately. Misuse can lead to account termination. Participation is voluntary. For emergencies, contact local services.
                </p>
              </div>
              <div className="signoutbtn">
                {/* Logout Button */}
                <button
                  onClick={() => signOut()}
                  className="signoutbutton"
                >
                  Signout
                </button>
              </div>
            </div>
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

         .profile {
           display:flex;
           margin: 15vh auto 15vh auto;          
           width: 70%;
           height: 65%;
           }

           .profilecontainer{
           display: flex;
           flex-direction: column; 
           width: 70%; 
           background-color: ;
           height: 100%; 
           margin-right: 10px;
           box-sizing: border-box; 
           }

           .profileimg{
          border-radius: 50%;
          height: 27vh;
          
          display: flex;
          align-items: center;
          justify-content: center;
          }

          .profile img{
          border-radius: 50%;
          height: 27vh;
          }


          .profilecard{
          background-color: rgba(255, 255, 255, 0.1);
          diplay: flex;
          width: 100%;
          height: 27vh;
          display: flex;
          
          border-radius: 250px 50px 50px 250px;
          }

          .userdetails{
          color: white;
          margin-left: 10px;
         
         
         
          display : flex;
          align-items: center;
          justify-content: space-between;
          flex-direction: column;
          border-radius: 40px;
          padding: 0 10px
          }

          .userdetails h2{
          font-size: 1.5vw;
          margin-top: 20px;
          margin-bottom: 0;
          color: #FE6807;
          background-color: rgba(255, 255, 255, 0.1);
          text-align: center;
          border-radius: 25px;
          padding: 5px 15px 9px 15px;
         
          }

          
          .userdetails p{
          font-size: 2vh;
           background-color: rgba(255, 255, 255, 0.1);
          text-align: center;
          border-radius: 25px;
          margin-bottom: 10px;
          padding: 5px 15px 5px 15px;
          }

          

          .userlinks{
          display: flex;
          margin-bottom: 10px;
          align-items: center;
          justify-content: center;
          gap: 25px;
          width: 100%;  
         
          }

          
          .linkedin-btn{
          background-color: #Fe6807;
          Border-radius: 25px;
          padding: 5px 5px;
          }
          .github-btn{
          background-color: #Fe6807;
          Border-radius: 25px;
          padding: 5px 5px;
          }
          .website-btn{
          background-color: #Fe6807;
          Border-radius: 25px;
          padding: 5px 5px;
          }

          .userlinks img{
          height: 3vh;
          padding: px;
          transition: 0.5s;
          }

          .userlinks  img:hover {
          transform: translateY(-10px);
          height: 3vh; 
        }
   
        .terms-signout{
        margin-left: 10px;
        background-color:  rgba(255, 255, 255, 0.1);
        width: 100%;
        height: 63vh;
        border-radius: 3vw 3vw 3vw 3vw;
        }

        .termsandservices {
         display: flex;
         flex-direction: column;
         justify-content: center;  
         align-items: center;
         height: 100%;
         width: 100%;
         padding: 0px; /* Extra padding to avoid overflow */
         box-sizing: border-box; /* Ensures padding doesn't exceed width */
         }

        .termscontent {
          max-width: 80%; /* Content ko limit karo */
          text-align: center;
         }

        .termsandservices h3 {
          font-size: 2.3vw;
          color: #FE6807;
          margin-top: 0px; /* Negative margin remove kar diya */
        }

        .termsandservices p {
          font-size: 1.5vw;
          color: white;
          text-align: center; /* Better alignment */
        }

        .profileoptions{
         background-color: rgba(255,255,255,0.1);
         width: 100%;
         height: 52%;
         border-radius: 50px 25px 50px 25px;
         margin-top: 20px;
        }

         
        .profileoptions a{
        background-color: ;
        display: flex;
        color: white;
        font-size: 1.8vw;
        text-decoration: none;
        height: 3vh; 
        padding: 15px 0px 10px 30px;
        }

       
      
        .signoutbutton{
        background-color: #FE6807;
        
        border-radius: 25px;
         padding: 5px 15px 7px 15px;
         margin: 10px 20px 10px 20px;
        border:none;
        width: 6vw;
        height: 50px;
        color: white;
        font-family: 'Nighty Demo', sans-serif;
        font-size: 1.2vw;
        transition: 0.6s ease-in-out;
        
        }

        .signoutbutton:hover{
        background-color:rgba(255, 255, 255, 0.1);
        
        border-radius: 25px;
        padding: 5px 15px 7px 15px;
        border:none;
        width: 6vw;
        height: 50px;
        color: #FE6807;
        font-family: 'Nighty Demo', sans-serif;
        font-size: 1.3vw;
        ;
        }
        
        @media (max-width: 768px) {
            .nav-buttons {
              width: 80%;
            }
        }
        `}</style>
      </div>
    </>
  );
}