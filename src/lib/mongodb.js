import { MongoClient } from "mongodb";


const uri = process.env.MONGODB_URI;
const dbName = "carecrumbs";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function connectToDatabase() {
  const client = await clientPromise;
  return { db: client.db(dbName) };
}