exports.handler = async (event) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const id = event.path.split('/').pop();
  // TODO: Delete pack from database
  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Pack ${id} deleted` }),
  };
}; 