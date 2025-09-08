const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return { statusCode: 401, headers: corsHeaders, body: 'Unauthorized' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.role !== 'admin') {
      return { statusCode: 403, headers: corsHeaders, body: 'Forbidden' };
    }

    const idStr = event.path.split('/').pop();
    if (!idStr || isNaN(parseInt(idStr, 10))) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid product type ID' }) };
    }
    const id = parseInt(idStr, 10);

    const { name, base_type, parent_id } = JSON.parse(event.body || '{}');
    if (!name || !base_type) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Name and base_type are required' }) };
    }

    const updated = await prisma.productType.update({
      where: { id },
      data: {
        name,
        base_type,
        parent_id: parent_id === null || parent_id === '' ? null : Number(parent_id),
      },
    });

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(updated) };
  } catch (error) {
    console.error('Error updating product type:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to update product type' }) };
  }
};


