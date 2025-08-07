const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

  if (event.httpMethod !== 'DELETE') {
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

    const patchId = event.path.split('/').pop();
    
    if (!patchId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Patch ID is required' }),
      };
    }

    await prisma.patch.delete({
      where: { id: parseInt(patchId) },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Patch deleted successfully' }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 