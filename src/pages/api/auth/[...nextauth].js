import NextAuth from "next-auth"; 
import GoogleProvider from "next-auth/providers/google"; 
import CredentialsProvider from "next-auth/providers/credentials"; 
import { connectToDatabase } from "../../../lib/mongodb";  

export default NextAuth({   
  providers: [     
    GoogleProvider({       
      clientId: process.env.GOOGLE_CLIENT_ID,       
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,     
    }),     
    CredentialsProvider({       
      name: "Credentials",       
      credentials: {         
        emailOrMobile: { label: "Email or Mobile", type: "text" },         
        password: { label: "Password", type: "password" }       
      },       
      async authorize(credentials) {         
        try {           
          const { db } = await connectToDatabase();           
          const usersCollection = db.collection("users");           
                   
          // Find user by email or mobile           
          const user = await usersCollection.findOne({             
            $or: [               
              { email: credentials.emailOrMobile },               
              { mobile: credentials.emailOrMobile }             
            ]           
          });           
                   
          if (!user) {             
            throw new Error("User not found");           
          }           
                   
          // Simple password comparison           
          if (user.password !== credentials.password) {             
            throw new Error("Invalid password");           
          }           
                   
          return {             
            id: user._id.toString(),             
            name: user.name,             
            email: user.email,             
            mobile: user.mobile,              
            image: user.profileImage || null           
          };        
        } catch (error) {           
          console.error("Auth error:", error);           
          throw new Error(error.message || "Authentication failed");         
        }       
      }     
    })   
  ],   
  callbacks: {     
    async signIn({ user, account, profile }) {       
      if (account.provider === "google") {         
        try {           
          // Connect to database           
          const { db } = await connectToDatabase();           
          const usersCollection = db.collection("users");           
                   
          // Check if user already exists           
          const existingUser = await usersCollection.findOne({ email: user.email });           
                   
          if (!existingUser) {             
            // Save new user from Google data             
            await usersCollection.insertOne({               
              name: user.name,               
              email: user.email,               
              profileImage: user.image,               
              mobile: "", // Default empty since Google doesn't provide mobile               
              password: "", // No password for Google auth               
              provider: "google",               
              providerAccountId: profile.sub || profile.id,               
              createdAt: new Date()             
            });             
            console.log("New Google user saved to database:", user.email);           
          } else {             
            console.log("Existing user logged in with Google:", user.email);           
          }         
        } catch (error) {           
          console.error("Error saving Google user to database:", error);           
          // Still allow sign in even if DB save fails         
        }       
      }       
      return true;     
    },     
    async redirect({ url, baseUrl }) {       
      return url.startsWith(baseUrl) ? url : `${baseUrl}/homepage`;     
    },     
    async session({ session, token }) {       
      // Add mobile to session from token if available
      if (token && token.mobile) {
        session.user.mobile = token.mobile;
      }
      return session;     
    },     
    async jwt({ token, user }) {       
      // Add user mobile to token if available
      if (user) {         
        token.id = user.id;
        token.mobile = user.mobile;
      }       
      return token;     
    }   
  },   
  pages: {     
    signIn: '/users/signin',     
    newUser: '/src/pages/index', // Redirect new users to homepage   
  },   
  secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret-key",   
  session: {     
    strategy: 'jwt',     
    maxAge: 30 * 24 * 60 * 60, // 30 days   
  },   
  debug: process.env.NODE_ENV === 'development', 
});