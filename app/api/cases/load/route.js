import clientPromise from '@/lib/db';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response('Missing email', { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('auth_db');
    const collection = db.collection('user_cases');
    
    const record = await collection.findOne({ email });

    // Return empty object if no cases found
    return new Response(JSON.stringify({ cases: record ? record.cases : {} }), { status: 200 });
  } catch (error) {
    console.error('Load error:', error);
    return new Response(JSON.stringify({ message: 'Error loading cases' }), { status: 500 });
  }
}