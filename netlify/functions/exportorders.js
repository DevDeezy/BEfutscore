const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');
const fs = require('fs').promises; // Use promises version of fs
// const axios = require('axios'); // Remove axios

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
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, body: 'Request body is missing' };
    }
    const { orders: requestOrders } = JSON.parse(event.body);

    if (!requestOrders || !Array.isArray(requestOrders)) {
        return { statusCode: 400, body: 'Invalid request: "orders" array is missing or not an array.' };
    }
    
    // Extract just the IDs to prevent sending large data objects from client
    const orderIds = requestOrders.map(o => o.id);

    // Fetch full order details from DB
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds }
      },
      include: {
        items: true,
        user: true,
      }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Encomendas');

    let rowIndex = 1;
    for (const order of orders) {
      worksheet.getRow(rowIndex).height = 80;
      worksheet.getRow(rowIndex + 1).height = 15;

      let colIndex = 1;
      if (order.items) {
        for (const item of order.items) {
          let imageBuffer;
          let imageExtension = 'jpeg'; // Default extension

          if (item.image_front && item.image_front.startsWith('data:image')) {
            // Handle base64 encoded images
            imageExtension = item.image_front.substring(item.image_front.indexOf('/') + 1, item.image_front.indexOf(';'));
            const base64 = item.image_front.split(',')[1];
            if (base64) {
              imageBuffer = Buffer.from(base64, 'base64');
            }
          } else if (item.image_front && item.image_front.startsWith('http')) {
            // Handle URL images using fetch
            try {
              const response = await fetch(item.image_front);
              if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
              const arrayBuffer = await response.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
              // Try to get extension from URL
              const urlPath = new URL(item.image_front).pathname;
              const ext = urlPath.split('.').pop();
              if (["jpeg", "jpg", "png", "gif"].includes(ext)) {
                imageExtension = ext;
              }
            } catch (error) {
              console.error(`Failed to download image from ${item.image_front}`, error);
              // Optionally, skip to the next item or use a placeholder
            }
          }

          if (imageBuffer) {
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: imageExtension,
            });
            worksheet.addImage(imageId, {
              tl: { col: colIndex - 1, row: rowIndex - 1 },
              ext: { width: 100, height: 75 }
            });
          }
          
          worksheet.getColumn(colIndex).width = 15;
          const description = `${item.size || ''} ${item.player_name ? `#${item.player_name}` : ''}`.trim();
          const cell = worksheet.getCell(rowIndex + 1, colIndex);
          cell.value = description;
          cell.alignment = { horizontal: 'center' };
          colIndex++;
        }
      }

      let addressCol = colIndex + 1;
      const addressParts = [
        `Nome: ${order.address_nome}`,
        `Morada: ${order.address_morada}`,
        `Cidade: ${order.address_cidade}`,
        `Distrito: ${order.address_distrito}`,
        `País: ${order.address_pais}`,
        `Código-Postal: ${order.address_codigo_postal}`,
        `Telemóvel: ${order.address_telemovel}`,
      ];
      const addressText = addressParts.join('\n');
      const addressCell = worksheet.getCell(rowIndex, addressCol);
      addressCell.value = addressText;
      addressCell.alignment = { wrapText: true, vertical: 'top' };
      worksheet.getColumn(addressCol).width = 40;

      let priceCol = addressCol + 2;
      worksheet.getCell(rowIndex, priceCol).value = 'Total Futscore';
      worksheet.getCell(rowIndex, priceCol + 1).value = order.total_price;
      worksheet.getColumn(priceCol).width = 15;
      worksheet.getColumn(priceCol + 1).width = 10;
      
      worksheet.getCell(rowIndex, priceCol + 2).value = 'Total Apple';
      worksheet.getCell(rowIndex, priceCol + 3).value = order.total_price;
      worksheet.getColumn(priceCol + 2).width = 15;
      worksheet.getColumn(priceCol + 3).width = 10;

      rowIndex += 2;
      const separatorRow = worksheet.getRow(rowIndex);
      separatorRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' }
      };
      separatorRow.height = 5;

      rowIndex += 1;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    // Update status of exported orders to 'Em Processamento'
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: 'Em Processamento' },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=encomendas.xlsx',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      isBase64Encoded: true,
      body: Buffer.from(buffer).toString('base64'),
    };

  } catch (err) {
    console.error('Error generating Excel:', err);
    return {
      statusCode: 500,
      body: 'Error generating Excel: ' + err.message,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  }
}; 