const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { withCacheControl } = require('./utils');

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
    const orderId = event.queryStringParameters?.orderId;
    
    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'orderId is required' }),
      };
    }

    console.log('Fetching images for order:', orderId);

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId, 10) },
      select: {
        id: true,
        proofImage: true,
        trackingText: true,
        trackingImages: true,
        paymentMethod: true,
        paymentRecipient: true,
        paymentAccountInfo: true,
        proofReference: true,
        items: {
          select: {
            id: true,
            image_front: true,
            image_back: true,
            patch_images: true,
          }
        }
      },
    });
    
    if (!order) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Order not found' }),
      };
    }

    console.log('Order images fetched successfully for order:', orderId);
    
    return {
      statusCode: 200,
      headers: withCacheControl({ 'Access-Control-Allow-Origin': '*' }, 60, 30),
      body: JSON.stringify({
        orderId: order.id,
        proofImage: order.proofImage,
        trackingText: order.trackingText,
        trackingImages: order.trackingImages || [],
        paymentMethod: order.paymentMethod,
        paymentRecipient: order.paymentRecipient,
        paymentAccountInfo: order.paymentAccountInfo,
        proofReference: order.proofReference,
        items: order.items.map(item => ({
          id: item.id,
          image_front: item.image_front,
          image_back: item.image_back,
          patch_images: item.patch_images || []
        }))
      }),
    };
  } catch (err) {
    console.error('Error in getOrderImages:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
