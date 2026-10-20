require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const medicionesRoutes = require('./routes/mediciones.routes');

const app = express();
const publicDir = process.env.PUBLIC_DIR || path.join(__dirname, '..', 'public');

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ mensaje: 'API de mediciones DHT11 funcionando' });
});

app.use('/api/mediciones', medicionesRoutes);

app.use(express.static(publicDir));

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
