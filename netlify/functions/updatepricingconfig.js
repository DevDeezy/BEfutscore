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
    const { key, price, cost_price } = JSON.parse(event.body || '{}');
    
    if (!key || typeof price !== 'number' || typeof cost_price !== 'number') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'key, price, and cost_price are required' }),
      };
    }

    const config = await prisma.pricingConfig.upsert({
      where: { key },
      update: {
        price,
        cost_price,
        updated_at: new Date(),
      },
      create: {
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        price,
        cost_price,
        description: `Configuration for ${key}`,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(config),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 