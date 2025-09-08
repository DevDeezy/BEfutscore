const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const { withCacheControl } = require('./utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    // Check authentication
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId: Number(userId) },
      orderBy: [
        { isDefault: 'desc' }, // Default payment methods first
        { created_at: 'desc' }, // Then by creation date
      ],
    });

    return {
      statusCode: 200,
      headers: withCacheControl({ 'Access-Control-Allow-Origin': '*' }, 60, 30),
      body: JSON.stringify(paymentMethods),
    };
  } catch (err) {
    console.error('Error fetching payment methods:', err);
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
