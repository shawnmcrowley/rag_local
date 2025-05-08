/**
 * PDF Document Processor for Browser Environments
 * 
 * This module processes a PDF document, extracts text, chunks it,
 * and generates embeddings using the Ollama API.
 */

// Import PDF.js from CDN in your HTML:
// <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js"></script>
// <script>pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';</script>

class PdfProcessor {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || 1000;
    this.chunkOverlap = options.chunkOverlap || 200;
    this.ollamaApiUrl = options.ollamaApiUrl || 'http://localhost:11434/api/embeddings';
    this.modelName = options.modelName || 'snowflake-artic-embed2';
  }

  /**
   * Process a PDF file
   * @param {File|Blob} pdfFile - The PDF file object
   * @returns {Promise<Object>} - The processed result with chunks and embeddings
   */
  async processPdf(pdfFile) {
    try {
      // Extract text from PDF
      const pdfData = await this.extractTextFromPdf(pdfFile);
      
      // Create chunks
      const chunks = this.createChunks(pdfData.text);
      
      // Generate embeddings
      const embeddedChunks = await this.generateEmbeddings(chunks);
      
      // Return the result
      return {
        metadata: {
          filename: pdfFile.name,
          totalPages: pdfData.numPages,
          processedAt: new Date().toISOString(),
          model: this.modelName,
          chunkSize: this.chunkSize,
          chunkOverlap: this.chunkOverlap
        },
        chunks: embeddedChunks
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  /**
   * Extract text from a PDF file
   * @param {File|Blob} pdfFile - The PDF file object
   * @returns {Promise<Object>} - The extracted text and page count
   */
  async extractTextFromPdf(pdfFile) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          const typedArray = new Uint8Array(event.target.result);
          
          // Load the PDF document
          const loadingTask = pdfjsLib.getDocument({ data: typedArray });
          const pdfDocument = await loadingTask.promise;
          
          const numPages = pdfDocument.numPages;
          let fullText = '';
          
          // Process each page
          for (let i = 1; i <= numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            
            // Extract text from the page
            const pageText = textContent.items
              .map(item => item.str)
              .join(' ');
            
            fullText += pageText + '\n\n';
          }
          
          resolve({
            text: fullText,
            numPages
          });
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.onerror = (error) => {
        reject(error);
      };
      
      fileReader.readAsArrayBuffer(pdfFile);
    });
  }

  /**
   * Split text into overlapping chunks
   * @param {string} text - The text to chunk
   * @returns {Array<Object>} - The chunks
   */
  createChunks(text) {
    const chunks = [];
    let startIndex = 0;
    
    // Clean the text - remove excessive whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    while (startIndex < text.length) {
      // Calculate end index for this chunk
      let endIndex = startIndex + this.chunkSize;
      
      // If we're not at the end of the text, try to find a good break point
      if (endIndex < text.length) {
        // Look for a space or newline to break at
        const breakPoint = text.lastIndexOf(' ', endIndex);
        if (breakPoint > startIndex) {
          endIndex = breakPoint;
        }
      } else {
        endIndex = text.length;
      }
      
      // Extract the chunk
      const chunk = text.substring(startIndex, endIndex).trim();
      
      // Only add non-empty chunks
      if (chunk) {
        chunks.push({
          text: chunk,
          index: chunks.length,
          start: startIndex,
          end: endIndex
        });
      }
      
      // Move the start index for the next chunk, accounting for overlap
      startIndex = endIndex - this.chunkOverlap;
      
      // Ensure we make progress
      if (startIndex <= chunks[chunks.length - 1]?.start) {
        startIndex = chunks[chunks.length - 1].end;
      }
    }
    
    return chunks;
  }

  /**
   * Generate embeddings for chunks using Ollama API
   * @param {Array<Object>} chunks - The text chunks
   * @returns {Promise<Array<Object>>} - The chunks with embeddings
   */
  async generateEmbeddings(chunks) {
    const embeddedChunks = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const response = await fetch(this.ollamaApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.modelName,
            prompt: chunk.text
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        embeddedChunks.push({
          ...chunk,
          embedding: data.embedding
        });
        
      } catch (error) {
        console.error(`Error generating embedding for chunk ${i+1}:`, error.message);
        // Add the chunk without embedding
        embeddedChunks.push({
          ...chunk,
          embedding: null,
          error: error.message
        });
      }
    }
    
    return embeddedChunks;
  }
}

// Export for browser environments
if (typeof window !== 'undefined') {
  window.PdfProcessor = PdfProcessor;
}

// Export for ES modules
export default PdfProcessor;