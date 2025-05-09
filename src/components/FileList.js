'use client';

import { FiFile, FiX } from 'react-icons/fi';

export default function FileList({ files, onRemoveFile, disabled }) {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };
  
  if (files.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({files.length})</h3>
      <ul className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
        {files.map((file, index) => (
          <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
            <div className="w-0 flex-1 flex items-center">
              <FiFile className="flex-shrink-0 h-5 w-5 text-gray-400" />
              <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
            </div>
            <div className="ml-4 flex-shrink-0 flex items-center">
              <span className="text-xs text-gray-500 mr-4">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="font-medium text-red-600 hover:text-red-500"
                disabled={disabled}
              >
                <FiX />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}