// src/pages/users/[id].js
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default function UserPage({ user }) {
  // रेंडर UI
  return (
    <div>
      <h1>{user?.name || "User"}</h1>
      {/* अन्य UI elements */}
    </div>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;
    
    // ID validation check
    let user = null;
    if (ObjectId.isValid(id)) {
      user = await db.collection("users").findOne({ _id: new ObjectId(id) });
    } else {
      console.error("Invalid ObjectId format");
    }
    
    // Null check and convert BSON to valid JSON
    if (!user) {
      return {
        notFound: true, // 404 page
      };
    }
    
    // BSON to JSON conversion
    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
      },
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      props: { error: "Failed to load user" },
    };
  }
}