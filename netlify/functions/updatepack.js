exports.handler = async (event) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const id = event.path.split('/').pop();
  const data = JSON.parse(event.body);
  // TODO: Update pack in database
  return {
    statusCode: 200,
    body: JSON.stringify({ _id: id, ...data }),
  };
}; 