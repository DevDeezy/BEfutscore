const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const productTypeId = parseInt(event.path.split('/').pop(), 10);
    if (isNaN(productTypeId)) {
      return { statusCode: 400, body: 'Invalid product type ID' };
    }

    const products = await prisma.product.findMany({
      where: { product_type_id: productTypeId },
    });

    if (products.length > 0) {
      return {
        statusCode: 400,
        body: 'Cannot delete product type with associated products.',
      };
    }

    await prisma.productType.delete({
      where: { id: productTypeId },
    });

    return {
      statusCode: 204,
      headers: corsHeaders,
    };
  } catch (error) {
    console.error('Error deleting product type:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to delete product type' }),
    };
  }
}; 