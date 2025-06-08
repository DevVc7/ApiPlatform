-- Insertar datos iniciales de materias
DECLARE @MathId UNIQUEIDENTIFIER = NEWID();
DECLARE @CommId UNIQUEIDENTIFIER = NEWID();

INSERT INTO subjects (id, name, description) VALUES
(@MathId, 'Matemática', 'Contenido de matemáticas'),
(@CommId, 'Comunicación', 'Contenido de comunicación');

-- Insertar subcategorías de Matemática
DECLARE @AlgebraId UNIQUEIDENTIFIER = NEWID();
DECLARE @TrigonometryId UNIQUEIDENTIFIER = NEWID();

INSERT INTO subcategories (id, subject_id, name, description) VALUES
(@AlgebraId, @MathId, 'Álgebra', 'Contenido de álgebra'),
(@TrigonometryId, @MathId, 'Trigonometría', 'Contenido de trigonometría');

-- Insertar subcategorías de Comunicación
DECLARE @GrammarId UNIQUEIDENTIFIER = NEWID();
DECLARE @LiteratureId UNIQUEIDENTIFIER = NEWID();

INSERT INTO subcategories (id, subject_id, name, description) VALUES
(@GrammarId, @CommId, 'Gramática', 'Contenido de gramática'),
(@LiteratureId, @CommId, 'Literatura', 'Contenido de literatura');

-- Insertar preguntas de ejemplo
DECLARE @Question1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @Question2Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO questions (id, subject_id, subcategory_id, type, content, options, correct_answer, points, difficulty, created_by) VALUES
(@Question1Id, @MathId, @AlgebraId, 'multiple_choice', 
    '¿Cuál es el resultado de 2x + 3 = 7?',
    '["2","3","4","5"]',
    '2',
    1,
    1,
    '00000000-0000-0000-0000-000000000000'),

(@Question2Id, @CommId, @GrammarId, 'true_false',
    'La oración "El gato negro" es correcta',
    '[]',
    'true',
    1,
    1,
    '00000000-0000-0000-0000-000000000000');
