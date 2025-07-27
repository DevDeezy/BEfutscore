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
    const { total_price } = JSON.parse(event.body || '{}');
    
    if (!orderId || typeof total_price !== 'number') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'orderId and total_price are required' }),
      };
    }

    // Check if order exists and is in "Para analizar" status
    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(orderId) }
    });

    if (!existingOrder) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Order not found' }),
      };
    }

    if (existingOrder.status !== 'Para analizar') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Can only update price for orders in "Para analizar" status' }),
      };
    }

    // Update order price
    const order = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { total_price },
      include: { items: true, user: true },
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