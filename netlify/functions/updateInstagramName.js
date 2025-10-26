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
    const pathUserId = event.path && event.path.split('/').pop();
    const targetUserId = pathUserId && !isNaN(parseInt(pathUserId, 10)) ? parseInt(pathUserId, 10) : decoded.id;
    const { instagramName, instagramNames } = JSON.parse(event.body || '{}');
    
    // Handle both single instagramName (backward compatibility) and multiple instagramNames
    let updateData = {};
    if (instagramNames) {
      updateData.instagramNames = instagramNames;
    } else if (instagramName) {
      updateData.instagramName = instagramName;
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: { id: true, email: true, instagramName: true, instagramNames: true },
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