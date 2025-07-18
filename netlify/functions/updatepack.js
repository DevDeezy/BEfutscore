const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('updatepack called', { method: event.httpMethod, body: event.body });
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: 'Method Not Allowed',
    };
  }

  try {
    const packId = parseInt(event.path.split('/').pop(), 10);
    const pack = JSON.parse(event.body);
    if (!pack.name || !pack.items || !Array.isArray(pack.items) || pack.items.length === 0 || typeof pack.price !== 'number') {
      return {
        statusCode: 400,
        headers: corsHeaders,
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
        cost_price: typeof pack.cost_price === 'number' ? pack.cost_price : null,
        items: {
          create: pack.items.map(item => {
            const packItemData = {
              product_type: item.product_type,
              quantity: item.quantity,
            };

            if (item.product_type === 'tshirt' && item.shirt_type_id) {
              packItemData.shirtType = {
                connect: { id: item.shirt_type_id },
              };
            }

            return packItemData;
          }),
        },
      },
      include: { items: true },
    });
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(updatedPack),
    };
  } catch (error) {
    console.error('Error in updatepack:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to update pack', details: error.message, stack: error.stack }),
    };
  }
}; 