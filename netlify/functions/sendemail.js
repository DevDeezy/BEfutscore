const { Resend } = require('resend');

// Initialize Resend with API key
// Note: In production, use environment variable: process.env.RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY || 're_A6Ac8C55_C6rK5kfvrhZ3haVcXJTwEPyq');

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
    const { to, subject, orderNumber, html, text } = JSON.parse(event.body || '{}');
    
    if (!to) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Recipient email (to) is required' }),
      };
    }

    // Default email content for order payment notification
    const emailSubject = subject || `Encomenda #${orderNumber} - Pagamento Disponível`;
    const emailHtml = html || `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Atualização da Encomenda</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Futscore</h1>
            </div>
            <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1a1a2e; margin-top: 0; font-size: 22px;">A sua encomenda está pronta para pagamento!</h2>
              <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                Olá,
              </p>
              <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                A sua encomenda <strong style="color: #1a1a2e;">#${orderNumber}</strong> foi processada e está agora disponível para pagamento.
              </p>
              <div style="background-color: #f8f9fa; border-left: 4px solid #16213e; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #1a1a2e; font-weight: 600;">Número da Encomenda: #${orderNumber}</p>
              </div>
              <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                Por favor, aceda ao seu painel de utilizador para consultar os detalhes do pagamento e concluir a sua encomenda.
              </p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://futscore.netlify.app" style="display: inline-block; background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 16px;">Ver Encomenda</a>
              </div>
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 35px 0;">
              <p style="color: #888888; font-size: 14px; text-align: center; margin-bottom: 0;">
                Obrigado por escolher a Futscore!
              </p>
            </div>
            <p style="color: #888888; font-size: 12px; text-align: center; margin-top: 20px;">
              © 2026 Futscore. Todos os direitos reservados.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Futscore <onboarding@resend.dev>',
      to: [to],
      subject: emailSubject,
      html: emailHtml,
      text: text || `Encomenda #${orderNumber} - A sua encomenda está pronta para pagamento. Aceda ao seu painel de utilizador para consultar os detalhes.`,
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Failed to send email', details: error.message }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, message: 'Email sent successfully', id: data.id }),
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
