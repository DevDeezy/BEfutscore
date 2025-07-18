const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('createShirtType called', { method: event.httpMethod, body: event.body });
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }
  try {
    const { name, price, cost_price } = JSON.parse(event.body);
    if (!name || typeof price !== 'number') {
      console.error('Invalid shirt type data:', { name, price });
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid data' }) };
    }
    const shirtType = await prisma.shirtType.create({ data: { name, price, cost_price: typeof cost_price === 'number' ? cost_price : null } });
    console.log('Created shirt type:', shirtType);
    return { statusCode: 201, headers: corsHeaders, body: JSON.stringify(shirtType) };
  } catch (error) {
    console.error('Error in createShirtType:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to create shirt type', details: error.message, stack: error.stack }) };
  }
}; 