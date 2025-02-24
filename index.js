// index.js
const express = require('express');
const router = express.Router();

// Test route for isolation
router.get('/test', (req, res) => {
  res.send('Test route working');
});

// Default catch-all route for other requests
router.all('*', (req, res) => {
  res.status(404).send('Page not found');
});

module.exports = router;
