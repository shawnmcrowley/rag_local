'use client';

import { FiCheck, FiX } from 'react-icons/fi';

export default function ResultsTable({ results, onViewResult }) {
  if (!results || !results.results || results.results.length === 0) {
    return null;
  }
  
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">File Name</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Pages</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Chunks</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Embeddings</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {results.results.map((result, index) => (
            <tr key={index} className={result.success ? '' : 'bg-red-50'}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                {result.fileName}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                {result.success ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <FiCheck className="mr-1" /> Success
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <FiX className="mr-1" /> Failed
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {result.numPages || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {result.numChunks || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {result.numEmbeddings || '-'}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                {result.success && (
                  <button
                    onClick={() => onViewResult(result.fileId)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    View
                  </button>
                )}
                {!result.success && result.error && (
                  <span className="text-red-600">{result.error}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}