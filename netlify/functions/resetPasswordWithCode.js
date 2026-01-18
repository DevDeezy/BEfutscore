const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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
    const { email, username, code, newPassword } = JSON.parse(event.body || '{}');
    
    if (!code || !newPassword) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Código e nova palavra-passe são obrigatórios' }),
      };
    }

    if (!email && !username) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Email ou nome de utilizador é obrigatório' }),
      };
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'A palavra-passe deve ter pelo menos 6 caracteres' }),
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

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiry: null,
        password_reset_required: false,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: true, 
        message: 'Palavra-passe alterada com sucesso! Pode agora fazer login.',
      }),
    };
  } catch (err) {
    console.error('Error in resetPasswordWithCode:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
