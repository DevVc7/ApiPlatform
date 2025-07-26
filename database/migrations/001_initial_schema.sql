-- Verificar y crear tabla de versiones de migración
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[migrations]') AND type in (N'U'))
BEGIN
    CREATE TABLE migrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;

-- Crear tabla de materias
CREATE TABLE subjects (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Crear tabla de subcategorías
CREATE TABLE subcategories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    subject_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Crear tabla de preguntas
CREATE TABLE questions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    subject_id UNIQUEIDENTIFIER NOT NULL,
    subcategory_id UNIQUEIDENTIFIER  NULL,
    type NVARCHAR(50) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    options NVARCHAR(MAX),
    correct_answer NVARCHAR(MAX),
    points DECIMAL(5,2) NOT NULL,
    difficulty TINYINT,
    created_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
);

-- Crear tabla de intentos de preguntas
CREATE TABLE question_attempts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    question_id UNIQUEIDENTIFIER NOT NULL,
    student_id UNIQUEIDENTIFIER NOT NULL,
    answer NVARCHAR(MAX),
    is_correct BIT NOT NULL,
    elapsed_time INT, -- en segundos
    attempt_date DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Crear tabla de estadísticas de rendimiento
CREATE TABLE performance_stats (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    student_id UNIQUEIDENTIFIER NOT NULL,
    question_id UNIQUEIDENTIFIER NOT NULL,
    accuracy DECIMAL(5,2),
    attempts INT,
    avg_time INT, -- en segundos
    last_updated DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Crear tabla de patrones de aprendizaje
CREATE TABLE learning_patterns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    student_id UNIQUEIDENTIFIER NOT NULL,
    subject_id UNIQUEIDENTIFIER NOT NULL,
    subcategory_id UNIQUEIDENTIFIER NOT NULL,
    question_type NVARCHAR(50) NOT NULL,
    accuracy DECIMAL(5,2),
    attempts INT,
    last_updated DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
);


CREATE TABLE student (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    grade VARCHAR(50) NULL,
    progress INT NOT NULL DEFAULT 0,
    lastActive VARCHAR(50) NULL,
    code VARCHAR(200) NULL,
    note NVARCHAR(500) NULL,
    users_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (users_id) REFERENCES users (id)
);

CREATE TABLE student_subjects (
    id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    subject_id UNIQUEIDENTIFIER NOT NULL,
    student_id UNIQUEIDENTIFIER NOT NULL,
    progress INT NOT NULL DEFAULT 0,
    created_at DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2(7) NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (student_id) REFERENCES student(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);
