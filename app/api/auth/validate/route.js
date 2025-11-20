import clientPromise from '@/lib/db';

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ isValid: false, message: 'No token provided' }), { status: 400 });
    }

    // Use the shared client
    const client = await clientPromise;
    const db = client.db('auth_db');
    const sessions = db.collection('sessions');

    const session = await sessions.findOne({ token });
    
    if (!session) {
      return new Response(JSON.stringify({ isValid: false, message: 'Session not found' }), { status: 401 });
    }

    // Check Expiration
    if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
       // Token is expired, remove it
       await sessions.deleteOne({ token });
       return new Response(JSON.stringify({ isValid: false, message: 'Session expired' }), { status: 401 });
    }

    return new Response(JSON.stringify({ isValid: true, email: session.email }), { status: 200 });
  } catch (err) {
    console.error('Validation error:', err);
    return new Response(JSON.stringify({ isValid: false, message: 'Server error' }), { status: 500 });
  }
}