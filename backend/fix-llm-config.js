import pkg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DB_HOST
});

async function fixLLMConfig() {
  try {
    await client.connect();
    
    // Check current client LLM config
    console.log('Current client configurations:');
    const clients = await client.query('SELECT id, name, current_llm_id FROM clients ORDER BY id');
    clients.rows.forEach(row => {
      console.log(`  Client ${row.id}: ${row.name} - LLM ID: ${row.current_llm_id}`);
    });
    
    // Check available LLMs
    console.log('\nAvailable LLMs:');
    const llms = await client.query('SELECT id, name, provider, model FROM llms ORDER BY id');
    llms.rows.forEach(row => {
      console.log(`  LLM ${row.id}: ${row.name} (${row.provider} - ${row.model})`);
    });
    
    // If client 1 has no LLM and there are LLMs available, set the first one
    const client1 = clients.rows.find(c => c.id === 1);
    if (client1 && !client1.current_llm_id && llms.rows.length > 0) {
      const firstLLM = llms.rows[0];
      console.log(`\nSetting client 1 to use LLM ${firstLLM.id}: ${firstLLM.name}`);
      
      await client.query(
        'UPDATE clients SET current_llm_id = $1 WHERE id = 1',
        [firstLLM.id]
      );
      
      console.log('✅ Client 1 LLM configuration updated!');
    } else if (llms.rows.length === 0) {
      console.log('\n❌ No LLMs found in database');
    } else {
      console.log('\n✅ Client 1 already has LLM configured');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

fixLLMConfig();