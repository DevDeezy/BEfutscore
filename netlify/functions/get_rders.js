const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const userId = event.queryStringParameters && event.queryStringParameters.userId;
  if (!userId) {
    return { statusCode: 400, body: 'Missing userId' };
  }
  const orders = await prisma.order.findMany({
    where: { userId: parseInt(userId) },
    include: { items: true }
  });
  return {
    statusCode: 200,
    body: JSON.stringify(orders)
  };
};