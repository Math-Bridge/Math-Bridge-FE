import React, { useState } from 'react';
import { testGeminiConnection } from '../../services/gemini-test';

const GeminiDiagnostic: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    setTestResult('Running diagnostic...\n');
    
    try {
      const success = await testGeminiConnection();
      if (success) {
        setTestResult(prev => prev + '\n✅ All tests passed! Your Gemini API is working correctly.');
      } else {
        setTestResult(prev => prev + '\n❌ Tests failed. Check the browser console for details.');
      }
    } catch (error) {
      setTestResult(prev => prev + `\n❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-20 bg-white p-4 rounded-lg shadow-lg border-2 border-yellow-400 z-50">
      <h3 className="font-bold text-lg mb-2">🔧 Gemini API Diagnostic</h3>
      <p className="text-sm text-gray-600 mb-3">
        Test your Gemini API connection
      </p>
      <button
        onClick={runTest}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Testing...' : 'Run Diagnostic Test'}
      </button>
      {testResult && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
          {testResult}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">
        Check browser console (F12) for detailed logs
      </p>
    </div>
  );
};

export default GeminiDiagnostic;

