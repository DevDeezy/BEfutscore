const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const buildCorsHeaders = (event) => {
  const origin = event?.headers?.origin || event?.headers?.Origin || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
};

exports.handler = async (event) => {
  console.log('createProduct called', {
    method: event.httpMethod,
    bodyLength: event.body ? event.body.length : 0,
    headers: {
      contentType: event.headers?.['content-type'] || event.headers?.['Content-Type'] || null,
      authorizationPresent: !!(event.headers?.authorization || event.headers?.Authorization),
      origin: event.headers?.origin || event.headers?.Origin || null,
    },
  });
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: buildCorsHeaders(event), body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: buildCorsHeaders(event), body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    console.log('createProduct parsed body (summary)', {
      name: body?.name,
      price: body?.price,
      product_type_id: body?.product_type_id,
      image_urlPresent: !!body?.image_url,
      available_sizesType: Array.isArray(body?.available_sizes) ? 'array' : typeof body?.available_sizes,
      available_shirt_type_idsCount: Array.isArray(body?.available_shirt_type_ids) ? body.available_shirt_type_ids.length : 0,
      sexo: body?.sexo,
      ano: body?.ano,
      shirt_type_id: body?.shirt_type_id || null,
    });

    const { name, description, price, image_url, available_sizes, available_shirt_type_ids, product_type_id, sexo, ano, numero, cost_price, shirt_type_id } = body;

    if (!name || typeof price !== 'number' || !image_url || !available_sizes) {
      console.error('createProduct validation failed', {
        namePresent: !!name,
        priceType: typeof price,
        image_urlPresent: !!image_url,
        available_sizesPresent: !!available_sizes,
        product_type_idPresent: !!product_type_id,
      });
      return { statusCode: 400, headers: buildCorsHeaders(event), body: 'Missing required fields' };
    }

    console.log('createProduct prisma input (summary)', {
      name,
      price,
      product_type_id: Number(product_type_id),
      shirt_type_id: shirt_type_id ? Number(shirt_type_id) : null,
      available_sizesType: Array.isArray(available_sizes) ? 'array' : typeof available_sizes,
      available_shirt_type_idsCount: Array.isArray(available_shirt_type_ids) ? available_shirt_type_ids.length : 0,
      cost_priceType: typeof cost_price,
      sexo,
      ano,
    });

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        cost_price: typeof cost_price === 'number' ? cost_price : null,
        image_url,
        available_sizes,
        available_shirt_type_ids: Array.isArray(available_shirt_type_ids) ? available_shirt_type_ids.map(Number) : [],
        productType: (Number.isFinite(Number(product_type_id)) && Number(product_type_id) > 0)
          ? { connect: { id: Number(product_type_id) } }
          : undefined,
        shirtType: shirt_type_id ? { connect: { id: Number(shirt_type_id) } } : undefined,
        sexo: sexo || 'Neutro',
        ano: ano || '21/22',
        numero: numero || null,
      },
      include: { productType: true },
    });

    console.log('createProduct created', { id: product?.id, name: product?.name });

    return {
      statusCode: 201,
      headers: buildCorsHeaders(event),
      body: JSON.stringify(product),
    };
  } catch (error) {
    console.error('Error creating product:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
    });
    return {
      statusCode: 500,
      headers: buildCorsHeaders(event),
      body: JSON.stringify({ error: 'Failed to create product' }),
    };
  }
}; 