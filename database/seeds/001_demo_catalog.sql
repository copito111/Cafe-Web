-- Datos locales de demostracion. No usar en produccion.
START TRANSACTION;

INSERT INTO cafeterias (nombre, slug, correo, zona_horaria, moneda)
VALUES ('Cafe Aurora', 'cafe-demo', 'hola@cafeaurora.local', 'America/Mexico_City', 'MXN')
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
SET @cafeteria_id = LAST_INSERT_ID();

INSERT INTO categorias (cafeteria_id, nombre, descripcion, orden)
VALUES (@cafeteria_id, 'Cafe', 'Preparaciones de la casa', 1)
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
SET @cafe_categoria_id = LAST_INSERT_ID();

INSERT INTO categorias (cafeteria_id, nombre, descripcion, orden)
VALUES (@cafeteria_id, 'Pan dulce', 'Horneado fresco cada manana', 2)
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
SET @pan_categoria_id = LAST_INSERT_ID();

INSERT INTO categorias (cafeteria_id, nombre, descripcion, orden)
VALUES (@cafeteria_id, 'Bebidas frias', 'Frescas, suaves y listas para llevar', 3)
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
SET @frias_categoria_id = LAST_INSERT_ID();

INSERT INTO categorias (cafeteria_id, nombre, descripcion, orden)
VALUES (@cafeteria_id, 'Desayunos', 'Para comenzar el dia con algo especial', 4)
ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id);
SET @desayunos_categoria_id = LAST_INSERT_ID();

INSERT INTO productos (cafeteria_id, categoria_id, sku, nombre, descripcion, precio)
VALUES
    (@cafeteria_id, @cafe_categoria_id, 'ESP-001', 'Espresso Aurora', 'Corto, intenso y aromatico', 48.00),
    (@cafeteria_id, @cafe_categoria_id, 'LAT-001', 'Latte de vainilla', 'Cafe espresso, leche y vainilla', 72.00),
    (@cafeteria_id, @pan_categoria_id, 'CRO-001', 'Croissant de mantequilla', 'Hojaldre dorado y crujiente', 58.00),
    (@cafeteria_id, @pan_categoria_id, 'ROL-001', 'Rol de canela', 'Canela, glaseado y nuez', 62.00),
    (@cafeteria_id, @frias_categoria_id, 'COL-001', 'Cold brew naranja', 'Cold brew, naranja y hielo', 78.00),
    (@cafeteria_id, @frias_categoria_id, 'MAT-001', 'Matcha latte', 'Matcha ceremonial y leche', 82.00),
    (@cafeteria_id, @desayunos_categoria_id, 'TOA-001', 'Toast de aguacate', 'Pan de masa madre, aguacate y semillas', 115.00),
    (@cafeteria_id, @desayunos_categoria_id, 'YOG-001', 'Yogurt con granola', 'Yogurt natural, fruta y granola casera', 88.00),
    (@cafeteria_id, @desayunos_categoria_id, 'MUF-001', 'Muffin de arandano', 'Muffin tibio con arandanos', 54.00),
    (@cafeteria_id, @desayunos_categoria_id, 'SAN-001', 'Sandwich de la casa', 'Pan artesanal, queso y vegetales', 128.00)
ON DUPLICATE KEY UPDATE
    nombre = VALUES(nombre),
    descripcion = VALUES(descripcion),
    precio = VALUES(precio),
    disponible = TRUE;

COMMIT;
