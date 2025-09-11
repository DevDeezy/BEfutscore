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

    const body = JSON.parse(event.body || '{}');

    // Build a partial update object. Only include fields that are provided.
    const data = {};
    if (typeof body.name === 'string') data.name = body.name;
    if ('description' in body) data.description = body.description ?? null;
    if (typeof body.price === 'number') data.price = body.price;
    if (typeof body.cost_price === 'number') data.cost_price = body.cost_price;
    if (typeof body.image_url === 'string' && body.image_url.length) data.image_url = body.image_url;
    if (Array.isArray(body.available_sizes)) {
      data.available_sizes = body.available_sizes;
    } else if (typeof body.available_sizes === 'string' && body.available_sizes.trim().length) {
      data.available_sizes = body.available_sizes.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (body.product_type_id != null && !isNaN(parseInt(body.product_type_id))) {
      data.productType = { connect: { id: parseInt(body.product_type_id) } };
    }
    if ('shirt_type_id' in body) {
      const parsed = parseInt(body.shirt_type_id);
      if (body.shirt_type_id == null || body.shirt_type_id === '' || isNaN(parsed)) {
        data.shirtType = { disconnect: true };
      } else {
        data.shirtType = { connect: { id: parsed } };
      }
    }
    if (typeof body.sexo === 'string') data.sexo = body.sexo;
    if (typeof body.ano === 'string') data.ano = body.ano;
    if ('numero' in body) data.numero = body.numero || null;

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
      data,
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
