// components/layout.js
import React from "react";
import Navbar from "/navbar";
import BottomNav from "./bottomNav";
import Loader from "./loader";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  // Check authentication
  React.useEffect(() => {
    if (status === "unauthenticated" && router.pathname !== "/signin") {
      router.push("/signin");
    }
  }, [status, router]);

  // Set up loading state for route changes
  React.useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  // For pages that don't need navbar/bottomNav
  const noNavPages = ["/signin", "/signup"];
  const showNav = !noNavPages.includes(router.pathname);

  if (status === "loading") {
    return <Loader />;
  }

  return (
    <div className="app-container">
      {showNav && <Navbar />}
      
      <main className="main-content">
        {children}
      </main>
      
      {showNav && <BottomNav />}
      
      {/* Global loader that can be shown/hidden */}
      <div id="loader" style={{ display: "none" }}>
        <Loader />
      </div>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          position: relative;
        }
        
        .main-content {
          padding-top: ${showNav ? "90px" : "0"};
          padding-bottom: ${showNav ? "120px" : "0"};
        }
      `}</style>
    </div>
  );
}