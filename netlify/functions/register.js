const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { email, password } = JSON.parse(event.body || '{}');
  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    return { statusCode: 400, body: JSON.stringify({ message: 'User already exists' }) };
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword }
  });
  return {
    statusCode: 201,
    body: JSON.stringify({ id: user.id, email: user.email, role: user.role })
  };
};