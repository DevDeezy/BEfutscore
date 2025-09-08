const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startTimer, withCacheControl } = require('./utils');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('getpacks called', { method: event.httpMethod });
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
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
      totalCount = await prisma.pack.count();
    }
    
    const packs = await prisma.pack.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        created_at: true,
        items: true,
      },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' }
    });
    console.log('Fetched packs:', packs.length, 'totalMs:', stopAll());
    return {
      statusCode: 200,
      headers: withCacheControl(corsHeaders, 120, 60),
      body: JSON.stringify({
        packs,
        pagination: {
          currentPage: page,
          totalPages: totalCount != null ? Math.ceil(totalCount / limit) : undefined,
          totalCount,
          limit,
          hasNextPage: totalCount != null ? page < Math.ceil(totalCount / limit) : packs.length === limit,
          hasPreviousPage: page > 1
        }
      }),
    };
  } catch (error) {
    console.error('Error in getpacks:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to fetch packs', details: error.message, stack: error.stack }),
    };
  }
}; 