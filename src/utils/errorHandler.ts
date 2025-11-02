import { ApiResponse } from '../services/api';

/**
 * Extract error message from API response or error object
 */
export const getErrorMessage = (error: any, defaultMessage: string = 'Đã xảy ra lỗi'): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return error.error;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  return defaultMessage;
};

/**
 * Handle API response and show toast on error
 * Returns true if success, false if error
 */
export const handleApiResponse = <T>(
  response: ApiResponse<T>,
  toast: {
    showError: (message: string) => void;
    showSuccess?: (message: string) => void;
  },
  successMessage?: string
): boolean => {
  if (!response.success) {
    const errorMsg = response.error || getErrorMessage(response, 'Đã xảy ra lỗi');
    toast.showError(errorMsg);
    return false;
  }

  if (successMessage && toast.showSuccess) {
    toast.showSuccess(successMessage);
  }

  return true;
};

/**
 * Wrap async function with error handling and toast
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  toast: {
    showError: (message: string) => void;
  },
  errorMessage: string = 'Đã xảy ra lỗi'
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    const msg = getErrorMessage(error, errorMessage);
    toast.showError(msg);
    return null;
  }
};

