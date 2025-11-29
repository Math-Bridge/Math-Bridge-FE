import React from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { Sparkles, Lightbulb } from 'lucide-react';

interface SolutionDisplayProps {
  solution: string | null;
  hint?: string | null;
  error: string | null;
}

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ solution, hint, error }) => {
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
    <div className="mt-8 animate-fade-in space-y-6">
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Problem Statement</h2>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 overflow-x-auto">
          <div className="prose prose-indigo max-w-none text-lg space-y-4">
            {solution.split(/(?:\\quad|\\\\)/).map((part, index) => (
              <div key={index}>
                <Latex>{`$$${part.trim()}$$`}</Latex>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hint && (
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Hint</h3>
              <div className="mt-1 text-sm text-yellow-700 prose prose-sm max-w-none">
                <Latex>{hint}</Latex>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center">
        AI has identified the problem and provided a hint to help you solve it.
      </div>
    </div>
  );
};

export default SolutionDisplay;
