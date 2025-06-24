const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('deletepack called', { method: event.httpMethod, path: event.path });
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: 'Method Not Allowed',
    };
  }

  try {
    const packId = parseInt(event.path.split('/').pop(), 10);
    // Delete all items first (if not set to cascade in schema)
    await prisma.packItem.deleteMany({ where: { pack_id: packId } });
    await prisma.pack.delete({ where: { id: packId } });
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Pack deleted successfully' }),
    };
  } catch (error) {
    console.error('Error in deletepack:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to delete pack', details: error.message, stack: error.stack }),
    };
  }
}; 