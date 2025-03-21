// components/navbar.js
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <div id="navbar">
      <Link href="/homepage">
        <img src="/logo.svg" alt="Care Crumbs logo" className="logo" />
      </Link>
      <h1>Care Crumbs</h1>
      <div id="nav-icons">
        <Link href="/cart" className="nav-btn">
          <img src="/images/Cart.svg" alt="Cart" className="nav-icon" />
        </Link>
        <Link href="/profile" className="nav-btn">
          <img src="/images/Profile.svg" alt="Profile" className="nav-icon" />
        </Link>
      </div>

      <style jsx>{`
        #navbar {
          position: fixed;
          width: 100%;
          height: 90px;
          background-color: rgba(81, 80, 80, 0.3);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 100;
        }

        .logo {
          height: 150px;
          width: 250px;
        }

        #navbar h1 {
          color: white;
          font-size: 45px;
        }

        #nav-icons {
          width: 120px;
          height: 100px;
          margin-right: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-icon {
          width: 30px;
          height: 30px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .nav-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}