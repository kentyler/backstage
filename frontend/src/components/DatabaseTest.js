import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import './DatabaseTest.css';

function DatabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [tables, setTables] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM participants LIMIT 10');
  const [loading, setLoading] = useState({
    connection: false,
    tables: false,
    query: false
  });
  const [error, setError] = useState(null);

  const testConnection = async () => {
    setLoading(prev => ({ ...prev, connection: true }));
    setError(null);
    
    try {
      const result = await apiService.testDbConnection();
      setConnectionStatus(result);
    } catch (err) {
      console.error('DB Connection test error:', err);
      setError(`Connection error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, connection: false }));
    }
  };

  const fetchTables = async () => {
    setLoading(prev => ({ ...prev, tables: true }));
    setError(null);
    
    try {
      const result = await apiService.getDbTables();
      setTables(result);
    } catch (err) {
      console.error('Fetch tables error:', err);
      setError(`Tables error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, tables: false }));
    }
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;
    
    setLoading(prev => ({ ...prev, query: true }));
    setError(null);
    
    try {
      const result = await apiService.executeDbQuery(sqlQuery);
      setQueryResult(result);
    } catch (err) {
      console.error('Query execution error:', err);
      setError(`Query error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, query: false }));
    }
  };

  // Converts query results to a displayable format
  const formatQueryResults = (result) => {
    if (!result || !result.result || !result.result.rows) {
      return <p>No results</p>;
    }

    const rows = result.result.rows;
    if (rows.length === 0) {
      return <p>Query returned no rows</p>;
    }

    // Get headers from the first row's keys
    const headers = Object.keys(rows[0]);

    return (
      <div className="query-results">
        <p>Rows returned: {result.result.rowCount}</p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map(header => (
                    <td key={`${rowIndex}-${header}`}>
                      {row[header] !== null ? 
                        (typeof row[header] === 'object' ? 
                          JSON.stringify(row[header]) : 
                          String(row[header])
                        ) : 
                        'NULL'
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="database-test">
      <h2>Database Connection Test</h2>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <div className="test-panel">
        <div className="test-section">
          <h3>Connection Test</h3>
          <button 
            onClick={testConnection} 
            disabled={loading.connection}
          >
            {loading.connection ? 'Testing...' : 'Test Connection'}
          </button>
          
          {connectionStatus && (
            <div className={`test-result ${connectionStatus.success ? 'success' : 'failure'}`}>
              <p><strong>Status:</strong> {connectionStatus.success ? 'Connected' : 'Failed'}</p>
              {connectionStatus.timestamp && (
                <p><strong>Server time:</strong> {new Date(connectionStatus.timestamp).toLocaleString()}</p>
              )}
              <p><strong>Message:</strong> {connectionStatus.message}</p>
              {connectionStatus.error && <p><strong>Error:</strong> {connectionStatus.error}</p>}
            </div>
          )}
        </div>
        
        <div className="test-section">
          <h3>Database Tables</h3>
          <button 
            onClick={fetchTables} 
            disabled={loading.tables}
          >
            {loading.tables ? 'Loading...' : 'Get Tables'}
          </button>
          
          {tables && tables.success && (
            <div className="test-result success">
              <p><strong>Total tables:</strong> {tables.count}</p>
              <ul className="tables-list">
                {tables.tables.map((table, i) => (
                  <li key={i}>
                    <strong>{table.table_name}</strong> 
                    <span className="column-count">({table.column_count} columns)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {tables && !tables.success && (
            <div className="test-result failure">
              <p><strong>Error:</strong> {tables.error || tables.message}</p>
            </div>
          )}
        </div>
        
        <div className="test-section query-section">
          <h3>Execute Query</h3>
          <p className="note">Only SELECT queries are allowed for security.</p>
          
          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            placeholder="Enter SQL SELECT query..."
            rows={3}
          />
          
          <button 
            onClick={executeQuery} 
            disabled={loading.query || !sqlQuery.trim()}
          >
            {loading.query ? 'Executing...' : 'Execute Query'}
          </button>
          
          {queryResult && (
            <div className={`test-result ${queryResult.success ? 'success' : 'failure'}`}>
              {queryResult.success ? (
                formatQueryResults(queryResult)
              ) : (
                <p><strong>Error:</strong> {queryResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DatabaseTest;
