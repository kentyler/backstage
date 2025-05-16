import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * AppTitle component
 * Displays the application title with schema information
 */
const AppTitle = () => {
  const [schema, setSchema] = useState(null);
  // Note: In Create React App, environment variables MUST start with REACT_APP_
  // Otherwise they will be undefined in the browser
  const siteTitle = process.env.REACT_APP_SITE_TITLE || 'Conversational AI';

  useEffect(() => {
    // Function to fetch schema info
    const fetchSchema = async () => {
      try {
        const response = await axios.get('/api/schema-info');
        if (response.data && response.data.schema) {
          setSchema(response.data.schema);
        }
      } catch (error) {
        console.log('Not authenticated or error fetching schema');
        // If we can't get the schema (e.g., during login), we'll just show the site title
      }
    };

    fetchSchema();
  }, []); // Only fetch once when component mounts

  return (
    <h1 className="app-title">
      {siteTitle}
      {schema && (
        <span className="schema-name">: {schema}</span>
      )}
    </h1>
  );
};

export default AppTitle;
