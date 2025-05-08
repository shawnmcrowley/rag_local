#!/usr/bin/env node

/**
 * Simple PDF text extractor using pdf-parse
 * 
 * This is a simpler alternative to the main script that uses pdf-parse
 * instead of pdf.js for PDF text extraction.
 */

import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import fetch from 'node-fetch';
import { execSync } from 'child_process';

// Configuration
const OLLAMA_API_URL = 'http://localhost:11434/api/embeddings';
const MODEL_NAME = 'snowflake-artic-embed2';
const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;

// Parse command line arguments
program
  .name('simple-pdf-extract')
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
    
    // Extract text using pdftotext (poppler-utils)
    console.log('Extracting text from PDF...');
    const text = extractTextFromPdf(options.input);
    console.log(`Extracted ${text.length} characters from PDF`);
    
    // Create chunks
    const chunkSize = parseInt(options.chunkSize) || DEFAULT_CHUNK_SIZE;
    const overlap = parseInt(options.overlap) || DEFAULT_CHUNK_OVERLAP;
    const chunks = createChunks(text, chunkSize, overlap);
    console.log(`Created ${chunks.length} chunks`);
    
    // Generate embeddings
    console.log('Generating embeddings...');
    const embeddedChunks = await generateEmbeddings(chunks);
    
    // Save to JSON file
    const result = {
      metadata: {
        source: options.input,
        title: path.basename(options.input, '.pdf'),
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
 * Extract text from PDF using pdftotext command-line tool
 */
function extractTextFromPdf(filePath) {
  try {
    // Check if pdftotext is installed
    try {
      execSync('which pdftotext');
    } catch (error) {
      throw new Error('pdftotext not found. Please install poppler-utils package.');
    }
    
    // Extract text using pdftotext
    const tempFile = path.join('/tmp', `${path.basename(filePath, '.pdf')}.txt`);
    execSync(`pdftotext -layout "${filePath}" "${tempFile}"`);
    
    // Read the extracted text
    const text = fs.readFileSync(tempFile, 'utf8');
    
    // Clean up
    fs.unlinkSync(tempFile);
    
    return text;
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