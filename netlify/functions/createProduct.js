const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const { name, description, price, image_url, available_sizes, product_type_id, sexo, ano, numero } = JSON.parse(event.body);

    if (!name || !price || !image_url || !available_sizes || !product_type_id) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        image_url,
        available_sizes,
        product_type_id,
        sexo: sexo || 'Neutro',
        ano: ano || '21/22',
        numero: numero || null,
      },
    });

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(product),
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to create product' }),
    };
  }
}; 