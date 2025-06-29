const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @param {Array} orderItems - [{ product_type, shirt_type_id, ... }]
 * @param {Array} packs - [{ id, items: [{ product_type, quantity, shirt_type_id }], price }]
 * @param {Array} shirtTypes - [{ id, price }]
 * @param {number} shoePrice - price for shoes
 * @returns {number} - best price for the order
 */
function calculateOrderPrice(orderItems, packs, shirtTypes, shoePrice = 0) {
  // Helper: get price for a shirt type
  const getShirtPrice = (shirt_type_id) => {
    const type = shirtTypes.find(t => t.id === shirt_type_id);
    return type ? type.price : 0;
  };

  // Helper: count items by type and shirt_type_id
  const itemCounts = {};
  for (const item of orderItems) {
    const key = item.product_type === 'tshirt'
      ? `tshirt_${item.shirt_type_id}`
      : `shoes`;
    itemCounts[key] = (itemCounts[key] || 0) + 1;
  }

  // Try all possible pack combinations (greedy: largest pack first)
  let minPrice = Infinity;

  function tryPacks(remainingCounts, usedPacks = [], total = 0) {
    let found = false;
    for (const pack of packs) {
      // Check if pack can be applied
      let canApply = true;
      for (const packItem of pack.items) {
        const key = packItem.product_type === 'tshirt'
          ? `tshirt_${packItem.shirt_type_id}`
          : `shoes`;
        if ((remainingCounts[key] || 0) < packItem.quantity) {
          canApply = false;
          break;
        }
      }
      if (canApply) {
        // Apply pack
        const newCounts = { ...remainingCounts };
        for (const packItem of pack.items) {
          const key = packItem.product_type === 'tshirt'
            ? `tshirt_${packItem.shirt_type_id}`
            : `shoes`;
          newCounts[key] -= packItem.quantity;
        }
        tryPacks(newCounts, [...usedPacks, pack], total + pack.price);
        found = true;
      }
    }
    if (!found) {
      // No more packs can be applied, sum remaining items
      let rest = 0;
      for (const key in remainingCounts) {
        if (key.startsWith('tshirt_')) {
          const shirtTypeId = parseInt(key.split('_')[1], 10);
          rest += (remainingCounts[key] || 0) * getShirtPrice(shirtTypeId);
        } else if (key === 'shoes') {
          rest += (remainingCounts[key] || 0) * shoePrice;
        }
      }
      minPrice = Math.min(minPrice, total + rest);
    }
  }

  tryPacks(itemCounts);

  return minPrice === Infinity ? 0 : minPrice;
}

// Netlify function handler
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event) => {
  console.log('calculateOrderPrice called', { method: event.httpMethod, body: event.body });
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }
  try {
    const { items } = JSON.parse(event.body || '{}');
    const packs = await prisma.pack.findMany({ include: { items: true } });
    const shirtTypes = await prisma.shirtType.findMany();
    const shoePrice = 50; // TODO: make dynamic if needed
    const price = calculateOrderPrice(items, packs, shirtTypes, shoePrice);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ price }) };
  } catch (error) {
    console.error('Error in calculateOrderPrice:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to calculate price', details: error.message, stack: error.stack }) };
  }
}; 