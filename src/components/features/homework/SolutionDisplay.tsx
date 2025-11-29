import React from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { Sparkles } from 'lucide-react';

interface SolutionDisplayProps {
  solution: string | null;
  error: string | null;
}

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ solution, error }) => {
  if (error) {
    return (
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <p className="font-medium">Analysis Failed</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!solution) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">AI Solution</h2>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 overflow-x-auto">
        <div className="prose prose-indigo max-w-none">
          <Latex>{solution}</Latex>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        AI-generated solutions may vary. Please verify important steps.
      </div>
    </div>
  );
};

export default SolutionDisplay;
