const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  // CORS (add if needed)
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
    const { userId, items, address } = JSON.parse(event.body || '{}');
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'pending',
        address_nome: address.nome,
        address_morada: address.morada,
        address_cidade: address.cidade,
        address_distrito: address.distrito,
        address_pais: address.pais,
        address_codigoPostal: address.codigoPostal,
        address_telemovel: address.telemovel,
        items: {
          create: items.map((item) => ({
            productType: item.productType,
            size: item.size,
            playerName: item.playerName,
          }))
        }
      }
    });
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ id: order.id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};