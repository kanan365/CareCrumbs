import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

// Custom AuthGuard component
function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === "loading";
  
  // Public pages that don't require authentication
  const publicPages = ['/users/signin', '/users/signup', '/forget-password'];
  const isPublicPage = publicPages.includes(router.pathname);

  useEffect(() => {
    // If not a public page and no session, redirect to login
    if (!isLoading && !session && !isPublicPage) {
      router.replace('/users/signin');
    }
    
    // If logged in and on a login/signup page, redirect to homepage
    if (!isLoading && session && isPublicPage) {
      router.replace('/homepage');
    }
  }, [session, isLoading, router, isPublicPage]);

  // Show loading or the actual page content
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return children;
}

function MyApp({ Component, pageProps }) {
  return (
    <SessionProvider 
      session={pageProps.session}
      // Refetch session every 5 minutes to keep it fresh
      refetchInterval={5 * 60}
      // Refetch when window is focused
      refetchOnWindowFocus={true}
    >
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </SessionProvider>
  );
}

export default MyApp;