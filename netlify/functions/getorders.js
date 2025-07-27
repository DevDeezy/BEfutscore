const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const userId = event.queryStringParameters.userId;
    const orderId = event.queryStringParameters.orderId;
    
    let whereClause = {};
    let queryOptions = {
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
      orderBy: { created_at: 'desc' }
    };

    if (orderId) {
      // Fetch specific order by ID
      whereClause = { id: parseInt(orderId, 10) };
      const order = await prisma.order.findFirst({
        where: whereClause,
        include: queryOptions.include,
      });
      
      if (!order) {
        return {
          statusCode: 404,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Order not found' }),
        };
      }
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify([order]),
      };
    } else {
      // Fetch orders by user ID or all orders
      whereClause = userId ? { user_id: parseInt(userId, 10) } : {};
      const orders = await prisma.order.findMany({
        where: whereClause,
        ...queryOptions,
      });
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(orders),
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};