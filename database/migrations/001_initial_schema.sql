-- Cafe Web initial schema. Target: MySQL 8.0.16+ (enforced CHECK constraints).
-- Create/select the database and set credentials outside this script.
SET NAMES utf8mb4;

CREATE TABLE cafeterias (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(160) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    correo VARCHAR(191) NULL,
    telefono VARCHAR(32) NULL,
    zona_horaria VARCHAR(64) NOT NULL DEFAULT 'UTC',
    moneda CHAR(3) NOT NULL,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_cafeterias_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(160) NOT NULL,
    correo VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_cafeteria_id (cafeteria_id, id),
    UNIQUE KEY uq_usuarios_cafeteria_correo (cafeteria_id, correo),
    CONSTRAINT fk_usuarios_cafeteria FOREIGN KEY (cafeteria_id)
        REFERENCES cafeterias (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_usuarios_rol CHECK (rol IN ('administrador', 'empleado', 'cliente'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categorias (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500) NULL,
    orden SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_categorias_cafeteria_id (cafeteria_id, id),
    UNIQUE KEY uq_categorias_nombre (cafeteria_id, nombre),
    CONSTRAINT fk_categorias_cafeteria FOREIGN KEY (cafeteria_id)
        REFERENCES cafeterias (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE productos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    categoria_id BIGINT UNSIGNED NULL,
    sku VARCHAR(64) NULL,
    nombre VARCHAR(160) NOT NULL,
    descripcion TEXT NULL,
    precio DECIMAL(12,2) NOT NULL,
    imagen_url VARCHAR(2048) NULL,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_productos_cafeteria_id (cafeteria_id, id),
    UNIQUE KEY uq_productos_cafeteria_sku (cafeteria_id, sku),
    KEY ix_productos_catalogo (cafeteria_id, disponible, categoria_id),
    CONSTRAINT fk_productos_cafeteria FOREIGN KEY (cafeteria_id)
        REFERENCES cafeterias (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_productos_categoria FOREIGN KEY (cafeteria_id, categoria_id)
        REFERENCES categorias (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_productos_precio CHECK (precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clientes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    usuario_id BIGINT UNSIGNED NULL,
    nombre VARCHAR(160) NOT NULL,
    correo VARCHAR(191) NULL,
    telefono VARCHAR(32) NULL,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_clientes_cafeteria_id (cafeteria_id, id),
    UNIQUE KEY uq_clientes_cafeteria_correo (cafeteria_id, correo),
    UNIQUE KEY uq_clientes_cafeteria_usuario (cafeteria_id, usuario_id),
    KEY ix_clientes_telefono (cafeteria_id, telefono),
    CONSTRAINT fk_clientes_cafeteria FOREIGN KEY (cafeteria_id)
        REFERENCES cafeterias (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_clientes_usuario FOREIGN KEY (cafeteria_id, usuario_id)
        REFERENCES usuarios (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedidos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED NULL,
    codigo VARCHAR(40) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    canal VARCHAR(20) NOT NULL DEFAULT 'online',
    tipo_entrega VARCHAR(20) NOT NULL DEFAULT 'recoger',
    cliente_nombre VARCHAR(160) NOT NULL,
    cliente_correo VARCHAR(191) NULL,
    cliente_telefono VARCHAR(32) NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
    impuestos DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    moneda CHAR(3) NOT NULL,
    notas VARCHAR(1000) NULL,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_pedidos_cafeteria_id (cafeteria_id, id),
    UNIQUE KEY uq_pedidos_codigo (cafeteria_id, codigo),
    KEY ix_pedidos_estado_fecha (cafeteria_id, estado, creado_en),
    KEY ix_pedidos_cliente_fecha (cafeteria_id, cliente_id, creado_en),
    CONSTRAINT fk_pedidos_cafeteria FOREIGN KEY (cafeteria_id)
        REFERENCES cafeterias (id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cafeteria_id, cliente_id)
        REFERENCES clientes (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_pedidos_estado CHECK (estado IN ('pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado')),
    CONSTRAINT chk_pedidos_canal CHECK (canal IN ('online', 'mostrador')),
    CONSTRAINT chk_pedidos_tipo_entrega CHECK (tipo_entrega IN ('recoger', 'mesa', 'domicilio')),
    CONSTRAINT chk_pedidos_importes CHECK (
        subtotal >= 0 AND descuento >= 0 AND descuento <= subtotal
        AND impuestos >= 0 AND total >= 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_pedidos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    pedido_id BIGINT UNSIGNED NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    producto_nombre VARCHAR(160) NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY ix_detalle_pedidos_pedido (cafeteria_id, pedido_id),
    KEY ix_detalle_pedidos_producto (cafeteria_id, producto_id),
    CONSTRAINT fk_detalle_pedidos_pedido FOREIGN KEY (cafeteria_id, pedido_id)
        REFERENCES pedidos (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_detalle_pedidos_producto FOREIGN KEY (cafeteria_id, producto_id)
        REFERENCES productos (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_detalle_pedidos_importes CHECK (
        cantidad > 0 AND precio_unitario >= 0 AND subtotal >= 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pagos (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    pedido_id BIGINT UNSIGNED NOT NULL,
    estado VARCHAR(32) NOT NULL DEFAULT 'pendiente',
    proveedor VARCHAR(80) NULL,
    referencia_proveedor VARCHAR(191) NULL,
    clave_idempotencia VARCHAR(191) NULL,
    importe DECIMAL(12,2) NOT NULL,
    moneda CHAR(3) NOT NULL,
    pagado_en DATETIME(3) NULL,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY ix_pagos_pedido_estado (cafeteria_id, pedido_id, estado),
    UNIQUE KEY uq_pagos_referencia (cafeteria_id, proveedor, referencia_proveedor),
    UNIQUE KEY uq_pagos_idempotencia (cafeteria_id, clave_idempotencia),
    CONSTRAINT fk_pagos_pedido FOREIGN KEY (cafeteria_id, pedido_id)
        REFERENCES pedidos (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_pagos_estado CHECK (estado IN ('pendiente', 'autorizado', 'pagado', 'fallido', 'reembolsado', 'reembolso_parcial')),
    CONSTRAINT chk_pagos_importe CHECK (importe > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventario (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    producto_id BIGINT UNSIGNED NOT NULL,
    existencias DECIMAL(12,3) NOT NULL DEFAULT 0,
    punto_reorden DECIMAL(12,3) NOT NULL DEFAULT 0,
    unidad VARCHAR(24) NOT NULL DEFAULT 'pieza',
    actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_inventario_cafeteria_producto (cafeteria_id, producto_id),
    UNIQUE KEY uq_inventario_cafeteria_id (cafeteria_id, id),
    CONSTRAINT fk_inventario_producto FOREIGN KEY (cafeteria_id, producto_id)
        REFERENCES productos (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_inventario_cantidades CHECK (existencias >= 0 AND punto_reorden >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movimientos_inventario (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    inventario_id BIGINT UNSIGNED NOT NULL,
    usuario_id BIGINT UNSIGNED NULL,
    tipo VARCHAR(16) NOT NULL,
    cantidad_delta DECIMAL(12,3) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY ix_movimientos_inventario_fecha (cafeteria_id, inventario_id, creado_en),
    KEY ix_movimientos_inventario_usuario (cafeteria_id, usuario_id),
    CONSTRAINT fk_movimientos_inventario_inventario FOREIGN KEY (cafeteria_id, inventario_id)
        REFERENCES inventario (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_movimientos_inventario_usuario FOREIGN KEY (cafeteria_id, usuario_id)
        REFERENCES usuarios (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_movimientos_inventario_tipo CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
    CONSTRAINT chk_movimientos_inventario_delta CHECK (
        cantidad_delta <> 0 AND
        ((tipo = 'entrada' AND cantidad_delta > 0)
         OR (tipo = 'salida' AND cantidad_delta < 0)
         OR tipo = 'ajuste')
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ventas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    pedido_id BIGINT UNSIGNED NOT NULL,
    importe DECIMAL(12,2) NOT NULL,
    moneda CHAR(3) NOT NULL,
    estado VARCHAR(24) NOT NULL DEFAULT 'registrada',
    reconocida_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_ventas_cafeteria_pedido (cafeteria_id, pedido_id),
    KEY ix_ventas_fecha (cafeteria_id, reconocida_en),
    CONSTRAINT fk_ventas_pedido FOREIGN KEY (cafeteria_id, pedido_id)
        REFERENCES pedidos (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_ventas_importe CHECK (importe >= 0),
    CONSTRAINT chk_ventas_estado CHECK (estado IN ('registrada', 'reembolso_parcial', 'reembolsada'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE opiniones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    cliente_id BIGINT UNSIGNED NOT NULL,
    pedido_id BIGINT UNSIGNED NULL,
    producto_id BIGINT UNSIGNED NULL,
    calificacion TINYINT UNSIGNED NOT NULL,
    comentario VARCHAR(2000) NULL,
    publicada BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY ix_opiniones_producto (cafeteria_id, producto_id, publicada),
    KEY ix_opiniones_cliente_fecha (cafeteria_id, cliente_id, creado_en),
    CONSTRAINT fk_opiniones_cliente FOREIGN KEY (cafeteria_id, cliente_id)
        REFERENCES clientes (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_opiniones_pedido FOREIGN KEY (cafeteria_id, pedido_id)
        REFERENCES pedidos (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_opiniones_producto FOREIGN KEY (cafeteria_id, producto_id)
        REFERENCES productos (cafeteria_id, id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_opiniones_calificacion CHECK (calificacion BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE configuracion (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cafeteria_id BIGINT UNSIGNED NOT NULL,
    clave VARCHAR(100) NOT NULL,
    valor JSON NOT NULL,
    actualizado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_configuracion_cafeteria_clave (cafeteria_id, clave),
    CONSTRAINT fk_configuracion_cafeteria FOREIGN KEY (cafeteria_id)
        REFERENCES cafeterias (id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;