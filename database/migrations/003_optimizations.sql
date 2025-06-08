-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_questions_subcategory ON questions(subcategory_id);
CREATE INDEX idx_question_attempts_question ON question_attempts(question_id);
CREATE INDEX idx_performance_stats_question ON performance_stats(question_id);
CREATE INDEX idx_learning_patterns_subject ON learning_patterns(subject_id);
CREATE INDEX idx_learning_patterns_subcategory ON learning_patterns(subcategory_id);

-- Crear vistas para análisis
CREATE VIEW vw_question_performance AS
SELECT 
    q.id as question_id,
    q.subject_id,
    q.subcategory_id,
    q.type,
    q.difficulty,
    COUNT(qa.id) as total_attempts,
    AVG(CAST(qa.is_correct as INT)) as accuracy,
    AVG(qa.elapsed_time) as avg_time
FROM questions q
LEFT JOIN question_attempts qa ON q.id = qa.question_id
GROUP BY q.id, q.subject_id, q.subcategory_id, q.type, q.difficulty;

-- Crear procedimientos almacenados para operaciones comunes
CREATE PROCEDURE spGetQuestionPerformance
    @subjectId UNIQUEIDENTIFIER,
    @subcategoryIds UNIQUEIDENTIFIER,
    @questionType NVARCHAR(50)
AS
BEGIN
    SELECT 
        q.id,
        q.content,
        q.type,
        q.difficulty,
        p.total_attempts,
        p.accuracy,
        p.avg_time
    FROM questions q
    JOIN vw_question_performance p ON q.id = p.question_id
    WHERE q.subject_id = @subjectId
    AND q.subcategory_id = @subcategoryIds
    AND q.type = @questionType
    ORDER BY p.accuracy DESC;
END;

-- Crear triggers para actualización automática de estadísticas
CREATE TRIGGER trgUpdatePerformanceStats
ON question_attempts
AFTER INSERT
AS
BEGIN
    UPDATE performance_stats
    SET 
        accuracy = (
            SELECT AVG(CAST(is_correct as INT))
            FROM question_attempts
            WHERE question_id = inserted.question_id
        ),
        attempts = (
            SELECT COUNT(*)
            FROM question_attempts
            WHERE question_id = inserted.question_id
        ),
        avg_time = (
            SELECT AVG(elapsed_time)
            FROM question_attempts
            WHERE question_id = inserted.question_id
        ),
        last_updated = GETDATE()
    FROM inserted
    WHERE performance_stats.question_id = inserted.question_id;
END;
