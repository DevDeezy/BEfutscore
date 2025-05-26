exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  // TODO: Fetch packs from database
  const packs = [
    { _id: '1', name: 'Starter Pack', items: [{ productType: 'tshirt', quantity: 1 }], price: 10 },
    { _id: '2', name: 'Pro Pack', items: [{ productType: 'shoes', quantity: 2 }], price: 25 },
  ];
  return {
    statusCode: 200,
    body: JSON.stringify(packs),
  };
}; 