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
    let fetchTypesMs = 0;
    let countMs = 0;
    let findManyMs = 0;

    const { productTypeId } = event.queryStringParameters || {};
    const summary = (event.queryStringParameters?.summary === 'true');
    const page = parseInt(event.queryStringParameters?.page) || 1;
    const limit = parseInt(event.queryStringParameters?.limit) || 20;
    const skip = (page - 1) * limit;
    
    // If filtering by a type that may have children, collect all descendant ids
    let where = {};
    if (productTypeId !== undefined && productTypeId !== null && String(productTypeId).trim() !== '') {
      const id = parseInt(productTypeId, 10);
      if (!isNaN(id)) {
      // fetch all types to compute descendants quickly (dataset expected to be small/moderate)
      const tFetchTypes = startTimer();
      const allTypes = await prisma.productType.findMany();
      fetchTypesMs = tFetchTypes();
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
    }

    // Support server-side search
    const q = (event.queryStringParameters?.q || '').trim();
    if (q) {
      const value = q.toLowerCase();
      // Basic case-insensitive contains filters
      where = {
        AND: [
          where,
          {
            OR: [
              { name: { contains: value, mode: 'insensitive' } },
              { description: { contains: value, mode: 'insensitive' } },
            ],
          },
        ],
      };
    }

    // Get total count only on first page to avoid heavy queries
    let totalCount = null;
    let totalPages = null;
    if (page === 1) {
      const tCount = startTimer();
      totalCount = await prisma.product.count({ where });
      countMs = tCount();
      totalPages = Math.ceil(totalCount / limit);
    }

    const tFindMany = startTimer();
    const selectFields = {
      id: true,
      name: true,
      description: true,
      price: true,
      available_sizes: true,
      available_shirt_type_ids: true,
      ano: true,
      shirt_type_id: true,
      shirtType: { select: { id: true, name: true } },
      productType: { select: { id: true, name: true, base_type: true } },
    };
    // Always include image_url; this is expected to be a lightweight URL string, not base64
    selectFields.image_url = true;

    const products = await prisma.product.findMany({
      where,
      select: selectFields,
      skip,
      take: limit,
      orderBy: { id: 'desc' }
    });
    findManyMs = tFindMany();

    const totalMs = stopAll();
    const otherMs = totalMs - (fetchTypesMs + countMs + findManyMs);
    console.log('[getProducts] timing', {
      totalMs,
      fetchTypesMs,
      countMs,
      findManyMs,
      otherMs,
      page,
      limit,
      productTypeId: productTypeId || null,
      q,
      returned: Array.isArray(products) ? products.length : 0,
      totalCount
    });

    const newestId = products.length > 0 ? products[0].id : null;
    const cacheToken = newestId != null ? `${newestId}:${totalCount || 'unk'}` : Date.now();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        products,
        pagination: {
          currentPage: page,
          totalPages: totalPages != null ? totalPages : undefined,
          totalCount,
          limit,
          hasNextPage: totalPages != null ? page < totalPages : products.length === limit,
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