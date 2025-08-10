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
    const { productTypeId } = event.queryStringParameters || {};
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 20;
    const skip = (page - 1) * limit;
    
    // If filtering by a type that may have children, collect all descendant ids
    let where = {};
    if (productTypeId) {
      const id = parseInt(productTypeId, 10);
      // fetch all types to compute descendants quickly (dataset expected to be small/moderate)
      const allTypes = await prisma.productType.findMany();
      const byParent = new Map();
      for (const t of allTypes) {
        if (!byParent.has(t.parent_id || 0)) byParent.set(t.parent_id || 0, []);
        byParent.get(t.parent_id || 0).push(t);
      }
      const stack = [id];
      const ids = new Set([id]);
      while (stack.length) {
        const cur = stack.pop();
        const children = byParent.get(cur) || [];
        for (const c of children) {
          if (!ids.has(c.id)) {
            ids.add(c.id);
            stack.push(c.id);
          }
        }
      }
      where = { product_type_id: { in: Array.from(ids) } };
    }

    // Get total count for pagination
    const totalCount = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: {
        productType: true,
      },
      skip,
      take: limit,
      orderBy: { id: 'desc' }
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        products,
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
    console.error('Error fetching products:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to fetch products' }),
    };
  }
}; 