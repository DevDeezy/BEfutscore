const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startTimer, withCacheControl } = require('./utils');

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
    const stopAll = startTimer();
    const userId = event.queryStringParameters.userId;
    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing userId' }),
      };
    }
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 20;
    const skip = (page - 1) * limit;
    
    const where = { userId: parseInt(userId, 10) };
    
    // Get total count only on first page
    let totalCount = null;
    if (page === 1) {
      totalCount = await prisma.address.count({ where });
    }
    
    const addresses = await prisma.address.findMany({
      where,
      orderBy: { id: 'desc' },
      skip,
      take: limit,
    });
    return {
      statusCode: 200,
      headers: withCacheControl({ 'Access-Control-Allow-Origin': '*' }, 120, 60),
      body: JSON.stringify({
        addresses,
        pagination: {
          currentPage: page,
          totalPages: totalCount != null ? Math.ceil(totalCount / limit) : undefined,
          totalCount,
          limit,
          hasNextPage: totalCount != null ? page < Math.ceil(totalCount / limit) : addresses.length === limit,
          hasPreviousPage: page > 1
        }
      }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 