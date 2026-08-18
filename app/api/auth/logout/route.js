import clientPromise from '@/lib/db';

const dbName = 'auth_db';
const sessionCollection = 'sessions';

export async function POST(req) {
  const { token } = await req.json();

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const sessions = db.collection(sessionCollection);

    const result = await sessions.deleteOne({ token });
    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ message: 'Session not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Logout successful' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
}