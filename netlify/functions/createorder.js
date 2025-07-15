const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateOrderPrice } = require('./calculateOrderPrice');

exports.handler = async (event) => {
  console.log('createorder called', { method: event.httpMethod, body: event.body });
  // CORS (add if needed)
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
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const { userId, items, address, paymentMethod } = JSON.parse(event.body || '{}');

    // Fetch packs and shirt types for price calculation
    const packs = await prisma.pack.findMany({ include: { items: true } });
    const shirtTypes = await prisma.shirtType.findMany();
    // TODO: Replace with dynamic shoe price if needed
    const shoePrice = 50;

    // Calculate price by expanding items with quantity
    const expandedItems = items.flatMap(item => 
      Array(item.quantity || 1).fill(item)
    );
    const finalPrice = calculateOrderPrice(expandedItems, packs, shirtTypes, shoePrice);

    const order = await prisma.order.create({
      data: {
        user_id: Number(userId),
        status: 'pending',
        address_nome: address.nome,
        address_morada: address.morada,
        address_cidade: address.cidade,
        address_distrito: address.distrito,
        address_pais: address.pais,
        address_codigo_postal: address.codigoPostal,
        address_telemovel: address.telemovel,
        total_price: finalPrice,
        proofReference: address.proofReference || null,
        paymentMethod: paymentMethod || null,
        proofImage: address.proofImage || null,
        items: {
          create: items.map((item) => ({
            quantity: item.quantity,
            product: item.product_id ? { connect: { id: item.product_id } } : undefined,
            product_type: item.product_type,
            image_front: item.image_front || '',
            image_back: item.image_back || '',
            size: item.size,
            player_name: item.player_name,
            shirtType: item.shirt_type_id ? { connect: { id: item.shirt_type_id } } : undefined,
            sexo: item.sexo || null,
            ano: item.ano || null,
            numero: item.numero || null,
            patch_images: item.patch_images || [],
            anuncios: typeof item.anuncios === 'boolean' ? item.anuncios : false,
          }))
        }
      }
    });
    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ id: order.id, price: finalPrice }),
    };
  } catch (err) {
    console.error('Error in createorder:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message, stack: err.stack }),
    };
  }
};