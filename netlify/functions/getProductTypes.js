const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 1000; // load many for tree
    const skip = (page - 1) * limit;

    // Optional: return as a tree if requested
    const asTree = (event.queryStringParameters?.asTree || 'true') === 'true';

    const totalCount = await prisma.productType.count();
    const productTypes = await prisma.productType.findMany({
      skip,
      take: limit,
      orderBy: { id: 'asc' },
      include: { children: true },
    });

    let tree = null;
    if (asTree) {
      // Build tree in memory
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

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        productTypes,
        tree,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
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