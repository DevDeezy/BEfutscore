const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { email, password, userEmail } = JSON.parse(event.body || '{}');
  
  // Validate userEmail is provided
  if (!userEmail) {
    return { statusCode: 400, body: JSON.stringify({ message: 'User email is required' }) };
  }
  
  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    return { statusCode: 400, body: JSON.stringify({ message: 'User already exists' }) };
  }
  
  // Check if userEmail is already in use
  const userEmailExists = await prisma.user.findUnique({ where: { userEmail } });
  if (userEmailExists) {
    return { statusCode: 400, body: JSON.stringify({ message: 'User email is already in use' }) };
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, userEmail }
  });
  return {
    statusCode: 201,
    body: JSON.stringify({ id: user.id, email: user.email, role: user.role, userEmail: user.userEmail })
  };
};