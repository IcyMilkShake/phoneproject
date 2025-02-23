const serverless = require('serverless-http');
const app = require('../server'); // assuming your Express app is in app.js

module.exports = serverless(app);