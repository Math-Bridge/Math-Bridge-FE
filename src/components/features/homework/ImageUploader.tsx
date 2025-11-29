import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  onImageCleared: () => void;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, onImageCleared, isLoading }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | undefined) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageSelected(file);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileChange(file);
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageCleared();
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onInputChange}
        accept="image/*"
        className="hidden"
        disabled={isLoading}
      />

      {!previewUrl ? (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragOver={!isLoading ? handleDragOver : undefined}
          onDragLeave={!isLoading ? handleDragLeave : undefined}
          onDrop={!isLoading ? handleDrop : undefined}
          onClick={!isLoading ? triggerFileInput : undefined}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Upload Homework Image</h3>
            <p className="text-sm text-gray-500">
              Drag & drop or click to select an image
            </p>
            <p className="text-xs text-gray-400">
              Supports JPG, PNG, WEBP
            </p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
           <div className="relative aspect-video md:aspect-auto md:h-80 flex items-center justify-center bg-black/5">
             <img
               src={previewUrl}
               alt="Homework Preview"
               className="max-w-full max-h-full object-contain"
             />
           </div>
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white text-gray-700 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/60 rounded-full text-white text-xs flex items-center">
              <ImageIcon className="w-3 h-3 mr-1.5" />
              Image Selected
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
