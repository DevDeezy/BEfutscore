const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  // CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const items = Array.isArray(body.items) ? body.items : (body.itemId ? [{ id: body.itemId, cost_price: body.cost_price }] : []);

    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Provide items array or itemId/cost_price' }),
      };
    }

    // Validate payload
    for (const it of items) {
      if (!it || typeof it.id === 'undefined' || typeof it.cost_price !== 'number') {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Each item must have id and numeric cost_price' }),
        };
      }
    }

    // Update all provided order items
    const updates = [];
    for (const it of items) {
      updates.push(
        prisma.orderItem.update({
          where: { id: Number(it.id) },
          data: { cost_price: Number(it.cost_price) },
        })
      );
    }
    const updatedItems = await Promise.all(updates);

    // Optionally return the parent order (first item's order) with items
    const first = await prisma.orderItem.findUnique({ where: { id: Number(items[0].id) } });
    let order = null;
    if (first) {
      order = await prisma.order.findUnique({
        where: { id: Number(first.order_id) },
        include: { items: true, user: true },
      });
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ updatedItems, order }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};


