const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const idParam = event.queryStringParameters?.id;
    const id = parseInt(idParam, 10);
    if (!id || isNaN(id)) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid id' }) };
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        cost_price: true,
        image_url: true,
        available_sizes: true,
        product_type_id: true,
        shirt_type_id: true,
        sexo: true,
        ano: true,
        numero: true,
        productType: { select: { id: true, name: true, base_type: true } },
      },
    });

    if (!product) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Product not found' }) };
    }

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(product) };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to fetch product' }) };
  }
};


