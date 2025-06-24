const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('getShirtTypes called', { method: event.httpMethod });
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }
  try {
    const types = await prisma.shirtType.findMany();
    console.log('Fetched shirt types:', types);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(types) };
  } catch (error) {
    console.error('Error in getShirtTypes:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to fetch shirt types', details: error.message, stack: error.stack }) };
  }
}; 