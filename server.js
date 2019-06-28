const app = require('./index');
const http = require('http');
const Path = require('path');

let server;

/*
 * Create and start HTTP server.
 */
// This allows the UI to be hosted somewhere else
// app.use(function(req, res, next){
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'X-Requested-With');
//     next();
// });
// app.get('/', function (req, res) {
//   res.sendFile('/', {root: Path.resolve(__dirname, './dist/metl')});
// });
// app.get('/app', function (req, res) {
//   res.sendFile('/', {root: Path.resolve(__dirname, './dist/metl')});
// });
server = http.createServer(app);
server.listen(process.env.PORT || 8000);
server.on('listening', function () {
    console.log('Server listening on http://localhost:%d', this.address().port);
});
