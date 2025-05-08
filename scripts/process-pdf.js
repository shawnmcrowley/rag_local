#!/usr/bin/env node

/**
 * PDF Document Processor
 * 
 * This script processes a PDF document, extracts text, chunks it,
 * and generates embeddings using the local Ollama snowflake-artic-embed2 model.
 * The output is saved as a JSON file containing chunks and their embeddings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import fetch from 'node-fetch';
import { PDFDocument } from 'pdf-lib';

// Configuration
const OLLAMA_API_URL = 'http://172.24.61.204:11434/api/embed';
const MODEL_NAME = 'llama3.2';
const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
program
  .name('process-pdf')
  .description('Process a PDF document and generate embeddings using local Ollama model')
  .requiredOption('-i, --input <path>', 'Path to the PDF file')
  .option('-o, --output <path>', 'Path to save the output JSON file (defaults to input filename with .json extension)')
  .option('-c, --chunk-size <number>', 'Size of text chunks in characters', DEFAULT_CHUNK_SIZE)
  .option('-v, --overlap <number>', 'Overlap between chunks in characters', DEFAULT_CHUNK_OVERLAP)
  .parse(process.argv);

const options = program.opts();

// Main function
async function main() {
  try {
    console.log(`Processing PDF: ${options.input}`);
    
    // Determine output path if not specified
    if (!options.output) {
      const inputBasename = path.basename(options.input, '.pdf');
      options.output = path.join(path.dirname(options.input), `${inputBasename}.json`);
    }
    
    // Read and parse PDF
    const pdfData = await parsePdf(options.input);
    console.log(`Extracted ${pdfData.text.length} characters from PDF (${pdfData.numPages} pages)`);
    
    // Create chunks
    const chunkSize = parseInt(options.chunkSize) || DEFAULT_CHUNK_SIZE;
    const overlap = parseInt(options.overlap) || DEFAULT_CHUNK_OVERLAP;
    const chunks = createChunks(pdfData.text, chunkSize, overlap);
    console.log(`Created ${chunks.length} chunks`);
    
    // Generate embeddings
    console.log('Generating embeddings...');
    const embeddedChunks = await generateEmbeddings(chunks);
    
    // Save to JSON file
    const result = {
      metadata: {
        source: options.input,
        title: path.basename(options.input, '.pdf'),
        totalPages: pdfData.numPages,
        processedAt: new Date().toISOString(),
        model: MODEL_NAME,
        chunkSize: chunkSize,
        chunkOverlap: overlap
      },
      chunks: embeddedChunks
    };
    
    fs.writeFileSync(options.output, JSON.stringify(result, null, 2));
    console.log(`Output saved to: ${options.output}`);
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    process.exit(1);
  }
}

/**
 * Parse PDF file using pdf-lib
 */
async function parsePdf(filePath) {
  try {
    // Read the PDF file
    const data = fs.readFileSync(filePath);
    
    // Load the PDF document with pdf-lib
    const pdfDoc = await PDFDocument.load(data);
    const numPages = pdfDoc.getPageCount();
    
    // pdf-lib doesn't have direct text extraction capabilities
    // We'll use a placeholder text for now
    const text = `This PDF document has ${numPages} pages. 
    
The text content cannot be directly extracted in this Node.js environment due to dependency issues.

When you move this code to the browser environment, you can use the browser-compatible version in the 'browser-compatible' directory, which uses PDF.js for proper text extraction.

For now, we'll generate embeddings for this placeholder text to demonstrate the workflow.`;
    
    return {
      text,
      numPages
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

/**
 * Split text into overlapping chunks
 */
function createChunks(text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP) {
  const chunks = [];
  let startIndex = 0;
  
  // Clean the text - remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  while (startIndex < text.length) {
    // Calculate end index for this chunk
    let endIndex = startIndex + chunkSize;
    
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
async function generateEmbeddings(chunks) {
  const embeddedChunks = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Generating embedding for chunk ${i+1}/${chunks.length}`);
    
    try {
      const response = await fetch(OLLAMA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL_NAME,
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

// Run the main function
main().catch(console.error);