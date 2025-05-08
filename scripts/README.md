# PDF Processing Scripts

This directory contains scripts for processing PDF documents, extracting text, chunking it, and generating embeddings using the local Ollama snowflake-artic-embed2 model.

## Prerequisites

- Node.js (v14 or later)
- Ollama running locally with the `snowflake-artic-embed2` model installed

## Installation

1. Make sure you have Ollama installed and running:
   ```
   ollama run snowflake-artic-embed2
   ```

2. Install the required dependencies:
   ```
   npm install
   ```

## Available Scripts

### 1. Main Script (PDF.js-based)

Uses Mozilla's PDF.js library to extract text from PDFs:

```bash
node scripts/process-pdf.js --input /path/to/document.pdf
```

### 2. Simple Script (pdftotext-based)

Uses the command-line `pdftotext` utility for text extraction:

```bash
node scripts/simple-pdf-extract.js --input /path/to/document.pdf
```

## Options

Both scripts support the following options:

- `-i, --input <path>`: Path to the PDF file (required)
- `-o, --output <path>`: Path to save the output JSON file (defaults to input filename with .json extension)
- `-c, --chunk-size <number>`: Size of text chunks in characters (default: 1000)
- `-v, --overlap <number>`: Overlap between chunks in characters (default: 200)

## Example

```bash
node scripts/process-pdf.js --input documents/sample.pdf --output embeddings/sample.json --chunk-size 1500 --overlap 300
```

## Browser-Compatible Version

A browser-compatible version is available in the `browser-compatible` directory. This version:

1. Uses PDF.js directly in the browser
2. Provides a reusable `PdfProcessor` class
3. Includes a demo HTML page

To use the browser version:

1. Open `scripts/browser-compatible/index.html` in a browser
2. Make sure Ollama is running locally
3. Upload a PDF file and process it

You can also integrate the `PdfProcessor` class into your own web applications:

```html
<!-- Include PDF.js -->
<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js"></script>
<script>
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
</script>

<!-- Use the PDF processor -->
<script type="module">
  import PdfProcessor from './pdf-processor.js';
  
  const processor = new PdfProcessor({
    chunkSize: 1000,
    chunkOverlap: 200,
    modelName: 'snowflake-artic-embed2'
  });
  
  // Process a PDF file
  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const result = await processor.processPdf(file);
    console.log(result);
  });
</script>
```

## Output Format

The scripts generate a JSON file with the following structure:

```json
{
  "metadata": {
    "source": "path/to/document.pdf",
    "title": "document",
    "totalPages": 10,
    "processedAt": "2023-06-15T12:34:56.789Z",
    "model": "snowflake-artic-embed2",
    "chunkSize": 1000,
    "chunkOverlap": 200
  },
  "chunks": [
    {
      "text": "Content of the first chunk...",
      "index": 0,
      "start": 0,
      "end": 1000,
      "embedding": [0.1, 0.2, 0.3, ...]
    },
    {
      "text": "Content of the second chunk...",
      "index": 1,
      "start": 800,
      "end": 1800,
      "embedding": [0.2, 0.3, 0.4, ...]
    }
  ]
}
```

## Troubleshooting

### PDF.js Issues

If you encounter issues with the PDF.js-based script, try the simpler `simple-pdf-extract.js` script which uses the command-line `pdftotext` utility.

### Ollama Connection

Make sure Ollama is running and the model is loaded:

```bash
ollama list
ollama run snowflake-artic-embed2
```

The scripts connect to Ollama at `http://localhost:11434`.