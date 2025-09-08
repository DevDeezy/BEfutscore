const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startTimer, withCacheControl } = require('./utils');

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Method Not Allowed',
    };
  }
  try {
    const stopAll = startTimer();
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get total count only on first page
    let totalCount = null;
    if (page === 1) {
      totalCount = await prisma.user.count();
    }
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        instagramName: true,
      },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' }
    });
    
    const totalPages = totalCount != null ? Math.ceil(totalCount / limit) : undefined;
    
    return {
      statusCode: 200,
      headers: withCacheControl({ 'Access-Control-Allow-Origin': '*' }, 60, 30),
      body: JSON.stringify({
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: totalPages != null ? page < totalPages : users.length === limit,
          hasPreviousPage: page > 1
        }
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Database error', details: err.message }),
    };
  }
}; 