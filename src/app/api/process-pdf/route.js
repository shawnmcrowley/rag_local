import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// Import PDF.js with Node.js compatibility
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Configure PDF.js for Node.js environment
if (typeof window === 'undefined') {
  // We're in Node.js
  // Disable worker to use fake worker implementation
  pdfjsLib.GlobalWorkerOptions.disableWorker = true;
}

// Configuration
const OLLAMA_API_URL = 'http://localhost:11434/api/embeddings';
const MODEL_NAME = 'snowflake-artic-embed2';
const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * API route to process PDF files and generate embeddings
 */
export async function POST(request) {
  try {
    console.log('Processing PDF upload request');
    
    // Parse the form data
    const formData = await request.formData();
    const files = formData.getAll('files');
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }
    
    // Get the options
    const chunkSize = parseInt(formData.get('chunkSize')) || DEFAULT_CHUNK_SIZE;
    const overlap = parseInt(formData.get('overlap')) || DEFAULT_CHUNK_OVERLAP;
    const modelName = formData.get('modelName') || MODEL_NAME;
    
    console.log(`Processing ${files.length} files with chunk size ${chunkSize} and overlap ${overlap}`);
    
    const results = [];
    
    // Process each file
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        results.push({
          fileName: file.name,
          error: 'Not a PDF file',
          success: false
        });
        continue;
      }
      
      try {
        // Save the file temporarily
        const fileId = uuidv4();
        const filePath = path.join(UPLOADS_DIR, `${fileId}.pdf`);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        
        console.log(`Saved file ${file.name} to ${filePath}`);
        
        // Process the PDF using PDF.js
        const pdfData = await extractTextFromPdf(buffer);
        console.log(`Extracted ${pdfData.text.length} characters from ${file.name}`);
        
        // Create chunks
        const chunks = createChunks(pdfData.text, chunkSize, overlap);
        console.log(`Created ${chunks.length} chunks from ${file.name}`);
        
        // Generate embeddings
        const embeddedChunks = await generateEmbeddings(chunks, modelName);
        console.log(`Generated embeddings for ${file.name}`);
        
        // Create result object
        const result = {
          metadata: {
            fileName: file.name,
            fileSize: buffer.length,
            totalPages: pdfData.numPages,
            processedAt: new Date().toISOString(),
            model: modelName,
            chunkSize: chunkSize,
            chunkOverlap: overlap
          },
          chunks: embeddedChunks
        };
        
        // Save result to JSON file
        const jsonPath = path.join(UPLOADS_DIR, `${fileId}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
        
        // Add to results
        results.push({
          fileName: file.name,
          fileId: fileId,
          numPages: pdfData.numPages,
          numChunks: chunks.length,
          numEmbeddings: embeddedChunks.filter(c => c.embedding).length,
          jsonPath: jsonPath,
          success: true
        });
        
        // Clean up PDF file
        fs.unlinkSync(filePath);
        
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        results.push({
          fileName: file.name,
          error: error.message,
          success: false
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.filter(r => r.success).length} of ${files.length} files`,
      results: results
    });
    
  } catch (error) {
    console.error('Error processing files:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing files' },
      { status: 500 }
    );
  }
}

/**
 * Extract text from PDF using PDF.js with fallback
 */
async function extractTextFromPdf(buffer) {
  try {
    // Try using PDF.js first
    try {
      // Load the PDF document
      const data = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdfDocument = await loadingTask.promise;
      
      const numPages = pdfDocument.numPages;
      let fullText = '';
      
      // Process each page
      for (let i = 1; i <= numPages; i++) {
        console.log(`Processing page ${i}/${numPages}`);
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text from the page with better formatting
        let lastY = null;
        let text = '';
        
        for (const item of textContent.items) {
          if (lastY !== item.transform[5] && lastY !== null) {
            text += '\\n'; // New line when y-position changes
          }
          text += item.str;
          lastY = item.transform[5];
        }
        
        fullText += text + '\\n\\n';
      }
      
      return {
        text: fullText,
        numPages
      };
    } catch (pdfJsError) {
      // If PDF.js fails, try the fallback method
      console.warn('PDF.js extraction failed, using fallback method:', pdfJsError.message);
      
      // Import the fallback module
      const { extractTextWithFallback } = require('./pdf-extract-fallback');
      return await extractTextWithFallback(buffer);
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Split text into overlapping chunks
 */
function createChunks(text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP) {
  const chunks = [];
  let startIndex = 0;
  
  // Clean the text - normalize whitespace but preserve paragraph breaks
  text = text.replace(/\\s+/g, ' ').replace(/\\n\\s*\\n/g, '\\n\\n').trim();
  
  while (startIndex < text.length) {
    // Calculate end index for this chunk
    let endIndex = startIndex + chunkSize;
    
    // If we're not at the end of the text, try to find a good break point
    if (endIndex < text.length) {
      // Look for paragraph breaks first
      const paragraphBreak = text.lastIndexOf('\\n\\n', endIndex);
      if (paragraphBreak > startIndex && paragraphBreak > endIndex - 100) {
        endIndex = paragraphBreak;
      } else {
        // Look for sentence breaks
        const sentenceBreak = Math.max(
          text.lastIndexOf('. ', endIndex),
          text.lastIndexOf('! ', endIndex),
          text.lastIndexOf('? ', endIndex)
        );
        if (sentenceBreak > startIndex && sentenceBreak > endIndex - 100) {
          endIndex = sentenceBreak + 1; // Include the period
        } else {
          // Fall back to word breaks
          const wordBreak = text.lastIndexOf(' ', endIndex);
          if (wordBreak > startIndex) {
            endIndex = wordBreak;
          }
        }
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
    startIndex = endIndex - overlap;
    
    // Ensure we make progress
    if (startIndex <= chunks[chunks.length - 1]?.start) {
      startIndex = chunks[chunks.length - 1].end;
    }
  }
  
  return chunks;
}

/**
 * Generate embeddings for chunks using Ollama API
 */
async function generateEmbeddings(chunks, modelName) {
  const embeddedChunks = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
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

/**
 * API route to get a processed file
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'No fileId provided' },
        { status: 400 }
      );
    }
    
    const jsonPath = path.join(UPLOADS_DIR, `${fileId}.json`);
    
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error retrieving file:', error);
    return NextResponse.json(
      { error: error.message || 'Error retrieving file' },
      { status: 500 }
    );
  }
}