const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
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

  try {
    const packId = parseInt(event.path.split('/').pop(), 10);
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

    // Delete old items and create new ones
    await prisma.packItem.deleteMany({ where: { pack_id: packId } });
    const updatedPack = await prisma.pack.update({
      where: { id: packId },
      data: {
        name: pack.name,
        price: pack.price,
        items: {
          create: pack.items.map(item => ({
            product_type: item.product_type,
            quantity: item.quantity,
            shirt_type: item.shirt_type || null,
          })),
        },
      },
      include: { items: true },
    });
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(updatedPack),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to update pack' }),
    };
  }
}; 