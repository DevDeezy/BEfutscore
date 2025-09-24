const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startTimer, withCacheControl } = require('./utils');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    
    const where = { active: true };
    
    // Get total count for pagination (first page only)
    let totalCount = null;
    if (page === 1) {
      totalCount = await prisma.patch.count({ where });
    }
    
    const patches = await prisma.patch.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      select: { id: true, name: true, image: true, price: true, units: true, active: true },
      skip,
      take: limit,
    });

    return {
      statusCode: 200,
      headers: withCacheControl(corsHeaders, 300, 120),
      body: JSON.stringify({
        patches,
        pagination: {
          currentPage: page,
          totalPages: totalCount != null ? Math.ceil(totalCount / limit) : undefined,
          totalCount,
          limit,
          hasNextPage: totalCount != null ? page < Math.ceil(totalCount / limit) : patches.length === limit,
          hasPreviousPage: page > 1
        }
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 