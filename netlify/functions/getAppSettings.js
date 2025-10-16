const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get all app settings from database
    const settings = await prisma.$queryRaw`
      SELECT key, value, description 
      FROM app_settings 
      ORDER BY key
    `;

    // Convert array of objects to single object
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    // Set cache headers for 1 hour
    const cacheHeaders = {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'ETag': `"${Date.now()}"`,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...cacheHeaders,
      },
      body: JSON.stringify({
        success: true,
        data: settingsObject,
      }),
    };

  } catch (error) {
    console.error('Error fetching app settings:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch app settings',
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
