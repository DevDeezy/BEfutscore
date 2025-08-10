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
    // Try to get orderId from URL path first, then from request body
    let orderId = event.path.split('/').pop();
    const body = JSON.parse(event.body || '{}');
    
    // If orderId is not in URL path, get it from request body
    if (!orderId || isNaN(parseInt(orderId, 10))) {
      orderId = body.orderId;
    }
    
    // Accept both 'price' and 'total_price' parameters
    const total_price = body.total_price || body.price;
    
    if (!orderId || typeof total_price !== 'number') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'orderId and total_price/price are required' }),
      };
    }

    // Check if order exists
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

    // Allow updates for both "Para analisar" and "A Orçamentar" statuses
    if (existingOrder.status !== 'Para analisar' && existingOrder.status !== 'A Orçamentar') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Can only update price for orders in "Para analisar" or "A Orçamentar" status' }),
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