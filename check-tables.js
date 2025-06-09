import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_t2aufdmn3sbw@ep-sparkling-violet-a4j85pt4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkTables() {
  try {
    await client.connect();
    
    // List all tables
    const tables = await client.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_type = 'BASE TABLE' 
        AND table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name
    `);
    
    console.log('All tables:');
    tables.rows.forEach(row => {
      console.log(`${row.table_schema}.${row.table_name}`);
    });
    
    // Look specifically for preference tables
    const prefTables = await client.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_name LIKE '%preference%'
      ORDER BY table_schema, table_name
    `);
    
    console.log('\nPreference tables:');
    prefTables.rows.forEach(row => {
      console.log(`${row.table_schema}.${row.table_name}`);
    });
    
    // Check columns of any preference tables
    for (const table of prefTables.rows) {
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [table.table_schema, table.table_name]);
      
      console.log(`\nColumns for ${table.table_schema}.${table.table_name}:`);
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTables();