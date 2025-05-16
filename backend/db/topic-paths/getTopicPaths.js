/**
 * Get all topic paths sorted by path
 * @param {Pool} pool - The PostgreSQL connection pool to use
 * @returns {Promise<Array>} Array of topic paths
 */
export async function getTopicPaths(pool) {
  const result = await pool.query(
    'SELECT id, path::text FROM topic_paths ORDER BY path'
  );
  return result.rows;
}

export default getTopicPaths;
