import clientPromise from '@/lib/db';

export async function POST(req) {
  try {
    const { email, cases } = await req.json();
    
    if (!email || !cases) {
      return new Response('Missing email or cases data', { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('auth_db');
    const collection = db.collection('user_cases');
    
    // Upsert: Update the document if it matches the email, otherwise insert a new one
    await collection.updateOne(
      { email: email },
      { $set: { cases: cases, updatedAt: new Date() } },
      { upsert: true }
    );

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Save error:', error);
    return new Response(JSON.stringify({ message: 'Error saving cases' }), { status: 500 });
  }
}