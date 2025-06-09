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
  try {
    const orders = getOrders();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');
    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 12 },
      { header: 'User', key: 'user', width: 25 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created At', key: 'createdAt', width: 15 },
      { header: 'Product', key: 'product', width: 12 },
      { header: 'Size', key: 'size', width: 8 },
      { header: 'Player Name', key: 'playerName', width: 18 },
      { header: 'Image', key: 'image', width: 20 },
      { header: 'Name', key: 'name', width: 18 },
      { header: 'Address', key: 'address', width: 25 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'District', key: 'district', width: 15 },
      { header: 'Country', key: 'country', width: 12 },
      { header: 'Postal Code', key: 'postalCode', width: 12 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Proof of Payment', key: 'proof', width: 18 },
    ];
    let rowIndex = 2;
    for (const order of orders) {
      const address = order.address || {};
      const user = typeof order.user === 'object'
        ? (order.user.email || order.user.id || JSON.stringify(order.user))
        : order.user;
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          worksheet.addRow({
            orderId: order._id || order.id,
            user,
            status: order.status,
            createdAt: order.created_at ? new Date(order.created_at).toLocaleDateString() : '',
            product: item.product_type === 'tshirt' ? 'T-Shirt' : 'Shoes',
            size: item.size,
            playerName: item.player_name || '',
            image: '',
            name: address.nome || '',
            address: address.morada || '',
            city: address.cidade || '',
            district: address.distrito || '',
            country: address.pais || '',
            postalCode: address.codigoPostal || '',
            phone: address.telemovel || '',
            proof: address.proofImage ? 'Attached' : '',
          });
          if (item.image_front && item.image_front.startsWith('data:image')) {
            const imageId = workbook.addImage({
              base64: item.image_front,
              extension: item.image_front.includes('png') ? 'png' : 'jpeg',
            });
            worksheet.addImage(imageId, {
              tl: { col: 7, row: rowIndex - 1 },
              ext: { width: 120, height: 120 },
            });
          }
          rowIndex++;
        }
      }
    }
    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=orders_with_images.xlsx',
      },
      isBase64Encoded: true,
      body: Buffer.from(buffer).toString('base64'),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Error generating Excel: ' + err.message,
    };
  }
}; 