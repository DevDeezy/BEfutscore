const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
    const { email, username, code } = JSON.parse(event.body || '{}');
    
    if (!code) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Código é obrigatório' }),
      };
    }

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
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Código inválido ou expirado' }),
      };
    }

    // Check if code matches and is not expired
    if (user.resetCode !== code) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Código inválido' }),
      };
    }

    if (!user.resetCodeExpiry || new Date() > new Date(user.resetCodeExpiry)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Código expirado. Solicite um novo código.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: true, 
        message: 'Código verificado com sucesso',
        userId: user.id,
      }),
    };
  } catch (err) {
    console.error('Error in verifyResetCode:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
