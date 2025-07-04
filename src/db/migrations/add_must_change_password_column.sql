-- Agregar columna mustChangePassword a la tabla Users
ALTER TABLE Users
ADD mustChangePassword BIT NOT NULL DEFAULT 0;

-- Actualizar los usuarios existentes para que no requieran cambio de contraseña
UPDATE Users
SET mustChangePassword = 0;

-- Agregar restricción para asegurarse de que el campo no sea nulo
ALTER TABLE Users
ALTER COLUMN mustChangePassword BIT NOT NULL;
