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

          // Build comprehensive description including all customizations
          let descriptionParts = [];
          if (item.size) descriptionParts.push(`Tamanho: ${item.size}`);
          if (item.player_name && String(item.player_name).trim() !== '') descriptionParts.push(`Nome: ${item.player_name}`);
          if (item.numero && String(item.numero).trim() !== '') descriptionParts.push(`Número: ${item.numero}`);
          if (item.quantity && item.quantity > 1) descriptionParts.push(`Quantidade: ${item.quantity}`);
          
          const description = descriptionParts.join('\n');
          
          // Put description in the column before the image
          const descriptionCell = worksheet.getCell(rowIndex, colIndex);
          descriptionCell.value = description;
          descriptionCell.alignment = { wrapText: true, vertical: 'top' };
          worksheet.getColumn(colIndex).width = 20;
          colIndex++;

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
          colIndex++;

          // Add patch images if they exist
          if (item.patch_images && Array.isArray(item.patch_images) && item.patch_images.length > 0) {
            for (let patchIndex = 0; patchIndex < item.patch_images.length; patchIndex++) {
              const patchImage = item.patch_images[patchIndex];
              let patchImageBuffer;
              let patchImageExtension = 'jpeg';

              if (patchImage && patchImage.startsWith('data:image')) {
                // Handle base64 encoded images
                patchImageExtension = patchImage.substring(patchImage.indexOf('/') + 1, patchImage.indexOf(';'));
                const base64 = patchImage.split(',')[1];
                if (base64) {
                  patchImageBuffer = Buffer.from(base64, 'base64');
                }
              } else if (patchImage && patchImage.startsWith('http')) {
                // Handle URL images using fetch
                try {
                  const response = await fetch(patchImage);
                  if (!response.ok) throw new Error(`Failed to fetch patch image: ${response.status}`);
                  const arrayBuffer = await response.arrayBuffer();
                  patchImageBuffer = Buffer.from(arrayBuffer);
                  // Try to get extension from URL
                  const urlPath = new URL(patchImage).pathname;
                  const ext = urlPath.split('.').pop();
                  if (["jpeg", "jpg", "png", "gif"].includes(ext)) {
                    patchImageExtension = ext;
                  }
                } catch (error) {
                  console.error(`Failed to download patch image from ${patchImage}`, error);
                  continue; // Skip this patch image if it fails
                }
              }

              if (patchImageBuffer) {
                const patchImageId = workbook.addImage({
                  buffer: patchImageBuffer,
                  extension: patchImageExtension,
                });
                worksheet.addImage(patchImageId, {
                  tl: { col: colIndex - 1, row: rowIndex - 1 },
                  ext: { width: 50, height: 40 } // Smaller size for patch images
                });
                colIndex++;
              }
            }
          }
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
      
      // Calculate total cost including patches, names, and numbers
      let totalCost = 0;
      if (order.items) {
        // Get pricing values from database
        let patchPrice = 2; // Default fallback
        let numberPrice = 3; // Default fallback
        let namePrice = 3; // Default fallback
        
        try {
          const pricingConfigs = await prisma.pricingConfig.findMany();
          pricingConfigs.forEach(config => {
            switch (config.key) {
              case 'patch_price':
                patchPrice = config.cost_price;
                break;
              case 'number_price':
                numberPrice = config.cost_price;
                break;
              case 'name_price':
                namePrice = config.cost_price;
                break;
            }
          });
        } catch (error) {
          console.error('Error loading pricing config:', error);
          // Use default values if loading fails
        }
        
        for (const item of order.items) {
          let itemCost = (item.cost_price || 0) * (item.quantity || 1);
          
          // Add extra charges for t-shirts
          if (item.product_type === 'tshirt') {
            // Add patch costs
            if (item.patch_images && Array.isArray(item.patch_images)) {
              itemCost += item.patch_images.length * patchPrice * (item.quantity || 1);
            }
            
            // Add number cost
            if (item.numero && String(item.numero).trim() !== '') {
              itemCost += numberPrice * (item.quantity || 1);
            }
            
            // Add name cost
            if (item.player_name && String(item.player_name).trim() !== '') {
              itemCost += namePrice * (item.quantity || 1);
            }
          }
          
          totalCost += itemCost;
        }
      }
      
      worksheet.getCell(rowIndex, priceCol + 3).value = totalCost || order.total_price;
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

    // Update status of exported orders to 'em_pagamento_fabrica'
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: 'em_pagamento_fabrica' },
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