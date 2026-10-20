-- Baseline de la tabla existente mediciones_temperatura
CREATE TABLE "mediciones_temperatura" (
    "id" SERIAL NOT NULL,
    "temperatura" DECIMAL,
    "creado_en" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mediciones_temperatura_pkey" PRIMARY KEY ("id")
);
