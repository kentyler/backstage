import pkg from 'pg';
import 'dotenv/config';          // loads DATABASE_URL

const { Client } = pkg;          // <- the trick

const client = new Client({
  connectionString: process.env.DB_HOST,
  ssl: { rejectUnauthorized: false },   // Neon requires SSL
});

try {
  await client.connect();
  const { rows } = await client.query('select current_database(), now()');
  console.log('✅  Connected to', rows[0].current_database, 'at', rows[0].now);
} catch (err) {
  console.error('❌  Connection failed\n', err);
} finally {
  await client.end();
}
