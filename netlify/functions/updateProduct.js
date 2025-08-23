const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    // Check authentication
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return { statusCode: 401, headers: corsHeaders, body: 'Unauthorized' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, headers: corsHeaders, body: 'Forbidden' };
    }

    // Get product ID from URL path
    const productId = event.path.split('/').pop();
    if (!productId || isNaN(parseInt(productId))) {
      return { 
        statusCode: 400, 
        headers: corsHeaders, 
        body: JSON.stringify({ error: 'Invalid product ID' }) 
      };
    }

    const { name, description, price, image_url, available_sizes, product_type_id, sexo, ano, numero, cost_price } = JSON.parse(event.body || '{}');

    if (!name || !price || !image_url || !available_sizes || !product_type_id) {
      return { 
        statusCode: 400, 
        headers: corsHeaders, 
        body: JSON.stringify({ error: 'Missing required fields' }) 
      };
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!existingProduct) {
      return { 
        statusCode: 404, 
        headers: corsHeaders, 
        body: JSON.stringify({ error: 'Product not found' }) 
      };
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        name,
        description,
        price,
        cost_price: typeof cost_price === 'number' ? cost_price : null,
        image_url,
        available_sizes,
        product_type_id: parseInt(product_type_id),
        sexo: sexo || 'Neutro',
        ano: ano || '21/22',
        numero: numero || null,
      },
      include: {
        productType: true,
      },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(updatedProduct),
    };
  } catch (error) {
    console.error('Error updating product:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to update product', details: error.message }),
    };
  }
};
