import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === 'loading') return; // Wait for session to load
    
    if (session) {
      router.replace('/homepage');
    } else {
      router.replace('/users/signin');
    }
  }, [session, status, router]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Nighty Demo, sans-serif',
      background: '#FE6807',
      color: 'white'
    }}>
      <h1>Redirecting...</h1>
    </div>
  );
}