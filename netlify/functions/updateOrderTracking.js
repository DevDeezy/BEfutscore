const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
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
    const { orderId, trackingText, trackingImages } = JSON.parse(event.body);

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Order ID is required' }),
      };
    }

    // Update the order with tracking information
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId, 10) },
      data: {
        trackingText: trackingText || null,
        trackingImages: trackingImages || [],
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            instagramName: true,
          },
        },
      },
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(updatedOrder),
    };
  } catch (err) {
    console.error('Error updating order tracking:', err);
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 