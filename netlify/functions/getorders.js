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
    const page = parseInt(event.queryStringParameters.page) || 1;
    const limit = parseInt(event.queryStringParameters.limit) || 20;
    const skip = (page - 1) * limit;
    
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

    // For list views, exclude large video data to prevent 502 errors
    const isListView = !orderId;
    if (isListView) {
      queryOptions.select = {
        id: true,
        user_id: true,
        status: true,
        delivery_first_name: true,
        delivery_last_name: true,
        delivery_address: true,
        delivery_postal_code: true,
        delivery_city: true,
        delivery_phone: true,
        total_price: true,
        proofReference: true,
        paymentMethod: true,
        proofImage: true,
        clientInstagram: true,
        trackingText: true,
        trackingImages: true,
        // Exclude trackingVideos from list view
        created_at: true,
        updated_at: true,
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            instagramName: true,
          },
        },
      };
    }

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
      // Fetch orders by user ID or all orders with pagination
      whereClause = userId ? { user_id: parseInt(userId, 10) } : {};
      
      // Get total count for pagination
      const totalCount = await prisma.order.count({
        where: whereClause,
      });
      
      const orders = await prisma.order.findMany({
        where: whereClause,
        ...queryOptions,
        skip,
        take: limit,
      });
      
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          orders,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        }),
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