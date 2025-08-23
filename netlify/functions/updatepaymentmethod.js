const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

exports.handler = async (event) => {
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
    // Check authentication
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get payment method ID from URL path
    const paymentMethodId = event.path.split('/').pop();
    if (!paymentMethodId || isNaN(parseInt(paymentMethodId))) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid payment method ID' }),
      };
    }

    const { name, method, accountInfo, isDefault } = JSON.parse(event.body || '{}');

    // Verify that the payment method belongs to the authenticated user
    const existingPaymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: parseInt(paymentMethodId) },
    });

    if (!existingPaymentMethod || existingPaymentMethod.userId !== Number(userId)) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Payment method not found' }),
      };
    }

    // If this is set as default, update all other payment methods to not be default
    if (isDefault && !existingPaymentMethod.isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { 
          userId: Number(userId),
          id: { not: parseInt(paymentMethodId) }
        },
        data: { isDefault: false },
      });
    }

    const updatedPaymentMethod = await prisma.paymentMethod.update({
      where: { id: parseInt(paymentMethodId) },
      data: {
        name: name || existingPaymentMethod.name,
        method: method || existingPaymentMethod.method,
        accountInfo: accountInfo || existingPaymentMethod.accountInfo,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : existingPaymentMethod.isDefault,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(updatedPaymentMethod),
    };
  } catch (err) {
    console.error('Error updating payment method:', err);
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
