const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startTimer } = require('./utils');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const stopAll = startTimer();
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 1000; // load many for tree
    const skip = (page - 1) * limit;

    // Optional: return as a tree if requested
    const asTree = (event.queryStringParameters?.asTree || 'true') === 'true';

    let totalCount = null;
    if (page === 1) {
      totalCount = await prisma.productType.count();
    }

    const productTypes = await prisma.productType.findMany({
      skip,
      take: limit,
      orderBy: { id: 'asc' },
      select: { id: true, name: true, base_type: true, parent_id: true },
    });

    let tree = null;
    if (asTree) {
      // Build tree in memory (no in-process cache to avoid stale data)
      const byId = new Map(productTypes.map(pt => [pt.id, { ...pt, children: [] }]));
      const roots = [];
      for (const pt of productTypes) {
        const node = byId.get(pt.id);
        if (pt.parent_id && byId.has(pt.parent_id)) {
          byId.get(pt.parent_id).children.push(node);
        } else {
          roots.push(node);
        }
      }
      tree = roots;
    }

    const totalMs = stopAll();
    console.log('[getProductTypes] timing', { totalMs, count: totalCount, returned: productTypes.length });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        productTypes,
        tree,
        pagination: {
          currentPage: page,
          totalPages: totalCount != null ? Math.ceil(totalCount / limit) : undefined,
          totalCount,
          limit,
          hasNextPage: totalCount != null ? page < Math.ceil(totalCount / limit) : productTypes.length === limit,
          hasPreviousPage: page > 1
        }
      }),
    };
  } catch (error) {
    console.error('Error fetching product types:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to fetch product types' }),
    };
  }
}; 