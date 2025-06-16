const { MongoClient } = require('mongodb');

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

  if (event.httpMethod !== 'PUT') {
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
    const packId = event.path.split('/').pop();
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
    
    const result = await collection.findOneAndUpdate(
      { _id: packId },
      { $set: pack },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Pack not found' }),
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.value),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to update pack' }),
    };
  } finally {
    await client.close();
  }
}; 