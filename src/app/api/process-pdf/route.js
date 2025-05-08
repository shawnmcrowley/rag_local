import { NextResponse } from 'next/server';

// Configure the API route for large file uploads
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

/**
 * API route to process PDF files and generate embeddings
 */
export async function POST(request) {
  try {
    console.log('Processing PDF upload request');
    
    // Parse the form data
    const formData = await request.formData();
    const pdfFile = formData.get('pdfFile');
    
    if (!pdfFile) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }
    
    // Get the options
    const chunkSize = parseInt(formData.get('chunkSize')) || 1000;
    const overlap = parseInt(formData.get('overlap')) || 200;
    const modelName = formData.get('modelName') || 'llama3.2';
    
    // Convert the file to an array buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    console.log(`Received PDF: ${pdfFile.name}, size: ${arrayBuffer.byteLength} bytes`);
    
    // In a real implementation, you would:
    // 1. Extract text from the PDF
    // 2. Split text into chunks
    // 3. Generate embeddings using Ollama
    // 4. Return the results
    
    // For demonstration purposes, we'll simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json({
      success: true,
      message: 'PDF processed successfully',
      fileSize: arrayBuffer.byteLength,
      fileName: pdfFile.name,
      options: {
        chunkSize,
        overlap,
        modelName
      },
      processingTime: '1 second (simulated)',
      // In a real implementation, you would include:
      // chunks: [...],
      // embeddings: [...]
    });
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing PDF' },
      { status: 500 }
    );
  }
}