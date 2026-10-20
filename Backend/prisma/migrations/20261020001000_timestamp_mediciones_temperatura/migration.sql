-- Mejora del timestamp: nombre claro y obligatorio
ALTER TABLE "mediciones_temperatura" RENAME COLUMN "creado_en" TO "timestamp";
ALTER TABLE "mediciones_temperatura" ALTER COLUMN "timestamp" SET NOT NULL;
ALTER TABLE "mediciones_temperatura" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;
