const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  // CORS
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
    const body = JSON.parse(event.body || '{}');
    const {
      orderId,
      address_nome,
      address_morada,
      address_cidade,
      address_distrito,
      address_pais,
      address_codigo_postal,
      address_telemovel,
      clientInstagram,
      paymentAccountInfo,
    } = body;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'orderId is required' }),
      };
    }

    // Ensure order exists
    const existing = await prisma.order.findUnique({ where: { id: Number(orderId) } });
    if (!existing) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Order not found' }),
      };
    }

    // Build partial update object with only provided fields
    const data = {};
    if (typeof address_nome === 'string') data.address_nome = address_nome;
    if (typeof address_morada === 'string') data.address_morada = address_morada;
    if (typeof address_cidade === 'string') data.address_cidade = address_cidade;
    if (typeof address_distrito === 'string') data.address_distrito = address_distrito;
    if (typeof address_pais === 'string') data.address_pais = address_pais;
    if (typeof address_codigo_postal === 'string') data.address_codigo_postal = address_codigo_postal;
    if (typeof address_telemovel === 'string') data.address_telemovel = address_telemovel;
    if (clientInstagram !== undefined) data.clientInstagram = clientInstagram && String(clientInstagram).trim() !== '' ? String(clientInstagram).trim() : null;
    if (paymentAccountInfo !== undefined) data.paymentAccountInfo = paymentAccountInfo || null;

    if (Object.keys(data).length === 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No updatable fields provided' }),
      };
    }

    const updated = await prisma.order.update({
      where: { id: Number(orderId) },
      data,
      include: { items: true, user: true },
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(updated),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};


