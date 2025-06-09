/**
 * Delete a topic path from the database.
 * TODO: In the future, we'll need to handle any posts that use this path
 * by either preventing deletion if posts exist, moving posts to a different path,
 * or implementing a soft delete system.
 */
/**
 * Delete a topic path and all its descendants from the database for a specific group.
 * TODO: In the future, we'll need to handle any posts that use these paths
 * by either preventing deletion if posts exist, moving posts to a different path,
 * or implementing a soft delete system.
 */
export default async function deleteTopicPath(pool, path, groupId) {
  try {
    console.log(`Attempting to delete topic path: ${path} in group ${groupId}`);
    
    // First, check if the path exists - being careful with escaping for paths with dots
    // Using ILIKE for case-insensitive matching to be more forgiving
    console.log(`Checking for exact path match: "${path}" in group ${groupId}`);
    const checkResult = await pool.query(
      'SELECT id, path::text AS path_text FROM topic_paths WHERE path::text ILIKE $1 AND group_id = $2',
      [path, groupId]
    );
    
    // Log all found paths for debugging
    console.log(`Found ${checkResult.rowCount} matches:`, checkResult.rows.map(r => r.path_text));
    
    if (checkResult.rowCount === 0) {
      console.log(`Topic path not found: ${path}`);
      const error = new Error(`Topic path "${path}" not found`);
      error.code = 'TOPIC_PATH_NOT_FOUND';
      error.status = 404;
      error.context = { path };
      throw error;
    }
    
    console.log(`Found topic path to delete: ${path}`);
    
    // Get the ID of the matching path to ensure exact deletion by ID
    const pathId = checkResult.rows[0].id;
    console.log(`Using ID-based deletion for path ID: ${pathId}`);
    
    // Delete by ID to avoid any issues with text representation
    // Also handle descendant paths separately to avoid issues with dot escaping
    const result = await pool.query(
      `DELETE FROM topic_paths 
       WHERE group_id = $1 AND (id = $2 OR path::text ILIKE $3 || '.%')
       RETURNING id, path::text as path_text`,
      [groupId, pathId, path]
    );

    if (result.rowCount === 0) {
      // This should theoretically never happen since we checked above
      console.error(`Failed to delete topic path (no rows affected): ${path}`);
      throw new Error(`Failed to delete topic path "${path}"`);
    }

    console.log(`Successfully deleted ${result.rowCount} topic path(s)`);
    
    console.log(`Deletion result:`, result.rows);
    
    // Return info about what was deleted
    return {
      deletedCount: result.rowCount,
      paths: result.rows.map(row => row.path_text)
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
