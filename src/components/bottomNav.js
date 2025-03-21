// components/bottomNav.js
import Link from "next/link";

export default function BottomNav() {
  return (
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
      <Link href="/receipt" className="btn">
        <img src="/images/Recipt.svg" alt="Receipt" className="icon" />
      </Link>
      <Link href="/dashboard" className="btn">
        <img src="/images/Dashboard.svg" alt="Dashboard" className="icon" />
      </Link>
      <Link href="/profile" className="btn">
        <img src="/images/Profile.svg" alt="Profile" className="icon" />
      </Link>

      <style jsx>{`
        .nav-buttons {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 90px;
          background-color: rgba(84, 82, 82, 0.3);
          backdrop-filter: blur(5px);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 50px;
          padding: 0 50px;
          z-index: 100;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .icon {
          width: 30px;
          height: 30px;
        }

        @media (max-width: 850px) {
          .nav-buttons {
            width: 90%;
            padding: 0 20px;
          }
        }

        @media (max-width: 600px) {
          .nav-buttons {
            width: 95%;
            height: 70px;
          }
          
          .btn {
            width: 40px;
            height: 40px;
          }
          
          .icon {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
}