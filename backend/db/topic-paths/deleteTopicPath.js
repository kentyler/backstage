/**
 * Delete a topic path from the database.
 * TODO: In the future, we'll need to handle any posts that use this path
 * by either preventing deletion if posts exist, moving posts to a different path,
 * or implementing a soft delete system.
 */
/**
 * Delete a topic path and all its descendants from the database.
 * TODO: In the future, we'll need to handle any posts that use these paths
 * by either preventing deletion if posts exist, moving posts to a different path,
 * or implementing a soft delete system.
 */
export default async function deleteTopicPath(pool, path) {
  // Delete the path and any paths that start with this path followed by a dot
  const result = await pool.query(
    `DELETE FROM topic_paths 
     WHERE path::text = $1 
     OR path::text LIKE $2
     RETURNING id, path`,
    [path, `${path}.%`]
  );

  if (result.rowCount === 0) {
    throw new Error(`Topic path "${path}" not found`);
  }

  // Return info about what was deleted
  return {
    deletedCount: result.rowCount,
    paths: result.rows.map(row => row.path)
  };
}
