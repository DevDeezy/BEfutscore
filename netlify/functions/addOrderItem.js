const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateOrderPrice } = require('./calculateOrderPrice');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, productId, shirtTypeId, size, quantity = 1, playerName, numero, sexo, ano, patchImages = [] } = body;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'orderId is required' }),
      };
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    });

    if (!order) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Order not found' }),
      };
    }

    let product = null;
    let productType = 'tshirt';
    let costPrice = 0;

    if (productId) {
      // Get product details
      product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: { productType: true, shirtType: true },
      });

      if (!product) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Product not found' }),
        };
      }

      productType = product.productType?.base_type || 'tshirt';
      costPrice = product.cost_price || 0;
    } else if (shirtTypeId) {
      // Custom t-shirt
      const shirtType = await prisma.shirtType.findUnique({
        where: { id: parseInt(shirtTypeId) },
      });

      if (!shirtType) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Shirt type not found' }),
        };
      }

      costPrice = shirtType.cost_price || 0;
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Either productId or shirtTypeId is required' }),
      };
    }

    // Validate size if product has available sizes
    if (product && product.available_sizes && product.available_sizes.length > 0) {
      if (!size || !product.available_sizes.includes(size)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Invalid size. Available sizes: ${product.available_sizes.join(', ')}` }),
        };
      }
    }

    // Create order item
    const orderItem = await prisma.orderItem.create({
      data: {
        order_id: parseInt(orderId),
        product_id: productId ? parseInt(productId) : null,
        product_type: productType,
        size: size || 'M',
        quantity: parseInt(quantity) || 1,
        shirt_type_id: shirtTypeId ? parseInt(shirtTypeId) : (product?.shirt_type_id || null),
        player_name: playerName || null,
        numero: numero || null,
        sexo: sexo || null,
        ano: ano || null,
        patch_images: Array.isArray(patchImages) ? patchImages : [],
        cost_price: costPrice,
      },
      include: {
        product: true,
        shirtType: true,
      },
    });

    // Recalculate order price
    const allItems = await prisma.orderItem.findMany({
      where: { order_id: parseInt(orderId) },
      include: {
        product: true,
        shirtType: true,
      },
    });

    const packs = await prisma.pack.findMany({ include: { items: true } });
    const shirtTypes = await prisma.shirtType.findMany();
    const shoePrice = 50; // TODO: Replace with dynamic shoe price if needed
    const patches = await prisma.patch.findMany();

    const itemsForCalculation = allItems.map(item => ({
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
      where: { id: parseInt(orderId) },
      data: { total_price: newTotalPrice },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        orderItem,
        newTotalPrice,
      }),
    };
  } catch (error) {
    console.error('Error adding order item:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

