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
        body: JSON.stringify({ error: 'userId is required' }),
      };
    }

    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get total count only on first page
    let totalCount = null;
    if (page === 1) {
      totalCount = await prisma.notification.count({
        where: { userId: parseInt(userId, 10) }
      });
    }
    
    const notifications = await prisma.notification.findMany({
      where: { userId: parseInt(userId, 10) },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit
    });

    return {
      statusCode: 200,
      headers: withCacheControl({ 'Access-Control-Allow-Origin': '*' }, 60, 30),
      body: JSON.stringify({
        notifications,
        pagination: {
          currentPage: page,
          totalPages: totalCount != null ? Math.ceil(totalCount / limit) : undefined,
          totalCount,
          limit,
          hasNextPage: totalCount != null ? page < Math.ceil(totalCount / limit) : notifications.length === limit,
          hasPreviousPage: page > 1
        }
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 