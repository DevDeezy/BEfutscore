const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { userId, items, address } = JSON.parse(event.body || '{}');
  const order = await prisma.order.create({
    data: {
      userId,
      status: 'pending',
      address_nome: address.nome,
      address_morada: address.morada,
      address_cidade: address.cidade,
      address_distrito: address.distrito,
      address_pais: address.pais,
      address_codigoPostal: address.codigoPostal,
      address_telemovel: address.telemovel,
      items: {
        create: items.map((item) => ({
          productType: item.productType,
          imageFront: item.imageFront,
          imageBack: item.imageBack,
          size: item.size,
          playerName: item.playerName,
        }))
      }
    }
  });
  return {
    statusCode: 201,
    body: JSON.stringify(order)
  };
};