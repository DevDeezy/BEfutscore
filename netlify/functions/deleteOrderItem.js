const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { orderItemId } = event.queryStringParameters || {};
    
    if (!orderItemId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'orderItemId is required' }),
      };
    }

    // First, get the order item to find the order
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: parseInt(orderItemId) },
      include: { order: true },
    });

    if (!orderItem) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Order item not found' }),
      };
    }

    // Delete the order item
    await prisma.orderItem.delete({
      where: { id: parseInt(orderItemId) },
    });

    // Recalculate order price
    const remainingItems = await prisma.orderItem.findMany({
      where: { order_id: orderItem.order_id },
      include: {
        product: true,
        shirtType: true,
      },
    });

    // Calculate new total price based on remaining items
    const { calculateOrderPrice } = require('./calculateOrderPrice');
    const packs = await prisma.pack.findMany({ include: { items: true } });
    const shirtTypes = await prisma.shirtType.findMany();
    const shoePrice = 50; // TODO: Replace with dynamic shoe price if needed
    const patches = await prisma.patch.findMany();

    const itemsForCalculation = remainingItems.map(item => ({
      product_type: item.product_type,
      shirt_type_id: item.shirt_type_id,
      product_id: item.product_id,
      size: item.size,
      quantity: item.quantity,
      price: item.product?.price || (item.shirtType?.price || 0),
      patch_images: item.patch_images || [],
      player_name: item.player_name,
      numero: item.numero,
    }));

    const newTotalPrice = calculateOrderPrice(itemsForCalculation, packs, shirtTypes, shoePrice, patches);

    // Update order total price
    await prisma.order.update({
      where: { id: orderItem.order_id },
      data: { total_price: newTotalPrice },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: true,
        newTotalPrice,
        remainingItemsCount: remainingItems.length,
      }),
    };
  } catch (error) {
    console.error('Error deleting order item:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

