import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
const dbName = 'auth_db';
const userCollection = 'users';
const sessionCollection = 'sessions';

export async function POST(req) {
  const { email, password } = await req.json();

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection(userCollection);
    const sessions = db.collection(sessionCollection);

    const user = await users.findOne({ email });
    if (!user) {
      // console.error('User not found:', email);
      return new Response(JSON.stringify({ message: 'Invalid email or password' }), { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // console.error('Password mismatch for:', email);
      return new Response(JSON.stringify({ message: 'Invalid email or password' }), { status: 401 });
    }

    const sessionToken = uuidv4();
    const session = await sessions.insertOne({
      token: sessionToken,
      email,
      createdAt: new Date(),
    });
    // console.log('Session created:', { token: sessionToken, email, _id: session.insertedId });

    return new Response(JSON.stringify({ message: 'Login successful', token: sessionToken }), { status: 200 });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });
  } finally {
    await client.close();
  }
}