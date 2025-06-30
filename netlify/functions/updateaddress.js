const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const { id, userId, nome, telemovel, morada, cidade, distrito, codigoPostal, pais } = JSON.parse(event.body || '{}');
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
    const updated = await prisma.address.update({
      where: { id: Number(id) },
      data: { nome, telemovel, morada, cidade, distrito, codigoPostal, pais },
    });
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(updated),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 