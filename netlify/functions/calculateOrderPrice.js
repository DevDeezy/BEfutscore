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
  const extraCharges = {};
  for (const item of orderItems) {
    const key = item.product_id 
      ? `product_${item.product_id}_${item.size}` // Unique key for catalog products
      : item.product_type === 'tshirt'
      ? `tshirt_${item.shirt_type_id}`
      : `shoes`; // Fallback for old shoe logic if any

    if (!itemCounts[key]) {
      itemCounts[key] = { count: 0, price: item.price || 0 };
      extraCharges[key] = { patches: 0, personalization: 0 };
    }
    itemCounts[key].count += 1;
    // Add extra charges for t-shirts (both custom and store products with personalization)
    if (item.product_type === 'tshirt' || (item.product_id && (item.player_name || item.numero || (item.patch_images && item.patch_images.length > 0)))) {
      extraCharges[key].patches += Array.isArray(item.patch_images) ? item.patch_images.length : 0;
      // Personalization is charged once if there's name and/or number (not separately)
      const hasPersonalization = (item.numero && String(item.numero).trim() !== '') || 
                                 (item.player_name && String(item.player_name).trim() !== '');
      if (hasPersonalization && extraCharges[key].personalization === undefined) {
        extraCharges[key].personalization = 1;
      }
    }
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
            // Base price
            let base = counts[key].count * getShirtPrice(shirtTypeId);
            // Add extras
            const extras = extraCharges[key] || { patches: 0, personalization: 0 };
            base += extras.patches * PATCH_PRICE;
            base += extras.personalization * PERSONALIZATION_PRICE;
            rest += base;
          } else if (key === 'shoes') { // Old logic fallback
            rest += counts[key].count * shoePrice;
          } else if (key.startsWith('product_')) {
            // New logic for catalog products
            let base = counts[key].count * counts[key].price;
            // Add extras for catalog products with personalization
            const extras = extraCharges[key] || { patches: 0, personalization: 0 };
            base += extras.patches * PATCH_PRICE;
            base += extras.personalization * PERSONALIZATION_PRICE;
            rest += base;
          }
        }
      }
      minPrice = Math.min(minPrice, total + rest);
    }
  }

  return minPrice === Infinity ? 0 : minPrice;
}

// Default extra charges for t-shirt customizations (fallback values)
let PATCH_PRICE = 2; // €2 per patch
let PERSONALIZATION_PRICE = 3; // €3 for personalization (name and/or number)

// Function to load pricing values from database
async function loadPricingValues() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const configs = await prisma.pricingConfig.findMany();
    configs.forEach(config => {
      switch (config.key) {
        case 'patch_price':
          PATCH_PRICE = config.price;
          break;
        case 'personalization_price':
          PERSONALIZATION_PRICE = config.price;
          break;
        // Keep backward compatibility
        case 'number_price':
        case 'name_price':
          if (!configs.find(c => c.key === 'personalization_price')) {
            PERSONALIZATION_PRICE = config.price;
          }
          break;
      }
    });
  } catch (error) {
    console.error('Error loading pricing values:', error);
    // Keep default values if loading fails
  }
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
    // Load pricing values from database
    await loadPricingValues();
    
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