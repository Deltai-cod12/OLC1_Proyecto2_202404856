const express = require('express');
const router = express.Router();
const { analyzeCode, generateASTGraph} = require('../controllers/analyzerController');

// Ruta para analizar código
router.post('/analyze', analyzeCode);
router.post('/graph-ast', generateASTGraph);

module.exports = router;