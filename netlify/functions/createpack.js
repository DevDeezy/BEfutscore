const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('createpack called', { method: event.httpMethod, body: event.body });
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: 'Method Not Allowed',
    };
  }

  try {
    const pack = JSON.parse(event.body);
    console.log('Parsed pack:', pack);
    
    // Validate required fields
    if (!pack.name || !pack.items || !Array.isArray(pack.items) || pack.items.length === 0 || typeof pack.price !== 'number') {
      console.error('Invalid pack data:', pack);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid pack data' }),
      };
    }

    const createdPack = await prisma.pack.create({
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
    console.log('Created pack:', createdPack);
    
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(createdPack),
    };
  } catch (error) {
    console.error('Error in createpack:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to create pack', details: error.message }),
    };
  }
}; 