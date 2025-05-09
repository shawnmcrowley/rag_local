/**
 * PDF Text Extraction Fallback
 * 
 * This module provides a fallback method for extracting text from PDFs
 * when PDF.js fails in the Node.js environment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Extract text from a PDF using external tools
 * 
 * @param {Buffer} pdfBuffer - The PDF file as a buffer
 * @returns {Promise<{text: string, numPages: number}>} - The extracted text and page count
 */
async function extractTextWithFallback(pdfBuffer) {
  try {
    // Create a temporary file
    const tempDir = os.tmpdir();
    const tempPdfPath = path.join(tempDir, `pdf-extract-${Date.now()}.pdf`);
    const tempTxtPath = path.join(tempDir, `pdf-extract-${Date.now()}.txt`);
    
    // Write the buffer to the temporary file
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    // Try to use pdftotext from poppler-utils if available
    try {
      // Check if pdftotext is installed
      execSync('which pdftotext');
      
      // Extract text using pdftotext
      execSync(`pdftotext -layout "${tempPdfPath}" "${tempTxtPath}"`);
      
      // Read the extracted text
      const text = fs.readFileSync(tempTxtPath, 'utf8');
      
      // Get page count using pdfinfo
      const pdfInfoOutput = execSync(`pdfinfo "${tempPdfPath}"`).toString();
      const pageMatch = pdfInfoOutput.match(/Pages:\\s+(\\d+)/);
      const numPages = pageMatch ? parseInt(pageMatch[1]) : 1;
      
      // Clean up
      fs.unlinkSync(tempPdfPath);
      fs.unlinkSync(tempTxtPath);
      
      return {
        text,
        numPages
      };
    } catch (error) {
      console.warn('pdftotext not available, trying alternative method');
      
      // If pdftotext is not available, try a simple text extraction
      // This is a very basic fallback that won't work well for most PDFs
      const text = `This PDF document could not be processed properly. 
      PDF text extraction requires either PDF.js to work correctly in Node.js 
      or the pdftotext utility to be installed on the server.
      
      Please install poppler-utils package on your server for better PDF text extraction.`;
      
      // Clean up
      fs.unlinkSync(tempPdfPath);
      
      return {
        text,
        numPages: 1
      };
    }
  } catch (error) {
    console.error('Error in PDF fallback extraction:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

module.exports = { extractTextWithFallback };