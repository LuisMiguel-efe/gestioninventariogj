/*
  Warnings:

  - You are about to drop the column `assetAnteriorId` on the `Movement` table. All the data in the column will be lost.
  - You are about to drop the column `departamento` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "condicion" TEXT NOT NULL DEFAULT 'bueno',
ADD COLUMN     "departamentoId" INTEGER,
ADD COLUMN     "subTipo" TEXT,
ADD COLUMN     "valorAdquisicion" DOUBLE PRECISION,
ALTER COLUMN "estado" SET DEFAULT 'activo',
ALTER COLUMN "disponibilidad" SET DEFAULT 'disponible',
ALTER COLUMN "ubicacion" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Movement" DROP COLUMN "assetAnteriorId",
ADD COLUMN     "condicionEntrega" TEXT,
ADD COLUMN     "condicionRecepcion" TEXT,
ADD COLUMN     "fechaRetornoPrevista" TIMESTAMP(3),
ADD COLUMN     "secondaryAssetId" INTEGER,
ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "departamento",
ADD COLUMN     "cargo" TEXT,
ADD COLUMN     "departamentoId" INTEGER,
ALTER COLUMN "rol" SET DEFAULT 'empleado';

-- CreateTable
CREATE TABLE "Departamento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Herramienta" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "identificador" TEXT,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "condicion" TEXT NOT NULL DEFAULT 'bueno',
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "disponibilidad" TEXT NOT NULL DEFAULT 'disponible',
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "ubicacion" TEXT,
    "departamentoId" INTEGER,
    "propietarioId" TEXT,
    "fechaAdquisicion" TIMESTAMP(3),
    "valorAdquisicion" DOUBLE PRECISION,
    "notas" TEXT,
    "detallesAdicionales" TEXT,

    CONSTRAINT "Herramienta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CellphoneDetail" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "imei" TEXT,
    "imei2" TEXT,
    "phoneLineId" INTEGER,

    CONSTRAINT "CellphoneDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneLine" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "planNombre" TEXT,
    "precioMensual" DOUBLE PRECISION,
    "fechaActivacion" TIMESTAMP(3),
    "notas" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PhoneLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrinterDetail" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "referenciaEquipo" TEXT,
    "precioToner" DOUBLE PRECISION,
    "costoPromImpresion" DOUBLE PRECISION,
    "tipoImpresion" TEXT,

    CONSTRAINT "PrinterDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_nombre_key" ON "Departamento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Herramienta_codigo_key" ON "Herramienta"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "CellphoneDetail_assetId_key" ON "CellphoneDetail"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneLine_numero_key" ON "PhoneLine"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "PrinterDetail_assetId_key" ON "PrinterDetail"("assetId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Herramienta" ADD CONSTRAINT "Herramienta_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Herramienta" ADD CONSTRAINT "Herramienta_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellphoneDetail" ADD CONSTRAINT "CellphoneDetail_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CellphoneDetail" ADD CONSTRAINT "CellphoneDetail_phoneLineId_fkey" FOREIGN KEY ("phoneLineId") REFERENCES "PhoneLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrinterDetail" ADD CONSTRAINT "PrinterDetail_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_secondaryAssetId_fkey" FOREIGN KEY ("secondaryAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
