const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const { userId, nome, telemovel, morada, cidade, distrito, codigoPostal, pais } = JSON.parse(event.body || '{}');
    if (!userId || !nome || !telemovel || !morada || !cidade || !distrito || !codigoPostal) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }
    const address = await prisma.address.create({
      data: {
        userId: Number(userId),
        nome,
        telemovel,
        morada,
        cidade,
        distrito,
        codigoPostal,
        pais: pais || 'Portugal',
      },
    });
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(address),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 