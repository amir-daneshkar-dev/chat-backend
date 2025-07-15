import React, { useCallback, useState } from 'react';
import { Upload, X, File, Image } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUpload: (file: File) => Promise<void>;
  acceptedTypes?: string[];
  maxSize?: number;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onUpload,
  acceptedTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  maxSize = 10 * 1024 * 1024, // 10MB
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > maxSize) {
      alert(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  }, [maxSize, onFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await onUpload(selectedFile);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [selectedFile, onUpload]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {!selectedFile ? (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
            ${dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop a file here, or click to select
          </p>
          <input
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            Choose File
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Maximum file size: {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedFile.type.startsWith('image/') ? (
                <Image className="h-8 w-8 text-blue-500" />
              ) : (
                <File className="h-8 w-8 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;