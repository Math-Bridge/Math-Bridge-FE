import { apiClient } from './apiClient';

export interface AnalyzeHomeworkResponse {
  latex: string;
  hint?: string | string[];
}

/**
 * Uploads an image to be analyzed by the AI Homework Helper.
 * @param file - The image file to upload.
 * @returns A promise that resolves to the analysis result (LaTeX string and hint).
 */
export const analyzeHomeworkImage = async (file: File): Promise<AnalyzeHomeworkResponse> => {
  const response = await apiClient.uploadFile<any>('/Homework/analyze', file);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to analyze homework image.');
  }

  let data = response.data;

  // If data is a string, try to parse it as JSON
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse response data as JSON", data);
      // If parsing fails, return it as is, maybe it's just a string message
    }
  }
  
  // If the API returns the result wrapped in a 'result' property (handling legacy/wrapper)
  if (data.result && typeof data.result === 'object') {
    return data.result;
  }

  return data;
};
