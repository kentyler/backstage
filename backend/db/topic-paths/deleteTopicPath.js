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
  try {
    console.log(`Attempting to delete topic path: ${path}`);
    
    // First, check if the path exists
    const checkResult = await pool.query(
      'SELECT id FROM topic_paths WHERE path::text = $1',
      [path]
    );
    
    if (checkResult.rowCount === 0) {
      console.log(`Topic path not found: ${path}`);
      throw new Error(`Topic path "${path}" not found`);
    }
    
    console.log(`Found topic path to delete: ${path}`);
    
    // Delete the path and any paths that start with this path followed by a dot
    const result = await pool.query(
      `DELETE FROM topic_paths 
       WHERE path::text = $1 
       OR path::text LIKE $2
       RETURNING id, path`,
      [path, `${path}.%`]
    );

    if (result.rowCount === 0) {
      // This should theoretically never happen since we checked above
      console.error(`Failed to delete topic path (no rows affected): ${path}`);
      throw new Error(`Failed to delete topic path "${path}"`);
    }

    console.log(`Successfully deleted ${result.rowCount} topic path(s)`);
    
    // Return info about what was deleted
    return {
      deletedCount: result.rowCount,
      paths: result.rows.map(row => row.path)
    };
  } catch (error) {
    console.error('Error in deleteTopicPath:', {
      error: error.message,
      path,
      stack: error.stack
    });
    throw error; // Re-throw to be handled by the route handler
  }
}
