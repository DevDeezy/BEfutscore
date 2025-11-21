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
    const { id, name, name_user, name_admin, color, description } = body;

    if (!id || !color) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'id and color are required' }),
      };
    }

    // Build update data object
    const updateData = {
      color,
      description,
      updated_at: new Date()
    };

    // Add name fields if provided
    if (name !== undefined) updateData.name = name;
    if (name_user !== undefined) updateData.name_user = name_user;
    if (name_admin !== undefined) updateData.name_admin = name_admin;

    // Update order state
    const orderState = await prisma.orderState.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(orderState),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
