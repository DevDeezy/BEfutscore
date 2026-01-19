const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Method Not Allowed',
    };
  }
  try {
    const data = JSON.parse(event.body);

    // Validate input
    if (!data.email || !data.password) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Email and password are required.' }),
      };
    }

    // Use email as userEmail if userEmail is not provided
    const userEmail = data.userEmail || data.email;

    // Check if user already exists by login email
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return {
        statusCode: 409,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'User already exists.' }),
      };
    }

    // Check if userEmail is already in use
    const existingUserEmail = await prisma.user.findUnique({ where: { userEmail: userEmail } });
    if (existingUserEmail) {
      return {
        statusCode: 409,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'User email is already in use.' }),
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role || 'user',
        instagramName: data.instagramName || null,
        userEmail: userEmail,
      },
      select: {
        id: true,
        email: true,
        role: true,
        created_at: true,
        instagramName: true,
        userEmail: true,
      }
    });
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(user),
    };
  } catch (err) {
    console.error('Create user error:', err);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 