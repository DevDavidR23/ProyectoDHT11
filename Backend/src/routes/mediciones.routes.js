const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

const serialize = (medicion) => ({
  ...medicion,
  temperatura: medicion.temperatura === null ? null : Number(medicion.temperatura),
});

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const parseTemperatura = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const temperatura = Number(value);
  if (!Number.isFinite(temperatura)) return null;
  return temperatura >= -40 && temperatura <= 80 ? temperatura : null;
};

const parseTimestamp = (value) => {
  if (value === null || value === undefined || value === '') return undefined;
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
};

router.get('/', async (req, res) => {
  const mediciones = await prisma.medicionTemperatura.findMany({
    orderBy: { timestamp: 'desc' },
  });
  res.json(mediciones.map(serialize));
});

router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  const medicion = await prisma.medicionTemperatura.findUnique({ where: { id } });
  if (!medicion) return res.status(404).json({ error: 'Medición no encontrada' });

  res.json(serialize(medicion));
});

router.post('/', async (req, res) => {
  const { temperatura, timestamp } = req.body;

  const temperaturaNum = parseTemperatura(temperatura);
  const timestampDate = parseTimestamp(timestamp);

  if (temperaturaNum === null) {
    return res.status(400).json({ error: 'temperatura es obligatoria y debe estar entre -40 y 80' });
  }
  if (timestampDate === null) {
    return res.status(400).json({ error: 'timestamp inválido' });
  }

  const medicion = await prisma.medicionTemperatura.create({
    data: {
      temperatura: temperaturaNum,
      ...(timestampDate && { timestamp: timestampDate }),
    },
  });

  res.status(201).json(serialize(medicion));
});

router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  const { temperatura, timestamp } = req.body;
  const data = {};

  if (temperatura !== undefined) {
    const temperaturaNum = parseTemperatura(temperatura);
    if (temperaturaNum === null) {
      return res.status(400).json({ error: 'temperatura debe estar entre -40 y 80' });
    }
    data.temperatura = temperaturaNum;
  }

  if (timestamp !== undefined) {
    const timestampDate = parseTimestamp(timestamp);
    if (timestampDate === null) return res.status(400).json({ error: 'timestamp inválido' });
    if (timestampDate) data.timestamp = timestampDate;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
  }

  const existe = await prisma.medicionTemperatura.findUnique({ where: { id } });
  if (!existe) return res.status(404).json({ error: 'Medición no encontrada' });

  const medicion = await prisma.medicionTemperatura.update({ where: { id }, data });
  res.json(serialize(medicion));
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID inválido' });

  const existe = await prisma.medicionTemperatura.findUnique({ where: { id } });
  if (!existe) return res.status(404).json({ error: 'Medición no encontrada' });

  await prisma.medicionTemperatura.delete({ where: { id } });
  res.json({ mensaje: 'Medición eliminada', medicion: serialize(existe) });
});

module.exports = router;
