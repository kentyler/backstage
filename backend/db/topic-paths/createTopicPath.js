/**
 * Creates a new topic path
 * @param {string} path - The ltree path to create
 * @param {number} userId - ID of the user creating the path
 * @param {Pool} pool - The PostgreSQL connection pool to use
 * @returns {Promise<Object>} The created topic path
 */
export async function createTopicPath(path, userId, pool) {
  const result = await pool.query(
    'INSERT INTO topic_paths (path, created_by) VALUES ($1::ltree, $2) RETURNING id, path::text',
    [path, userId]
  );
  return result.rows[0];
}

export default createTopicPath;
