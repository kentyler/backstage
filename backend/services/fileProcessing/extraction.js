/**
 * Content Extraction Service
 * 
 * Handles text extraction from various file types including
 * text files, PDFs, CSV, JSON, and DOCX files.
 */

import { extname } from 'path';
import { parse as parseCsv } from 'csv-parse/sync';

/**
 * Extract text content from a file based on its MIME type
 * 
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string|null>} - Extracted text or null if extraction failed
 */
export async function extractText(filePath, mimeType) {
  try {
    // Handle different file types
    if (mimeType.startsWith('text/')) {
      // Text files: TXT, HTML, etc.
      return extractFromTextFile(filePath);
    } else if (mimeType === 'application/pdf') {
      // PDF files
      return extractFromPdf(filePath);
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // DOCX files
      return extractFromDocx(filePath);
    } else if (mimeType === 'application/csv' || mimeType === 'text/csv') {
      // CSV files
      return extractFromCsv(filePath);
    } else if (mimeType === 'application/json') {
      // JSON files
      return extractFromJson(filePath);
    } else {
      console.log(`Unsupported file type for text extraction: ${mimeType}`);
      return null;
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    return null;
  }
}

/**
 * Extract text from a plain text file
 * 
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromTextFile(filePath) {
  const fs = await import('fs/promises');
  return fs.readFile(filePath, 'utf8');
}

/**
 * Extract text from a PDF file
 * 
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromPdf(filePath) {
  try {
    // This is a placeholder - in a real implementation, you would use a PDF parsing library
    // For example, using pdf-parse:
    // const pdf = require('pdf-parse');
    // const dataBuffer = fs.readFileSync(filePath);
    // const data = await pdf(dataBuffer);
    // return data.text;
    
    // For now, return a placeholder message
    console.log(`Mock: Extracting text from PDF ${filePath}`);
    return "This is placeholder text extracted from a PDF file.";
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return null;
  }
}

/**
 * Extract text from a DOCX file
 * 
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromDocx(filePath) {
  try {
    // This is a placeholder - in a real implementation, you would use a DOCX parsing library
    // For example, using mammoth:
    // const mammoth = require('mammoth');
    // const result = await mammoth.extractRawText({path: filePath});
    // return result.value;
    
    // For now, return a placeholder message
    console.log(`Mock: Extracting text from DOCX ${filePath}`);
    return "This is placeholder text extracted from a DOCX file.";
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    return null;
  }
}

/**
 * Extract text from a CSV file
 * 
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromCsv(filePath) {
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Parse CSV
    const records = parseCsv(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Convert to text format
    let result = '';
    for (const record of records) {
      // Build a text representation of each row
      const row = Object.entries(record)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      result += row + '\n';
    }
    
    return result;
  } catch (error) {
    console.error('Error extracting text from CSV:', error);
    return null;
  }
}

/**
 * Extract text from a JSON file
 * 
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromJson(filePath) {
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Parse JSON and convert to formatted string
    const data = JSON.parse(fileContent);
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error extracting text from JSON:', error);
    return null;
  }
}

/**
 * Split text into chunks with overlap
 * 
 * @param {string} text - Text to chunk
 * @param {number} maxChunkSize - Maximum size for each chunk
 * @param {number} chunkOverlap - Overlap between chunks
 * @returns {string[]} - Array of text chunks
 */
export function chunkText(text, maxChunkSize = 1000, chunkOverlap = 100) {
  if (!text) return [];
  
  const chunks = [];
  let currentPosition = 0;
  
  while (currentPosition < text.length) {
    // Calculate end position for this chunk
    const endPosition = Math.min(
      currentPosition + maxChunkSize,
      text.length
    );
    
    // Extract chunk
    const chunk = text.substring(currentPosition, endPosition);
    chunks.push(chunk);
    
    // Move position forward, accounting for overlap
    currentPosition = endPosition - chunkOverlap;
    
    // Ensure we make progress even with small texts
    if (currentPosition <= 0) {
      currentPosition = endPosition;
    }
  }
  
  return chunks;
}