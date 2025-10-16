const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
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
    // Accept orderId from path or body
    let orderId;
    if (event.path && event.path.split('/').length > 0) {
      orderId = event.path.split('/').pop();
    }
    const body = JSON.parse(event.body || '{}');
    if (body.orderId) orderId = body.orderId;
    const { status } = body;
    if (!orderId || !status) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'orderId and status are required' }),
      };
    }
    // Update order status
    const order = await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status },
      include: { items: true, user: true, orderState: true },
    });

        // Create notification if status is changed to "em_pagamento"
    if (status === 'em_pagamento') {
      await prisma.notification.create({
        data: {
          userId: order.user_id,
          type: 'payment_reminder',
          title: 'Pagamento Pendente',
          message: `A sua encomenda #${order.id} está aguardando pagamento. Por favor, adicione a prova de pagamento para continuar.`,
          orderId: order.id.toString(),
        }
      });
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(order),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 