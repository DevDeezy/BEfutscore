const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  // CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const orderId = event.path.split('/').pop();
    const { images } = JSON.parse(event.body || '{}');
    // Update each order item with imageFront/imageBack
    // Assumes images is an array in the same order as order.items
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        items: {
          updateMany: images.map((img, idx) => ({
            where: { /* you may need to provide a unique identifier for each item */ },
            data: {
              imageFront: img.imageFront,
              imageBack: img.imageBack || null,
            },
          })),
        },
      },
      include: { items: true },
    });
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(order),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 