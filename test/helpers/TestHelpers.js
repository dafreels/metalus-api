
exports.authUser = async (request, state, username='admin', password='admin') => {
  // Auth user
  if (state.authCookie) {
    return state.authCookie;
  }
  return await request
    .post('/api/v1/users/login')
    .send({'username': username, 'password': password})
    .then((res) => {
      state.authCookie = res.headers['set-cookie'][0];
      return state.authCookie;
    });
};
