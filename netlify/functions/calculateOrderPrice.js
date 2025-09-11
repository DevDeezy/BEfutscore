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
    // Treat any item that has a shirt_type_id as a t-shirt of that type,
    // even if it is a catalog product (product_id present). This allows
    // packs to apply to store products as well.
    const key = (item.shirt_type_id != null && item.shirt_type_id !== '')
      ? `tshirt_${item.shirt_type_id}`
      : (item.product_id
        ? `product_${item.product_id}_${item.size}` // Unique key for catalog products without shirt type
        : (item.product_type === 'shoes' ? `shoes` : `other`));

    if (!itemCounts[key]) {
      itemCounts[key] = { count: 0, sumPrice: 0 };
      extraCharges[key] = { patches: 0, personalization: 0 };
    }
    itemCounts[key].count += 1;
    itemCounts[key].sumPrice += typeof item.price === 'number' ? item.price : 0;
    
    // Add extra charges for t-shirts (custom or catalog) when they have shirt_type_id
    // For catalog products, we still apply personalization/patch costs if present
    if ((item.shirt_type_id != null && item.shirt_type_id !== '') || item.product_id) {
      extraCharges[key].patches += Array.isArray(item.patch_images) ? item.patch_images.length : 0;
      // Personalization is charged per item if there's name and/or number
      const hasPersonalization = (item.numero && String(item.numero).trim() !== '') || 
                                 (item.player_name && String(item.player_name).trim() !== '');
      if (hasPersonalization) {
        extraCharges[key].personalization += 1;
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
            const countForType = counts[key].count;
            const sumBasePriceForType = counts[key].sumPrice || 0;

            // Find best applicable pack for this shirt type: lowest per-item price among packs
            let bestUnitPrice = Infinity;
            for (const pack of packs) {
              // Only consider packs that are single-type and match this shirtType
              if (!Array.isArray(pack.items) || pack.items.length !== 1) continue;
              const packItem = pack.items[0];
              const packKey = packItem.product_type === 'tshirt' ? `tshirt_${packItem.shirt_type_id}` : null;
              if (packKey !== key) continue;
              if ((packItem.quantity || 0) <= countForType) {
                // Treat pack.price as per-item price
                if (typeof pack.price === 'number') {
                  bestUnitPrice = Math.min(bestUnitPrice, pack.price);
                }
              }
            }

            // Base cost: if a qualifying pack exists, all items get that per-item price; otherwise sum of base prices
            let base = 0;
            if (bestUnitPrice !== Infinity) {
              base = countForType * bestUnitPrice;
            } else {
              // Fallback: use summed product prices or default shirt type price if missing
              base = sumBasePriceForType > 0 ? sumBasePriceForType : countForType * getShirtPrice(shirtTypeId);
            }

            // Add extras
            const extras = extraCharges[key] || { patches: 0, personalization: 0 };
            base += extras.patches * PATCH_PRICE;
            base += extras.personalization * PERSONALIZATION_PRICE;
            rest += base;
          } else if (key === 'shoes') { // Old logic fallback
            rest += counts[key].count * shoePrice;
          } else if (key.startsWith('product_')) {
            // Catalog products without a shirt type; sum their prices directly
            let base = counts[key].sumPrice || 0;
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