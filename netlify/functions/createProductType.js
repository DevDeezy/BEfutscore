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
    const { name } = JSON.parse(event.body);
    if (!name) {
      return { statusCode: 400, body: 'Name is required' };
    }

    const productType = await prisma.productType.create({
      data: { name },
    });

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(productType),
    };
  } catch (error) {
    console.error('Error creating product type:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to create product type' }),
    };
  }
}; 