exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const data = JSON.parse(event.body);
  // TODO: Save pack to database
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Pack created', pack: data }),
  };
}; 