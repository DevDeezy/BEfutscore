const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a 6-digit random code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { email, username } = JSON.parse(event.body || '{}');
    
    // User can provide either email (userEmail field) or username (email field in db)
    if (!email && !username) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Email ou nome de utilizador é obrigatório' }),
      };
    }

    // Find user by userEmail or username (email field)
    let user;
    if (email) {
      user = await prisma.user.findFirst({
        where: { userEmail: email },
      });
    }
    
    if (!user && username) {
      user = await prisma.user.findFirst({
        where: { email: username },
      });
    }

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          success: true, 
          message: 'Se o email/utilizador existir, receberá um código de recuperação.' 
        }),
      };
    }

    // Check if user has an email address to send the code to
    const recipientEmail = user.userEmail;
    if (!recipientEmail) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Esta conta não tem email associado. Contacte o suporte.' 
        }),
      };
    }

    // Generate reset code and expiry (15 minutes from now)
    const resetCode = generateCode();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // Save code to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetCodeExpiry,
      },
    });

    // Send email with the code
    const { error: emailError } = await resend.emails.send({
      from: 'Futscore <noreply@futscore.pt>',
      to: [recipientEmail],
      subject: 'Código de Recuperação de Palavra-passe - Futscore',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Palavra-passe</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Futscore</h1>
              </div>
              <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #1a1a2e; margin-top: 0; font-size: 22px;">Recuperação de Palavra-passe</h2>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                  Olá,
                </p>
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                  Recebemos um pedido para recuperar a sua palavra-passe. Use o código abaixo para confirmar a sua identidade:
                </p>
                <div style="background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%); padding: 25px; margin: 30px 0; border-radius: 12px; text-align: center;">
                  <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.7); font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">O seu código</p>
                  <p style="margin: 0; color: #00e676; font-size: 42px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${resetCode}</p>
                </div>
                <p style="color: #888888; font-size: 14px; line-height: 1.6;">
                  ⏱️ Este código é válido por <strong>15 minutos</strong>.
                </p>
                <p style="color: #888888; font-size: 14px; line-height: 1.6;">
                  Se não solicitou esta recuperação, pode ignorar este email.
                </p>
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
      `,
      text: `Código de recuperação de palavra-passe Futscore: ${resetCode}. Este código é válido por 15 minutos.`,
    });

    if (emailError) {
      console.error('Error sending reset email:', emailError);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Erro ao enviar email. Tente novamente.' }),
      };
    }

    // Return success with masked email for user feedback
    const maskedEmail = recipientEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: true, 
        message: `Código enviado para ${maskedEmail}`,
        email: maskedEmail,
      }),
    };
  } catch (err) {
    console.error('Error in requestPasswordReset:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
