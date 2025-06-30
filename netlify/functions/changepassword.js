const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const { oldPassword, newPassword } = JSON.parse(event.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { statusCode: 404, body: 'User not found' };
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return { statusCode: 400, body: 'Invalid old password' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        password_reset_required: false,
      },
    });

    const newToken = jwt.sign(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        created_at: updatedUser.created_at,
        password_reset_required: updatedUser.password_reset_required,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Password updated successfully',
        token: newToken,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          created_at: updatedUser.created_at,
          password_reset_required: updatedUser.password_reset_required,
        },
      }),
    };
  } catch (error) {
    console.error('Error in changePassword:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return { statusCode: 401, body: 'Invalid token' };
    }
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to change password', details: error.message }),
    };
  }
}; 