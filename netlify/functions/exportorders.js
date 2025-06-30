const ExcelJS = require('exceljs');
const { Buffer } = require('buffer');
const fs = require('fs');
const path = require('path');

// Helper to get orders (simulate DB or read from file)
function getOrders() {
  // In production, fetch from DB. Here, read from a file for demo:
  const ORDERS_JSON_PATH = path.join(__dirname, 'orders.json');
  if (!fs.existsSync(ORDERS_JSON_PATH)) return [];
  return JSON.parse(fs.readFileSync(ORDERS_JSON_PATH, 'utf8'));
}

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  try {
    const orders = getOrders();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');
    
    // Define columns
    worksheet.columns = [
      { header: 'ID da Encomenda', key: 'orderId', width: 15 },
      { header: 'Utilizador', key: 'user', width: 30 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Data de Criação', key: 'createdAt', width: 20 },
      { header: 'Itens', key: 'items', width: 50 },
      { header: 'Imagens', key: 'images', width: 40 },
      { header: 'Preço Total', key: 'totalPrice', width: 15 },
      { header: 'Morada', key: 'address', width: 50 },
    ];

    let imageRow = 2; // Start images from the second row
    for (const order of orders) {
      const user = order.user?.email || 'N/A';
      const status = order.status || 'N/A';
      const createdAt = new Date(order.created_at).toLocaleString();
      const totalPrice = `€${order.total_price.toFixed(2)}`;
      
      const addressParts = [
        order.address_nome,
        order.address_morada,
        order.address_cidade,
        order.address_distrito,
        order.address_codigo_postal,
        order.address_pais,
        order.address_telemovel,
      ];
      const address = addressParts.filter(Boolean).join(', ');

      // Aggregate item details
      const itemDetails = order.items.map(item => {
        const type = item.product_type === 'tshirt' ? 'Camisola' : 'Sapatilhas';
        const name = item.name || 'Personalizado';
        return `${item.quantity}x ${name} (${type}, Tamanho: ${item.size})`;
      }).join('\n');

      // Add the row with aggregated data
      worksheet.addRow({
        orderId: order.id,
        user,
        status,
        createdAt,
        items: itemDetails,
        totalPrice,
        address,
      });

      // Add images to the 'images' cell for this row
      let currentImageCol = 6; // 'Imagens' is the 6th column (1-based index)
      for (const item of order.items) {
        if (item.image_front && item.image_front.startsWith('data:image')) {
          const imageId = workbook.addImage({
            base64: item.image_front.split(',')[1],
            extension: item.image_front.includes('png') ? 'png' : 'jpeg',
          });
          
          worksheet.addImage(imageId, {
            tl: { col: currentImageCol, row: imageRow - 1 },
            ext: { width: 50, height: 50 },
          });
          
        }
      }
      worksheet.getRow(imageRow).height = 40; // Set row height to accommodate images
      imageRow++;
    }

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=orders_with_images.xlsx',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      isBase64Encoded: true,
      body: Buffer.from(buffer).toString('base64'),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Error generating Excel: ' + err.message,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  }
}; 