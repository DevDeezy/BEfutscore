const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('deleteShirtType called', { method: event.httpMethod, path: event.path });
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }
  try {
    const id = parseInt(event.path.split('/').pop(), 10);
    await prisma.shirtType.delete({ where: { id } });
    console.log('Deleted shirt type:', id);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ message: 'Deleted' }) };
  } catch (error) {
    console.error('Error in deleteShirtType:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to delete shirt type', details: error.message, stack: error.stack }) };
  }
}; 