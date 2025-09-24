const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Extract patch ID from the URL path
    const patchId = event.path.split('/').pop();
    
    if (!patchId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Patch ID is required' }),
      };
    }

    // Verify JWT token
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Forbidden - Admin access required' }),
      };
    }

    // Parse request body
    const { name, image, price, units } = JSON.parse(event.body);

    // Validate required fields
    if (!name || !image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Name and image are required' }),
      };
    }

    // Update the patch
    const updatedPatch = await prisma.patch.update({
      where: { id: parseInt(patchId) },
      data: {
        name,
        image,
        price: price || 0,
        units: typeof units === 'number' && units > 0 ? Math.floor(units) : 1,
        updated_at: new Date(),
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedPatch),
    };

  } catch (error) {
    console.error('Error updating patch:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    if (error.code === 'P2025') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Patch not found' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  } finally {
    await prisma.$disconnect();
  }
}; 