// components/loader.js
import React from "react";

export default function Loader() {
  return (
    <div className="loader-container">
      <div className="loader">
        <div className="spinner"></div>
        <img src="/logo.svg" alt="Care Crumbs logo" className="loader-logo" />
      </div>

      <style jsx>{`
        .loader-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }

        .loader {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 120px;
          height: 120px;
          border: 6px solid rgba(255, 107, 0, 0.3);
          border-top: 6px solid #FF6B00;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loader-logo {
          position: absolute;
          width: 80px;
          height: 80px;
          object-fit: contain;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}