'use client';

import { useState, useRef } from 'react';
import { FiUpload, FiSettings, FiCheck, FiX, FiInfo } from 'react-icons/fi';
import FileUploader from '../components/FileUploader';
import FileList from '../components/FileList';
import ResultsTable from '../components/ResultsTable';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    chunkSize: 1000,
    overlap: 200,
    modelName: 'snowflake-artic-embed2'
  });
  const [selectedResult, setSelectedResult] = useState(null);
  const [resultData, setResultData] = useState(null);
  
  const handleFilesSelected = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };
  
  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'modelName' ? value : parseInt(value)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }
    
    setIsProcessing(true);
    setProgress(10);
    setError(null);
    setResults(null);
    
    try {
      // Create form data
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('chunkSize', settings.chunkSize);
      formData.append('overlap', settings.overlap);
      formData.append('modelName', settings.modelName);
      
      setProgress(20);
      
      // Send the files to our API
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });
      
      setProgress(90);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process PDFs');
      }
      
      const data = await response.json();
      setResults(data);
      setProgress(100);
      
    } catch (err) {
      console.error('Error processing PDFs:', err);
      setError(err.message || 'An error occurred while processing the PDFs');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetForm = () => {
    setFiles([]);
    setResults(null);
    setError(null);
    setProgress(0);
    setSelectedResult(null);
    setResultData(null);
  };
  
  const handleViewResult = async (fileId) => {
    try {
      setSelectedResult(fileId);
      
      const response = await fetch(`/api/process-pdf?fileId=${fileId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch result data');
      }
      
      const data = await response.json();
      setResultData(data);
      
    } catch (err) {
      console.error('Error fetching result data:', err);
      setError(err.message || 'An error occurred while fetching result data');
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };
  
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            PDF Processor
          </h1>
          <p className="mt-3 text-xl text-gray-500 sm:mt-4">
            Process PDFs with local Ollama embeddings
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Upload Files</h2>
                  <button
                    type="button"
                    onClick={() => setShowSettings(!showSettings)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiSettings className="mr-2" />
                    Settings
                  </button>
                </div>
                
                {showSettings && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Processing Settings</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="chunkSize" className="block text-sm font-medium text-gray-700">
                          Chunk Size
                        </label>
                        <input
                          type="number"
                          name="chunkSize"
                          id="chunkSize"
                          value={settings.chunkSize}
                          onChange={handleSettingsChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="overlap" className="block text-sm font-medium text-gray-700">
                          Chunk Overlap
                        </label>
                        <input
                          type="number"
                          name="overlap"
                          id="overlap"
                          value={settings.overlap}
                          onChange={handleSettingsChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="modelName" className="block text-sm font-medium text-gray-700">
                          Model Name
                        </label>
                        <input
                          type="text"
                          name="modelName"
                          id="modelName"
                          value={settings.modelName}
                          onChange={handleSettingsChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <FileUploader 
                  onFilesSelected={handleFilesSelected}
                  disabled={isProcessing}
                />
                
                <FileList 
                  files={files}
                  onRemoveFile={handleRemoveFile}
                  disabled={isProcessing}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <button
                  type="submit"
                  disabled={files.length === 0 || isProcessing}
                  className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    (files.length === 0 || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiUpload className="mr-2" />
                      Process {files.length} {files.length === 1 ? 'File' : 'Files'}
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isProcessing}
                >
                  Reset
                </button>
              </div>
            </form>
            
            {isProcessing && (
              <div className="mt-6">
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-blue-200">
                    <div 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600">Processing files... {progress}%</div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-6 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiX className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {results && (
          <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Results</h2>
              
              <ResultsTable 
                results={results}
                onViewResult={handleViewResult}
              />
            </div>
          </div>
        )}
        
        {resultData && (
          <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  File Details: {resultData.metadata.fileName}
                </h2>
                <button
                  onClick={() => setResultData(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Metadata</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-medium text-gray-500">File Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{resultData.metadata.fileName}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-medium text-gray-500">Pages</dt>
                    <dd className="mt-1 text-sm text-gray-900">{resultData.metadata.totalPages}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-medium text-gray-500">File Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatFileSize(resultData.metadata.fileSize)}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-medium text-gray-500">Model</dt>
                    <dd className="mt-1 text-sm text-gray-900">{resultData.metadata.model}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-medium text-gray-500">Chunk Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">{resultData.metadata.chunkSize}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-xs font-medium text-gray-500">Chunk Overlap</dt>
                    <dd className="mt-1 text-sm text-gray-900">{resultData.metadata.chunkOverlap}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Chunks ({resultData.chunks.length})</h3>
                <div className="overflow-y-auto max-h-96 border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Index</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Embedding</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resultData.chunks.slice(0, 10).map((chunk) => (
                        <tr key={chunk.index}>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{chunk.index}</td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <div className="max-w-xs truncate">{chunk.text}</div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {chunk.embedding ? (
                              <span className="text-green-600">
                                <FiCheck className="inline-block" /> Generated ({chunk.embedding.length} dimensions)
                              </span>
                            ) : (
                              <span className="text-red-600">
                                <FiX className="inline-block" /> Failed: {chunk.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {resultData.chunks.length > 10 && (
                    <div className="px-3 py-2 bg-gray-50 text-sm text-gray-500">
                      Showing 10 of {resultData.chunks.length} chunks
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            <FiInfo className="inline-block mr-1" />
            Make sure Ollama is running with the <code className="bg-gray-100 px-1 py-0.5 rounded">snowflake-artic-embed2</code> model loaded
          </p>
        </div>
      </div>
    </main>
  );
}