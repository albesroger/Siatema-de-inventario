-- CreateEnum
CREATE TYPE "estado_dispositivo" AS ENUM ('ACTIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "estado_documento" AS ENUM ('COMPLETADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "estado_general" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "estado_sincronizacion" AS ENUM ('PENDIENTE', 'SINCRONIZANDO', 'SINCRONIZADA', 'ERROR');

-- CreateEnum
CREATE TYPE "metodo_pago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO');

-- CreateEnum
CREATE TYPE "motivo_ajuste" AS ENUM ('DIFERENCIA_CONTEO', 'ERROR_REGISTRO', 'CORRECCION', 'OTRO');

-- CreateEnum
CREATE TYPE "motivo_salida" AS ENUM ('PRODUCTO_DANADO', 'PRODUCTO_VENCIDO', 'CONSUMO_INTERNO', 'PERDIDA', 'ROBO', 'MUESTRA', 'OTRO');

-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('ADMINISTRADOR', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "tipo_ajuste" AS ENUM ('POSITIVO', 'NEGATIVO');

-- CreateEnum
CREATE TYPE "tipo_dispositivo" AS ENUM ('DESKTOP', 'LAPTOP', 'TABLET');

-- CreateEnum
CREATE TYPE "tipo_movimiento" AS ENUM ('INVENTARIO_INICIAL', 'ENTRADA', 'VENTA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO');

-- CreateEnum
CREATE TYPE "tipo_referencia_movimiento" AS ENUM ('VENTA', 'ENTRADA', 'SALIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "unidad_medida" AS ENUM ('UNIDAD', 'KILOGRAMO', 'GRAMO', 'LIBRA', 'LITRO', 'MILILITRO', 'METRO', 'CENTIMETRO', 'CAJA', 'PAQUETE', 'DOCENA');

-- CreateTable
CREATE TABLE "ajuste_inventario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "dispositivo_id" UUID NOT NULL,
    "numero" BIGINT NOT NULL,
    "tipo" "tipo_ajuste" NOT NULL,
    "motivo" "motivo_ajuste" NOT NULL,
    "observaciones" TEXT,
    "estado" "estado_documento" NOT NULL DEFAULT 'COMPLETADA',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ajuste_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "estado" "estado_general" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_ajuste" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ajuste_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad" DECIMAL(14,3) NOT NULL,
    "stock_anterior" DECIMAL(14,3) NOT NULL,
    "stock_nuevo" DECIMAL(14,3) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalle_ajuste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_entrada" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entrada_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad" DECIMAL(14,3) NOT NULL,
    "costo_unitario" DECIMAL(14,2) NOT NULL,
    "descuento" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalle_entrada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_salida" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "salida_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad" DECIMAL(14,3) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalle_salida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_venta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "venta_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad" DECIMAL(14,3) NOT NULL,
    "precio_unitario" DECIMAL(14,2) NOT NULL,
    "descuento" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalle_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "identificador" VARCHAR(255) NOT NULL,
    "tipo" "tipo_dispositivo" NOT NULL,
    "estado" "estado_dispositivo" NOT NULL DEFAULT 'ACTIVO',
    "ultima_sincronizacion_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrada_inventario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "proveedor_id" UUID,
    "usuario_id" UUID NOT NULL,
    "dispositivo_id" UUID NOT NULL,
    "numero" BIGINT NOT NULL,
    "numero_documento" VARCHAR(100),
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "estado" "estado_documento" NOT NULL DEFAULT 'COMPLETADA',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entrada_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento_inventario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "dispositivo_id" UUID NOT NULL,
    "tipo" "tipo_movimiento" NOT NULL,
    "cantidad" DECIMAL(14,3) NOT NULL,
    "stock_anterior" DECIMAL(14,3) NOT NULL,
    "stock_posterior" DECIMAL(14,3) NOT NULL,
    "referencia_tipo" "tipo_referencia_movimiento" NOT NULL,
    "referencia_id" UUID NOT NULL,
    "motivo" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negocio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(150) NOT NULL,
    "nombre_comercial" VARCHAR(150),
    "direccion" VARCHAR(255),
    "telefono" VARCHAR(50),
    "moneda" VARCHAR(10) NOT NULL DEFAULT 'CUP',
    "estado" "estado_general" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operacion_sincronizacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "dispositivo_id" UUID NOT NULL,
    "secuencia_local" BIGINT NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "referencia_id" UUID NOT NULL,
    "estado" "estado_sincronizacion" NOT NULL DEFAULT 'PENDIENTE',
    "payload" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ultimo_intento_at" TIMESTAMP(6),
    "sincronizado_at" TIMESTAMP(6),
    "error_codigo" VARCHAR(100),
    "error_mensaje" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operacion_sincronizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "categoria_id" UUID NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "codigo_barras" VARCHAR(100),
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "unidad_medida" "unidad_medida" NOT NULL DEFAULT 'UNIDAD',
    "precio_compra" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "precio_venta" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "stock_actual" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "stock_minimo" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "stock_maximo" DECIMAL(14,3),
    "estado" "estado_general" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(50),
    "direccion" VARCHAR(255),
    "email" VARCHAR(150),
    "identificacion" VARCHAR(100),
    "observaciones" TEXT,
    "estado" "estado_general" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salida_inventario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "dispositivo_id" UUID NOT NULL,
    "numero" BIGINT NOT NULL,
    "motivo" "motivo_salida" NOT NULL,
    "observaciones" TEXT,
    "estado" "estado_documento" NOT NULL DEFAULT 'COMPLETADA',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salida_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "rol_usuario" NOT NULL DEFAULT 'ADMINISTRADOR',
    "estado" "estado_general" NOT NULL DEFAULT 'ACTIVO',
    "ultimo_acceso_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "negocio_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "dispositivo_id" UUID NOT NULL,
    "numero" BIGINT NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "impuesto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "metodo_pago" "metodo_pago" NOT NULL DEFAULT 'EFECTIVO',
    "estado" "estado_documento" NOT NULL DEFAULT 'COMPLETADA',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ajuste_fecha" ON "ajuste_inventario"("created_at");

-- CreateIndex
CREATE INDEX "idx_ajuste_negocio" ON "ajuste_inventario"("negocio_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_ajuste_negocio_numero" ON "ajuste_inventario"("negocio_id", "numero");

-- CreateIndex
CREATE INDEX "idx_categoria_negocio" ON "categoria"("negocio_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_categoria_negocio_nombre" ON "categoria"("negocio_id", "nombre");

-- CreateIndex
CREATE INDEX "idx_detalle_ajuste_ajuste" ON "detalle_ajuste"("ajuste_id");

-- CreateIndex
CREATE INDEX "idx_detalle_ajuste_producto" ON "detalle_ajuste"("producto_id");

-- CreateIndex
CREATE INDEX "idx_detalle_entrada_entrada" ON "detalle_entrada"("entrada_id");

-- CreateIndex
CREATE INDEX "idx_detalle_entrada_producto" ON "detalle_entrada"("producto_id");

-- CreateIndex
CREATE INDEX "idx_detalle_salida_producto" ON "detalle_salida"("producto_id");

-- CreateIndex
CREATE INDEX "idx_detalle_salida_salida" ON "detalle_salida"("salida_id");

-- CreateIndex
CREATE INDEX "idx_detalle_venta_producto" ON "detalle_venta"("producto_id");

-- CreateIndex
CREATE INDEX "idx_detalle_venta_venta" ON "detalle_venta"("venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_dispositivo_identificador" ON "dispositivo"("identificador");

-- CreateIndex
CREATE INDEX "idx_dispositivo_negocio" ON "dispositivo"("negocio_id");

-- CreateIndex
CREATE INDEX "idx_entrada_fecha" ON "entrada_inventario"("created_at");

-- CreateIndex
CREATE INDEX "idx_entrada_negocio" ON "entrada_inventario"("negocio_id");

-- CreateIndex
CREATE INDEX "idx_entrada_proveedor" ON "entrada_inventario"("proveedor_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_entrada_negocio_numero" ON "entrada_inventario"("negocio_id", "numero");

-- CreateIndex
CREATE INDEX "idx_movimiento_fecha" ON "movimiento_inventario"("created_at");

-- CreateIndex
CREATE INDEX "idx_movimiento_negocio" ON "movimiento_inventario"("negocio_id");

-- CreateIndex
CREATE INDEX "idx_movimiento_producto" ON "movimiento_inventario"("producto_id");

-- CreateIndex
CREATE INDEX "idx_movimiento_referencia" ON "movimiento_inventario"("referencia_tipo", "referencia_id");

-- CreateIndex
CREATE INDEX "idx_sync_dispositivo_estado" ON "operacion_sincronizacion"("dispositivo_id", "estado");

-- CreateIndex
CREATE INDEX "idx_sync_negocio_estado" ON "operacion_sincronizacion"("negocio_id", "estado");

-- CreateIndex
CREATE INDEX "idx_sync_referencia" ON "operacion_sincronizacion"("referencia_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sync_dispositivo_secuencia" ON "operacion_sincronizacion"("dispositivo_id", "secuencia_local");

-- CreateIndex
CREATE INDEX "idx_producto_categoria" ON "producto"("categoria_id");

-- CreateIndex
CREATE INDEX "idx_producto_codigo_barras" ON "producto"("codigo_barras");

-- CreateIndex
CREATE INDEX "idx_producto_negocio" ON "producto"("negocio_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_producto_negocio_codigo" ON "producto"("negocio_id", "codigo");

-- CreateIndex
CREATE INDEX "idx_proveedor_negocio" ON "proveedor"("negocio_id");

-- CreateIndex
CREATE INDEX "idx_salida_fecha" ON "salida_inventario"("created_at");

-- CreateIndex
CREATE INDEX "idx_salida_negocio" ON "salida_inventario"("negocio_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_salida_negocio_numero" ON "salida_inventario"("negocio_id", "numero");

-- CreateIndex
CREATE INDEX "idx_usuario_negocio" ON "usuario"("negocio_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usuario_negocio_username" ON "usuario"("negocio_id", "username");

-- CreateIndex
CREATE INDEX "idx_venta_fecha" ON "venta"("created_at");

-- CreateIndex
CREATE INDEX "idx_venta_negocio" ON "venta"("negocio_id");

-- CreateIndex
CREATE INDEX "idx_venta_usuario" ON "venta"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_venta_negocio_numero" ON "venta"("negocio_id", "numero");

-- AddForeignKey
ALTER TABLE "ajuste_inventario" ADD CONSTRAINT "fk_ajuste_dispositivo" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ajuste_inventario" ADD CONSTRAINT "fk_ajuste_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ajuste_inventario" ADD CONSTRAINT "fk_ajuste_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categoria" ADD CONSTRAINT "fk_categoria_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_ajuste" ADD CONSTRAINT "fk_detalle_ajuste_ajuste" FOREIGN KEY ("ajuste_id") REFERENCES "ajuste_inventario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_ajuste" ADD CONSTRAINT "fk_detalle_ajuste_producto" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_entrada" ADD CONSTRAINT "fk_detalle_entrada_entrada" FOREIGN KEY ("entrada_id") REFERENCES "entrada_inventario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_entrada" ADD CONSTRAINT "fk_detalle_entrada_producto" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_salida" ADD CONSTRAINT "fk_detalle_salida_producto" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_salida" ADD CONSTRAINT "fk_detalle_salida_salida" FOREIGN KEY ("salida_id") REFERENCES "salida_inventario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "fk_detalle_venta_producto" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "fk_detalle_venta_venta" FOREIGN KEY ("venta_id") REFERENCES "venta"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dispositivo" ADD CONSTRAINT "fk_dispositivo_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "entrada_inventario" ADD CONSTRAINT "fk_entrada_dispositivo" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "entrada_inventario" ADD CONSTRAINT "fk_entrada_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "entrada_inventario" ADD CONSTRAINT "fk_entrada_proveedor" FOREIGN KEY ("proveedor_id") REFERENCES "proveedor"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "entrada_inventario" ADD CONSTRAINT "fk_entrada_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "fk_movimiento_dispositivo" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "fk_movimiento_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "fk_movimiento_producto" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "fk_movimiento_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operacion_sincronizacion" ADD CONSTRAINT "fk_sync_dispositivo" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operacion_sincronizacion" ADD CONSTRAINT "fk_sync_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "fk_producto_categoria" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "fk_producto_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proveedor" ADD CONSTRAINT "fk_proveedor_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "salida_inventario" ADD CONSTRAINT "fk_salida_dispositivo" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "salida_inventario" ADD CONSTRAINT "fk_salida_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "salida_inventario" ADD CONSTRAINT "fk_salida_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "fk_usuario_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "fk_venta_dispositivo" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "fk_venta_negocio" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "fk_venta_usuario" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
