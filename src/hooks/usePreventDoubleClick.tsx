import { useRef, useCallback } from 'react';

/**
 * Hook to prevent double-click on buttons and other clickable elements
 * @param delay - Delay in milliseconds before allowing another click (default: 500ms)
 * @returns A wrapped onClick handler that prevents double clicks
 */
export const usePreventDoubleClick = (delay: number = 500) => {
  const lastClickTime = useRef<number>(0);
  const isProcessing = useRef<boolean>(false);

  const preventDoubleClick = useCallback(
    <T extends (...args: any[]) => any>(
      handler: T
    ): ((...args: Parameters<T>) => void) => {
      return (...args: Parameters<T>) => {
        const now = Date.now();
        const timeSinceLastClick = now - lastClickTime.current;

        // If clicked too soon or already processing, ignore the click
        if (timeSinceLastClick < delay || isProcessing.current) {
          return;
        }

        lastClickTime.current = now;
        isProcessing.current = true;

        // Execute the handler
        const result = handler(...args);

        // If handler returns a promise, wait for it to complete
        if (result instanceof Promise) {
          result
            .finally(() => {
              setTimeout(() => {
                isProcessing.current = false;
              }, delay);
            })
            .catch(() => {
              // Reset on error
              setTimeout(() => {
                isProcessing.current = false;
              }, delay);
            });
        } else {
          // Reset after delay for synchronous handlers
          setTimeout(() => {
            isProcessing.current = false;
          }, delay);
        }
      };
    },
    [delay]
  );

  return preventDoubleClick;
};

/**
 * Higher-order function to wrap onClick handlers and prevent double clicks
 * @param handler - The original onClick handler
 * @param delay - Delay in milliseconds before allowing another click (default: 500ms)
 * @returns Wrapped handler that prevents double clicks
 */
export const preventDoubleClick = <T extends (...args: any[]) => any>(
  handler: T,
  delay: number = 500
): ((...args: Parameters<T>) => void) => {
  let lastClickTime = 0;
  let isProcessing = false;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // If clicked too soon or already processing, ignore the click
    if (timeSinceLastClick < delay || isProcessing) {
      return;
    }

    lastClickTime = now;
    isProcessing = true;

    // Execute the handler
    const result = handler(...args);

    // If handler returns a promise, wait for it to complete
    if (result instanceof Promise) {
      result
        .finally(() => {
          setTimeout(() => {
            isProcessing = false;
          }, delay);
        })
        .catch(() => {
          // Reset on error
          setTimeout(() => {
            isProcessing = false;
          }, delay);
        });
    } else {
      // Reset after delay for synchronous handlers
      setTimeout(() => {
        isProcessing = false;
      }, delay);
    }
  };
};

