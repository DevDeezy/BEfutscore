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
    const { name, description, price, image_url, available_sizes, product_type_id, sexo, ano, numero, cost_price, shirt_type_id } = JSON.parse(event.body);

    if (!name || !price || !image_url || !available_sizes || !product_type_id) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        cost_price: typeof cost_price === 'number' ? cost_price : null,
        image_url,
        available_sizes,
        product_type_id,
        shirt_type_id: typeof shirt_type_id === 'number' ? shirt_type_id : null,
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