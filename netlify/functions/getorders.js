const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  console.log('=== getorders FUNCTION START ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Query Parameters:', event.queryStringParameters);
  
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
    const userId = event.queryStringParameters?.userId;
    const orderId = event.queryStringParameters?.orderId;
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 20;
    const skip = (page - 1) * limit;
    
    console.log('Parsed parameters:', { userId, orderId, page, limit, skip });
    
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
    console.log('Is list view:', isListView);
    
    if (isListView) {
      console.log('Using select mode for list view (excluding videos and large fields)');
      queryOptions = {
        select: {
          id: true,
          user_id: true,
          status: true,
          address_nome: true,
          address_morada: true,
          address_cidade: true,
          address_distrito: true,
          address_pais: true,
          address_codigo_postal: true,
          address_telemovel: true,
          total_price: true,
          proofReference: true,
          paymentMethod: true,
          // Exclude proofImage, trackingText, trackingImages, trackingVideos for smaller payload
          clientInstagram: true,
          created_at: true,
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
    } else {
      console.log('Using include mode for single order view');
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
      console.log('Getting total count with whereClause:', whereClause);
      const totalCount = await prisma.order.count({
        where: whereClause,
      });
      console.log('Total count:', totalCount);
      
      console.log('Fetching orders with query options...');
      const orders = await prisma.order.findMany({
        where: whereClause,
        ...queryOptions,
        skip,
        take: limit,
      });
      
      console.log('Orders fetched:', orders.length);
      console.log('Sample order keys:', orders.length > 0 ? Object.keys(orders[0]) : 'No orders');
      
      // Calculate payload size
      const responseData = {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
      
      const jsonString = JSON.stringify(responseData);
      console.log('Response payload size:', jsonString.length, 'characters');
      console.log('Response payload size MB:', (jsonString.length / (1024 * 1024)).toFixed(2));
      
      // Log detailed item counts if payload is large
      if (jsonString.length > 1000000) { // > 1MB
        console.log('Large payload detected! Analyzing...');
        orders.forEach((order, idx) => {
          console.log(`Order ${idx + 1}:`);
          console.log('- Items count:', order.items?.length || 0);
          console.log('- ProofImage size:', order.proofImage?.length || 0);
          console.log('- TrackingText size:', order.trackingText?.length || 0);
          console.log('- TrackingImages count:', order.trackingImages?.length || 0);
          if (order.trackingImages?.length > 0) {
            console.log('- TrackingImages total size:', order.trackingImages.reduce((sum, img) => sum + img.length, 0));
          }
        });
      }
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: jsonString,
      };
    }
  } catch (err) {
    console.error('=== ERROR in getorders ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Error code:', err.code);
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: err.message,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }),
    };
  }
};