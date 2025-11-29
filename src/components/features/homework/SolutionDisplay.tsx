import React from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { Sparkles, Lightbulb } from 'lucide-react';

interface SolutionDisplayProps {
  solution: string | null;
  hint?: string | string[] | null;
  error: string | null;
}

const cleanHintText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\\n/g, ' ') // Replace literal '\n' with a space
    .replace(/\b(x){2,}\b/g, '$1') // Replace 'xx' with 'x'
    .replace(/(\b.{3,})\1\b/g, '$1'); // Remove immediate repetition of 3+ chars (e.g., 'x=3x=3')
};

const processHintText = (text: string) => {
  // First clean common AI artifacts
  const cleaned = cleanHintText(text);
  // Split by $ delimiters to separate text from existing math segments
  const parts = cleaned.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  
  return parts.map(part => {
    // If this part is already wrapped in $, return it as is
    if (part.startsWith('$')) return part;
    
    // Otherwise, look for un-delimited LaTeX commands in this text segment
    // We strictly look for commands that start with \ followed by a known math keyword
    return part.replace(/(\\(?:frac|lim|infty|to|cdot|sqrt|sum|int|left|right)(?:\{[^}]*\})*(?:\{[^}]*\})?)/g, '$$$1$$');
  }).join('');
};

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
            <div className="w-full">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Hint</h3>
              <div className="text-sm text-yellow-700 space-y-2">
                {Array.isArray(hint) ? (
                  <ul className="list-disc list-inside space-y-1">
                    {hint.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                         <span className="inline-block align-top">
                            <Latex>{processHintText(item)}</Latex>
                         </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {typeof hint === 'string' && (hint.match(/\d+\./) || hint.match(/Step\s+\d+:/) || hint.includes('\n')) ? (
                      <ul className="list-none space-y-2">
                        {(() => {
                          // Determine split strategy based on content
                          let splitRegex;
                          if (hint.match(/Step\s+\d+:/)) {
                             splitRegex = /(?=Step\s+\d+:)/;
                          } else if (hint.match(/^\s*\d+\./m)) {
                             splitRegex = /(?=\d+\.)/;
                          } else {
                             splitRegex = /\n/;
                          }
                          
                          return hint.split(splitRegex).map((step, idx) => (
                              step.trim() && (
                                <li key={idx} className="flex gap-2">
                                  <Latex>{processHintText(step.trim())}</Latex>
                                </li>
                              )
                          ));
                        })()}
                      </ul>
                    ) : (
                      <Latex>{processHintText(hint)}</Latex>
                    )}
                  </div>
                )}
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
