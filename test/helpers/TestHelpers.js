
exports.authUser = async (request, state) => {
  // Auth user
  if (state.authCookie) {
    return state.authCookie;
  }
  return await request
    .post('/api/v1/users/login')
    .send({'username': 'admin', 'password': 'admin'})
    .then((res) => {
      state.authCookie = res.headers['set-cookie'][0];
      return state.authCookie;
    });
};
