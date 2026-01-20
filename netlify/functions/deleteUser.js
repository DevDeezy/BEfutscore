const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: 'Method Not Allowed',
    };
  }

  try {
    const token = event.headers.authorization?.split(' ')[1];
    if (!token) {
      return { 
        statusCode: 401, 
        headers: corsHeaders, 
        body: JSON.stringify({ error: 'Unauthorized' }) 
      };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    
    if (!adminUser || adminUser.role !== 'admin') {
      return { 
        statusCode: 403, 
        headers: corsHeaders, 
        body: JSON.stringify({ error: 'Forbidden' }) 
      };
    }

    // Get user ID from path
    const userId = event.path.split('/').pop();
    
    if (!userId || isNaN(parseInt(userId))) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    const userIdInt = parseInt(userId);

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userIdInt },
    });

    if (!userToDelete) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Prevent self-deletion
    if (userIdInt === decoded.id) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Cannot delete your own account' }),
      };
    }

    // Delete related records first to avoid foreign key constraints
    // Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: userIdInt },
    });

    // Delete payment methods
    await prisma.paymentMethod.deleteMany({
      where: { userId: userIdInt },
    });

    // Delete addresses
    await prisma.address.deleteMany({
      where: { userId: userIdInt },
    });

    // Delete order items and orders (cascade through order items)
    const userOrders = await prisma.order.findMany({
      where: { user_id: userIdInt },
      include: { items: true },
    });

    for (const order of userOrders) {
      // Delete order items first
      await prisma.orderItem.deleteMany({
        where: { order_id: order.id },
      });
      // Then delete the order
      await prisma.order.delete({
        where: { id: order.id },
      });
    }

    // Finally, delete the user
    await prisma.user.delete({
      where: { id: userIdInt },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'User deleted successfully' }),
    };
  } catch (err) {
    console.error('Delete user error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
