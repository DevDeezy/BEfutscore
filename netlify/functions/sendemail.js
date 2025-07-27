const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const { templateParams } = JSON.parse(event.body || '{}');
    
    if (!templateParams) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'templateParams is required' }),
      };
    }

    // EmailJS configuration
    const serviceId = 'service_pvd829d';
    const templateId = 'template_omc5g2b';
    const publicKey = 'sYfnZeIDOxAl4y-r9';

    // Send email using EmailJS
    const response = await axios.post(
      `https://api.emailjs.com/api/v1.0/email/send`,
      {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, message: 'Email sent successfully' }),
    };
  } catch (err) {
    console.error('Error sending email:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to send email', details: err.message }),
    };
  }
}; 