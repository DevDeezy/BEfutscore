const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  console.log('updateOrderTracking called with method:', event.httpMethod);
  console.log('Request body:', event.body);
  
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
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
    console.log('Invalid method:', event.httpMethod);
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    console.log('Parsing request body...');
    
    if (!event.body) {
      console.log('Request body is empty');
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
      console.log('JSON parsing successful');
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError.message);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    const { orderId, trackingText, trackingImages, trackingVideos } = parsedBody;
    console.log('Parsed data:', { 
      orderId, 
      trackingText: trackingText ? 'present' : 'null', 
      trackingImages: trackingImages?.length || 'none', 
      trackingVideos: trackingVideos?.length || 'none' 
    });

    if (!orderId) {
      console.log('Missing orderId in request');
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Order ID is required' }),
      };
    }

    console.log('Attempting to update order with ID:', orderId);
    console.log('Update data:', {
      trackingText: trackingText || null,
      trackingImages: trackingImages || [],
      trackingVideos: trackingVideos || [],
    });

    // Check if order exists first
    const existingOrder = await prisma.order.findUnique({
      where: { id: parseInt(orderId, 10) }
    });

    if (!existingOrder) {
      console.log('Order not found:', orderId);
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Order not found' }),
      };
    }

    console.log('Order exists, proceeding with update...');

    // Prepare update data - only include fields that exist
    const updateData = {
      trackingText: trackingText || null,
      trackingImages: trackingImages || [],
    };

    // Only add trackingVideos if it's provided (in case column doesn't exist yet)
    if (trackingVideos !== undefined) {
      updateData.trackingVideos = trackingVideos || [];
    }

    console.log('Final update data:', updateData);

    // Update the order with tracking information
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId, 10) },
      data: updateData,
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

    console.log('Order updated successfully:', updatedOrder.id);

    console.log('Returning success response');
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(updatedOrder),
    };
  } catch (err) {
    console.error('Error in updateOrderTracking:');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Error code:', err.code);
    console.error('Error name:', err.name);
    
    // Check if it's a Prisma error
    if (err.code && err.code.startsWith('P')) {
      console.error('Prisma error detected:', err.code);
      console.error('Prisma meta:', err.meta);
    }
    
    // Check if it's a database column error
    if (err.message && err.message.includes('column')) {
      console.error('Possible database schema issue - column not found');
    }
    
    console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: err.message,
        code: err.code,
        name: err.name,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }),
    };
  }
}; 