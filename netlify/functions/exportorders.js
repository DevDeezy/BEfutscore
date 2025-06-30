const ExcelJS = require('exceljs');
const { Buffer } = require('buffer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async function(event, context) {
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

  try {
    const { orders: receivedOrders } = JSON.parse(event.body);
    const orderIds = receivedOrders.map(o => o.id);

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
          if (item.image_front && item.image_front.startsWith('data:image')) {
            const extension = item.image_front.substring(item.image_front.indexOf('/') + 1, item.image_front.indexOf(';'));
            const base64 = item.image_front.split(',')[1];
            if (base64) {
              const imageId = workbook.addImage({
                base64: base64,
                extension: extension,
              });
              worksheet.addImage(imageId, {
                tl: { col: colIndex - 1, row: rowIndex - 1 },
                ext: { width: 100, height: 75 }
              });
            }
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