import clientPromise from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const dbName = 'auth_db';
const userCollection = 'users';
const sessionCollection = 'sessions';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ message: 'Email and password are required' }), { status: 400 });
    }

    // 1. Reuse the database connection
    const client = await clientPromise;
    const db = client.db(dbName);
    const users = db.collection(userCollection);
    const sessions = db.collection(sessionCollection);

    // 2. Check if user exists
    const user = await users.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ message: 'Invalid email or password' }), { status: 401 });
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return new Response(JSON.stringify({ message: 'Invalid email or password' }), { status: 401 });
    }

    // 4. Create Session with Expiration
    const sessionToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    await sessions.insertOne({
      token: sessionToken,
      email,
      createdAt: new Date(),
      expiresAt: expiresAt // Save the expiry date
    });

    // 5. Return success
    return new Response(JSON.stringify({ 
      message: 'Login successful', 
      token: sessionToken 
    }), { status: 200 });

  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
}