const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('updateShirtType called', { method: event.httpMethod, body: event.body });
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }
  try {
    const id = parseInt(event.path.split('/').pop(), 10);
    const { name, price } = JSON.parse(event.body);
    if (!name || typeof price !== 'number') {
      console.error('Invalid shirt type data:', { name, price });
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid data' }) };
    }
    const shirtType = await prisma.shirtType.update({
      where: { id },
      data: { name, price },
    });
    console.log('Updated shirt type:', shirtType);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(shirtType) };
  } catch (error) {
    console.error('Error in updateShirtType:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to update shirt type', details: error.message, stack: error.stack }) };
  }
}; 