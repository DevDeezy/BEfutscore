const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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

  if (event.httpMethod !== 'PUT') {
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
    const userId = decoded.id;
    const { instagramName } = JSON.parse(event.body || '{}');
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { instagramName },
      select: { id: true, email: true, instagramName: true },
    });
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(updatedUser),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 