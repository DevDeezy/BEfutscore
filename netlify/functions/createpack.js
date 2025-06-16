const { MongoClient, ObjectId } = require('mongodb');

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Method Not Allowed',
    };
  }

  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    const pack = JSON.parse(event.body);
    
    // Validate required fields
    if (!pack.name || !pack.items || !Array.isArray(pack.items) || pack.items.length === 0 || typeof pack.price !== 'number') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid pack data' }),
      };
    }

    await client.connect();
    const database = client.db('futscore');
    const collection = database.collection('packs');
    
    const newPack = {
      ...pack,
      _id: new ObjectId().toString(),
      created_at: new Date().toISOString(),
    };
    
    await collection.insertOne(newPack);
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(newPack),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to create pack' }),
    };
  } finally {
    await client.close();
  }
}; 