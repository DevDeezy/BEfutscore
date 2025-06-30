const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const { id, userId } = JSON.parse(event.body || '{}');
    if (!id || !userId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing id or userId' }),
      };
    }
    // Check ownership
    const address = await prisma.address.findUnique({ where: { id: Number(id) } });
    if (!address || address.userId !== Number(userId)) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Address not found or not owned by user' }),
      };
    }
    await prisma.address.delete({ where: { id: Number(id) } });
    return {
      statusCode: 204,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: '',
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 