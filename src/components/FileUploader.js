'use client';

import { useState, useRef } from 'react';
import { FiFile, FiFolder, FiX } from 'react-icons/fi';

export default function FileUploader({ onFilesSelected, disabled }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const pdfFiles = Array.from(e.dataTransfer.files).filter(
        file => file.type === 'application/pdf'
      );
      
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      }
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const pdfFiles = Array.from(e.target.files).filter(
        file => file.type === 'application/pdf'
      );
      
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      }
    }
  };
  
  const handleButtonClick = (type) => {
    if (type === 'file') {
      fileInputRef.current.click();
    } else {
      folderInputRef.current.click();
    }
  };
  
  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } transition-colors duration-200 text-center`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <FiFile className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Drag and drop your PDF files here
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Or select files using the buttons below
            </p>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <button
              type="button"
              onClick={() => handleButtonClick('file')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={disabled}
            >
              <FiFile className="-ml-0.5 mr-2 h-4 w-4" />
              Select Files
            </button>
            <button
              type="button"
              onClick={() => handleButtonClick('folder')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={disabled}
            >
              <FiFolder className="-ml-0.5 mr-2 h-4 w-4" />
              Select Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}