/**
 * Update a topic path in the database.
 * TODO: In the future, we'll need to handle any posts that use this path
 * by updating their paths as well.
 */
export default async function updateTopicPath(pool, oldPath, newPath) {
  // First check if the new path already exists
  const existingPath = await pool.query(
    'SELECT id FROM topic_paths WHERE path::text = $1',
    [newPath]
  );

  if (existingPath.rowCount > 0) {
    throw new Error(`Topic path "${newPath}" already exists`);
  }

  // Update the path and any paths that start with this path followed by a dot
  const result = await pool.query(
    `UPDATE topic_paths 
     SET path = 
       CASE 
         WHEN path::text = $1 THEN $2::ltree
         ELSE ($2::ltree || subpath(path, nlevel($1::ltree)))::ltree
       END
     WHERE path::text = $1 
     OR path::text LIKE $3
     RETURNING id, path`,
    [oldPath, newPath, `${oldPath}.%`]
  );

  if (result.rowCount === 0) {
    throw new Error(`Topic path "${oldPath}" not found`);
  }

  // Return info about what was updated
  return {
    updatedCount: result.rowCount,
    paths: result.rows.map(row => row.path)
  };
}
