import { MongoClient } from 'mongodb';

// CHECK: Ensure the URI exists. If using local, it usually looks like this.
// You should ideally have this in a .env file, but for now, we can fallback to local.
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  // In development, it's okay to warn. In production, this should throw an error.
  console.warn('MONGODB_URI not found in .env, falling back to localhost.');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;