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
    const key = item.product_id 
      ? `product_${item.product_id}_${item.size}` // Unique key for catalog products
      : item.product_type === 'tshirt'
      ? `tshirt_${item.shirt_type_id}`
      : `shoes`; // Fallback for old shoe logic if any
    
    if (!itemCounts[key]) {
      itemCounts[key] = { count: 0, price: item.price || 0 };
    }
    itemCounts[key].count += item.quantity || 1;
  }

  // Use an iterative approach to avoid stack overflow
  let minPrice = Infinity;
  const stack = [{ counts: itemCounts, total: 0 }];

  while (stack.length > 0) {
    const { counts, total } = stack.pop();

    let foundPackToApply = false;
    for (const pack of packs) {
      let canApply = true;
      const newCounts = { ...counts };

      for (const packItem of pack.items) {
        // This part is tricky because packs are generic.
        // We need to find a matching item in the cart to consume.
        // For now, we assume pack definition matches the old logic.
        const key = packItem.product_type === 'tshirt'
          ? `tshirt_${packItem.shirt_type_id}`
          : `shoes`;
        if ((newCounts[key]?.count || 0) < packItem.quantity) {
          canApply = false;
          break;
        }
        newCounts[key].count -= packItem.quantity;
      }

      if (canApply) {
        foundPackToApply = true;
        stack.push({ counts: newCounts, total: total + pack.price });
      }
    }

    if (!foundPackToApply) {
      // No more packs can be applied, sum remaining items
      let rest = 0;
      for (const key in counts) {
        if (counts[key].count > 0) {
          if (key.startsWith('tshirt_')) {
            const shirtTypeId = parseInt(key.split('_')[1], 10);
            rest += counts[key].count * getShirtPrice(shirtTypeId);
          } else if (key === 'shoes') { // Old logic fallback
            rest += counts[key].count * shoePrice;
          } else if (key.startsWith('product_')) {
            // New logic for catalog products
            rest += counts[key].count * counts[key].price;
          }
        }
      }
      minPrice = Math.min(minPrice, total + rest);
    }
  }

  return minPrice === Infinity ? 0 : minPrice;
}

// Netlify function handler
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.calculateOrderPrice = calculateOrderPrice;

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
    
    // Expand items from the cart, as calculateOrderPrice expects a flat list
    const expandedItems = items.flatMap(item => 
      Array(item.quantity || 1).fill(item)
    );

    const shoePrice = 0; // Deprecated, price now comes from item itself
    const price = calculateOrderPrice(expandedItems, packs, shirtTypes, shoePrice);
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ price }) };
  } catch (error) {
    console.error('Error in calculateOrderPrice:', error);
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to calculate price', details: error.message, stack: error.stack }) };
  }
}; 