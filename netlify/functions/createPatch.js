const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: 'Method Not Allowed',
    };
  }

  try {
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return { statusCode: 401, headers: corsHeaders, body: 'Unauthorized' };
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, headers: corsHeaders, body: 'Forbidden' };
    }

    const { name, image, price, units } = JSON.parse(event.body || '{}');
    
    if (!name || !image) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Name and image are required' }),
      };
    }

    const patch = await prisma.patch.create({
      data: {
        name,
        image,
        price: price || 0,
        units: typeof units === 'number' && units > 0 ? Math.floor(units) : 1,
        active: true,
      },
    });

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(patch),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 