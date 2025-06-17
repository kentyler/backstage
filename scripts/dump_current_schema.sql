-- Query to dump current schema structure for 'dev' schema
-- This will show all tables, columns, constraints, and relationships

-- Tables and columns
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' AS table_def
FROM pg_tables
WHERE schemaname = 'dev'
UNION ALL
SELECT 
    '    ' || column_name || ' ' || data_type || 
    CASE 
        WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
        WHEN numeric_precision IS NOT NULL THEN '(' || numeric_precision || ',' || numeric_scale || ')'
        ELSE ''
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END || ','
FROM information_schema.columns
WHERE table_schema = 'dev'
ORDER BY table_name, ordinal_position;

-- Simpler version that shows table structure
SELECT 
    t.table_name,
    array_agg(
        c.column_name || ' ' || c.data_type || 
        CASE 
            WHEN c.character_maximum_length IS NOT NULL THEN '(' || c.character_maximum_length || ')'
            WHEN c.numeric_precision IS NOT NULL THEN '(' || c.numeric_precision || ',' || c.numeric_scale || ')'
            ELSE ''
        END ||
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
        ORDER BY c.ordinal_position
    ) AS columns
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_schema = c.table_schema AND t.table_name = c.table_name
WHERE t.table_schema = 'dev'
GROUP BY t.table_name
ORDER BY t.table_name;

-- Show foreign key relationships
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'dev';

-- Show indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'dev'
ORDER BY tablename, indexname;