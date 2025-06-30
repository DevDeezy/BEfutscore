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
    const { productTypeId } = event.queryStringParameters || {};
    const where = productTypeId ? { product_type_id: parseInt(productTypeId, 10) } : {};

    const products = await prisma.product.findMany({
      where,
      include: {
        productType: true,
      },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(products),
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to fetch products' }),
    };
  }
}; 