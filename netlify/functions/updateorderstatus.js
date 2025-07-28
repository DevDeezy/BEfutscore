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
      include: { items: true, user: true },
    });

    // Create notification and send email if status is changed to "Em Pagamento"
    if (status === 'Em Pagamento') {
      await prisma.notification.create({
        data: {
          userId: order.user_id,
          type: 'payment_reminder',
          title: 'Pagamento Pendente',
          message: `A sua encomenda #${order.id} está aguardando pagamento. Por favor, adicione a prova de pagamento para continuar.`,
          orderId: order.id.toString(),
        }
      });

      // Send email notification
      try {
        const user = await prisma.user.findUnique({
          where: { id: order.user_id }
        });

        if (user && (user.email || user.userEmail)) {
          const emailToUse = user.userEmail || user.email;
          
          console.log(`Attempting to send email to: ${emailToUse} for order: ${order.id}`);
          
          // Prepare email template parameters
          const templateParams = {
            order_id: order.id.toString(),
            email: emailToUse,
            total_price: order.total_price ? `€${order.total_price.toFixed(2)}` : '€0.00',
            // Add order items for the email template
            orders: order.items.map(item => ({
              name: item.product_type === 'tshirt' ? 'Camisola Personalizada' : 'Sapatilhas',
              units: item.quantity || 1,
              price: item.price ? `€${item.price.toFixed(2)}` : '€0.00'
            })),
            cost: {
              shipping: '€0.00', // Assuming no shipping cost for now
              total: order.total_price ? `€${order.total_price.toFixed(2)}` : '€0.00'
            }
          };

          console.log('Email template parameters:', JSON.stringify(templateParams, null, 2));

          // Send email using EmailJS
          const emailResponse = await axios.post(
            `https://api.emailjs.com/api/v1.0/email/send`,
            {
              service_id: 'service_pvd829d',
              template_id: 'template_omc5g2b',
              user_id: 'sYfnZeIDOxAl4y-r9',
              template_params: templateParams,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          console.log('Email sent successfully:', emailResponse.data);
        } else {
          console.log('No user email found for order:', order.id);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the entire request if email fails
      }
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