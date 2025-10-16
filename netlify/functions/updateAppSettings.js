const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Check if user is authenticated and is admin
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Token de autorização necessário',
        }),
      };
    }

    // Verify admin token (you might want to implement proper JWT verification)
    // For now, we'll assume the token is valid if present
    
    const body = JSON.parse(event.body);
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: 'Configurações inválidas',
        }),
      };
    }

    // Update settings in database
    const updatePromises = Object.entries(settings).map(([key, value]) => {
      return prisma.$executeRaw`
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (${key}, ${String(value)}, NOW())
        ON CONFLICT (key) 
        DO UPDATE SET 
          value = EXCLUDED.value,
          updated_at = NOW()
      `;
    });

    await Promise.all(updatePromises);

    // Return updated settings
    const updatedSettings = await prisma.$queryRaw`
      SELECT key, value 
      FROM app_settings 
      ORDER BY key
    `;

    const settingsObject = {};
    updatedSettings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // Clear cache headers to force refresh
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      body: JSON.stringify({
        success: true,
        data: settingsObject,
        message: 'Configurações atualizadas com sucesso',
      }),
    };

  } catch (error) {
    console.error('Error updating app settings:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Falha ao atualizar configurações',
      }),
    };
  } finally {
    await prisma.$disconnect();
  }
};
