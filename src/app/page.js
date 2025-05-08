'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid PDF file');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a PDF file');
      return;
    }
    
    setIsProcessing(true);
    setProgress(10);
    setError(null);
    setResult(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('pdfFile', file);
      formData.append('chunkSize', 1000);
      formData.append('overlap', 200);
      formData.append('modelName', 'snowflake-artic-embed2');
      
      setProgress(20);
      
      // Send the file to our API
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });
      
      setProgress(90);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process PDF');
      }
      
      const data = await response.json();
      setResult(data);
      setProgress(100);
      
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError(err.message || 'An error occurred while processing the PDF');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">PDF Processor</h1>
        
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label">
                Select PDF File:
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="form-input"
                disabled={isProcessing}
              />
            </div>
            
            {file && (
              <div className="mb-4 text-sm">
                Selected file: <span className="font-semibold">{file.name}</span> ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <button
                type="submit"
                disabled={!file || isProcessing}
                className={`btn btn-primary ${
                  (!file || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? 'Processing...' : 'Process PDF'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
                disabled={isProcessing}
              >
                Reset
              </button>
            </div>
          </form>
          
          {isProcessing && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Processing PDF... {progress}%</p>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
        
        {result && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Results</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 font-mono text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}