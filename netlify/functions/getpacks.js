const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('getpacks called', { method: event.httpMethod });
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: 'Method Not Allowed',
    };
  }

  try {
    const packs = await prisma.pack.findMany({
      include: { items: true },
    });
    console.log('Fetched packs:', packs);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(packs), // cost_price is included by default
    };
  } catch (error) {
    console.error('Error in getpacks:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to fetch packs', details: error.message, stack: error.stack }),
    };
  }
}; 