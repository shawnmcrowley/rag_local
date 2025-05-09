/**
 * PDF.js Worker Setup for Node.js
 * 
 * This file sets up the PDF.js worker for Node.js environments.
 * It should be imported before any PDF.js operations.
 */

const path = require('path');
const fs = require('fs');

// Configure PDF.js worker
function setupPdfWorker() {
  try {
    // Import PDF.js
    const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
    
    // Set the worker source to the local file
    const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.js');
    
    if (fs.existsSync(workerPath)) {
      console.log(`PDF.js worker found at: ${workerPath}`);
      pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
    } else {
      console.warn(`PDF.js worker not found at: ${workerPath}`);
      // Try alternative locations
      const alternatives = [
        path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.js'),
        path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'lib', 'pdf.worker.js')
      ];
      
      for (const alt of alternatives) {
        if (fs.existsSync(alt)) {
          console.log(`Using alternative PDF.js worker at: ${alt}`);
          pdfjs.GlobalWorkerOptions.workerSrc = alt;
          return;
        }
      }
      
      // If we get here, we couldn't find a worker
      console.error('Could not find PDF.js worker file. PDF processing may fail.');
    }
  } catch (error) {
    console.error('Error setting up PDF.js worker:', error);
  }
}

// Run the setup
setupPdfWorker();

module.exports = { setupPdfWorker };