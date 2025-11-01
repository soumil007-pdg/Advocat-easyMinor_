import { MongoClient } from 'mongodb';

const uri = 'mongodb://localhost:27017';
let client; // Reuse client connection

export async function POST(req) {
  const { token } = await req.json();

  try {
    if (!client || !client.topology?.isConnected()) {
      client = new MongoClient(uri);
      await client.connect();
      console.log('New MongoDB client connected');
    }
    const db = client.db('auth_db');
    const sessions = db.collection('sessions');

    if (!token) {
      console.error('No token provided');
      return new Response(JSON.stringify({ isValid: false, message: 'No token provided' }), { status: 400 });
    }

    const session = await sessions.findOne({ token });
    if (!session) {
      console.error('Session not found for token:', token);
      return new Response(JSON.stringify({ isValid: false, message: 'Session not found' }), { status: 401 });
    }

    console.log('Session validated for token:', token);
    return new Response(JSON.stringify({ isValid: true, email: session.email }), { status: 200 });
  } catch (err) {
    console.error('Validation error:', err);
    return new Response(JSON.stringify({ isValid: false, message: 'Server error' }), { status: 500 });
  }
}