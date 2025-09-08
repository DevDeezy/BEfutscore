const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startTimer, withCacheControl } = require('./utils');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('getShirtTypes called', { method: event.httpMethod });
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }
  try {
    const stopAll = startTimer();
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get total count only on first page
    let totalCount = null;
    if (page === 1) {
      totalCount = await prisma.shirtType.count();
    }
    
    const types = await prisma.shirtType.findMany({
      skip,
      take: limit,
      orderBy: { id: 'desc' }
    });
    console.log('Fetched shirt types:', types.length, 'totalMs:', stopAll());
    return { 
      statusCode: 200, 
      headers: withCacheControl(corsHeaders, 300, 120), 
      body: JSON.stringify({
        shirtTypes: types,
        pagination: {
          currentPage: page,
          totalPages: totalCount != null ? Math.ceil(totalCount / limit) : undefined,
          totalCount,
          limit,
          hasNextPage: totalCount != null ? page < Math.ceil(totalCount / limit) : types.length === limit,
          hasPreviousPage: page > 1
        }
      }) 
    };
  } catch (error) {
    console.error('Error in getShirtTypes:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to fetch shirt types', details: error.message, stack: error.stack }) };
  }
}; 