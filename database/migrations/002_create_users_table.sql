-- Verificar y crear tabla de usuarios si no existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'user',
        name NVARCHAR(100),
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );

    -- Insertar usuario administrador por defecto
    -- INSERT INTO users (email, password, role, name)
    -- VALUES (
    --     'admin@example.com',
    --     '$2a$10$C/BFNGi4kLzxFYJybIX3j.OhUc5wuACd28GoK.z5Zr89Ut2TeEMXS',
    --     'admin',
    --     'Admin'
    -- );
END;
