const express = require('express');
const router = express.Router();
const { analyzeCode } = require('../controllers/analyzerController');

// Ruta para analizar código
router.post('/analyze', analyzeCode);

module.exports = router;