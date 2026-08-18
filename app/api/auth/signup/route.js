import clientPromise from '@/lib/db';
import bcrypt from 'bcryptjs';

const dbName = 'auth_db';
const collectionName = 'users';

export async function POST(req) {
  const { email, password } = await req.json();

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ message: 'User already exists' }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await collection.insertOne({ email, password: hashedPassword });

    return new Response(JSON.stringify({ message: 'Signup successful' }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
}