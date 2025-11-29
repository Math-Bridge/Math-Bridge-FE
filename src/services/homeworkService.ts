import api from '../utils/api';
import { AxiosError } from 'axios';

export interface AnalyzeHomeworkResponse {
  latex: string;
  hint?: string;
}

/**
 * Uploads an image to be analyzed by the AI Homework Helper.
 * @param file - The image file to upload.
 * @returns A promise that resolves to the analysis result (LaTeX string and hint).
 */
export const analyzeHomeworkImage = async (file: File): Promise<AnalyzeHomeworkResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<AnalyzeHomeworkResponse>('/Homework/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.message || 'Failed to analyze homework image.');
    }
    throw error;
  }
};
