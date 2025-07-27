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
    const orderId = event.path.split('/').pop();
    const { proofReference, proofImage, paymentMethod } = JSON.parse(event.body || '{}');
    
    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'orderId is required' }),
      };
    }

    // Check if order exists and is in "Em pagamento" status
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

    if (existingOrder.status !== 'Em pagamento') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Can only update payment proof for orders in "Em pagamento" status' }),
      };
    }

    // Update order with payment proof
    const order = await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        proofReference: proofReference || null,
        proofImage: proofImage || null,
        paymentMethod: paymentMethod || null,
      },
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