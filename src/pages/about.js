import { useSession, signOut, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Profile() {
    const { data: session } = useSession();
    const router = useRouter();
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Get session on component mount to ensure we have the latest data
        const fetchSession = async () => {
            const sessionData = await getSession();
            if (sessionData) {
                console.log("Session data:", sessionData); // Debug session data
                setUserData(sessionData.user);
            }
        };

        fetchSession();
    }, []);

    if (!session) {
        router.push("/signin"); // Redirect if not logged in
        return null;
    }

    // Display mobile number with fallback
    const mobileNumber = userData?.mobile || session?.user?.mobile || "No mobile number available";

    return (
        <>
            <Head>
                <title>About Care Crumbs</title>
            </Head>
            <div className="main-content">
                <div id="navbar">
                    <img src="/logo.svg" alt="Care Crumbs logo" className="logo" />
                    <h1>About Care Crumbs</h1>
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

                    <div className="terms-signout">
                        {/* Terms & Services */}
                        <div className="termsandservices">
                            <div className="termscontent">
                                <h3>About Care Crumbs</h3>
                                <p>
                                    CareCrumbs is an innovative food donation platform dedicated to reducing food waste and ensuring that surplus food reaches those in need. With a user-friendly interface, individuals, restaurants, and organizations can easily donate excess food, track their contributions, and play an active role in fighting hunger. By streamlining the donation process, CareCrumbs aims to create a seamless connection between food donors and those who rely on these resources, ultimately working towards a future where no food goes to waste and no one sleeps hungry.
                                    <br></br>
                                    <br></br>
                                    This platform has been developed by <span className="name">Kanan Singh</span>, a Junior Developer at <span className="name">CyberShoora</span> .  <span className="name">CyberShoora</span> is a forward-thinking IT company known for delivering unique designs, cutting-edge applications, and futuristic websites. With a strong focus on innovation and social impact, CyberShoora is committed to leveraging technology to build solutions that make a real difference. CareCrumbs is a testament to this vision, empowering communities and fostering a culture of responsible food distribution through technology.
                                </p>
                            </div>
                            <div className="signoutbtn">
                                {/* Logout Button */}
                                <a href="/profile">
                                    <button className="signoutbutton"
                                    >
                                        Back to Profile
                                    </button></a>
                            </div>
                        </div>


                    </div>
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
           width: 80%;
           height: 100%;
           }

          .name{
          color: #fe6807;
          }
   
        .terms-signout{
        background-color:  rgba(255, 255, 255, 0.1);
        width: 100%;
        height: 100%;
        border-radius: 10vw 3vw 10vw 3vw;
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

        

       
      
        .signoutbutton{
        background-color: #FE6807;
        
        border-radius: 25px;
         padding: 5px 15px 7px 15px;
         margin: 10px 20px 10px 20px;
        border:none;
        width: 10vw;
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
        width: 10vw;
        height: 50px;
        color: #FE6807;
        font-family: 'Nighty Demo', sans-serif;
        font-size: 1.3vw;
        ;
        }

        `}</style>
            </div>
        </>
    );
}