const express = require('express');
const cors = require('cors');
const analyzerRoutes = require('./src/routes/analyzer');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors()); // Permite requests desde el frontend
app.use(express.json()); // Para parsear JSON
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api', analyzerRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend de SimpliCode funcionando',
    endpoints: {
      analyze: 'POST /api/analyze'
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Ruta no encontrada - CORREGIDO
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
  console.log(` Endpoints disponibles:`);
  console.log(`   POST http://localhost:${PORT}/api/analyze`);
  console.log(`   GET  http://localhost:${PORT}/`);
});