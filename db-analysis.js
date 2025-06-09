import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_t2aufdmn3sbw@ep-sparkling-violet-a4j85pt4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function analyzeAvatarTables() {
  try {
    await client.connect();
    console.log('Connected to database successfully');

    // List all schemas
    console.log('\n=== Available Schemas ===');
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    console.log(schemas.rows.map(r => r.schema_name));

    // Find all tables containing 'avatar' in any schema
    console.log('\n=== Avatar-related Tables ===');
    const avatarTables = await client.query(`
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables 
      WHERE table_name ILIKE '%avatar%'
      ORDER BY table_schema, table_name
    `);
    
    for (const table of avatarTables.rows) {
      console.log(`${table.table_schema}.${table.table_name} (${table.table_type})`);
    }

    // Check participants table structure for custom_instructions
    console.log('\n=== Participants Table Structure ===');
    const participantColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'participants'
      AND table_schema = 'dev'
      ORDER BY ordinal_position
    `);
    
    for (const col of participantColumns.rows) {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    }

    // Check for foreign key relationships involving avatar tables
    console.log('\n=== Foreign Key Constraints to Avatar Tables ===');
    const fkConstraints = await client.query(`
      SELECT 
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (ccu.table_name ILIKE '%avatar%' OR tc.table_name ILIKE '%avatar%')
      ORDER BY tc.table_schema, tc.table_name
    `);
    
    for (const fk of fkConstraints.rows) {
      console.log(`${fk.table_schema}.${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_schema}.${fk.foreign_table_name}.${fk.foreign_column_name}`);
    }

  } catch (err) {
    console.error('Database error:', err.message);
  } finally {
    await client.end();
  }
}

analyzeAvatarTables();