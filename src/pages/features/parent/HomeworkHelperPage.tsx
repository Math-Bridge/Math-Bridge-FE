import React, { useState } from 'react';
import ImageUploader from '../../../components/features/homework/ImageUploader';
import SolutionDisplay from '../../../components/features/homework/SolutionDisplay';
import { analyzeHomeworkImage } from '../../../services/homeworkService';
import { Loader2 } from 'lucide-react';

const HomeworkHelperPage: React.FC = () => {
  const [solution, setSolution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageSelected = (file: File) => {
    setSelectedFile(file);
    setSolution(null);
    setError(null);
  };

  const handleImageCleared = () => {
    setSelectedFile(null);
    setSolution(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setSolution(null);

    try {
      const response = await analyzeHomeworkImage(selectedFile);
      // Assuming the response has a 'result' field which contains the LaTeX string
      // Adjust this based on the actual API response structure if needed
      setSolution(response.result || 'No solution found.');
    } catch (err: any) {
      console.error("Homework analysis error:", err);
      setError(err.message || 'An unexpected error occurred while analyzing the image.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Homework Helper
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Upload a photo of a math problem and get an instant step-by-step solution.
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-2xl overflow-hidden p-6 md:p-8">
          <ImageUploader
            onImageSelected={handleImageSelected}
            onImageCleared={handleImageCleared}
            isLoading={isLoading}
          />

          {selectedFile && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleAnalyze}
                disabled={isLoading}
                className={`flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoading
                    ? 'bg-indigo-400 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Problem'
                )}
              </button>
            </div>
          )}

          <SolutionDisplay solution={solution} error={error} />
        </div>
      </div>
    </div>
  );
};

export default HomeworkHelperPage;
