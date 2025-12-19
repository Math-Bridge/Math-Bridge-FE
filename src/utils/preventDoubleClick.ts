/**
 * Utility function to prevent double-click on any event handler
 * @param handler - The original event handler function
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

/**
 * Higher-order component wrapper for preventing double clicks
 * Can be used to wrap any component's onClick handler
 */
export const withPreventDoubleClick = <P extends { onClick?: (...args: any[]) => any }>(
  Component: React.ComponentType<P>,
  delay: number = 500
) => {
  return (props: P) => {
    const wrappedOnClick = props.onClick ? preventDoubleClick(props.onClick, delay) : undefined;
    return <Component {...props} onClick={wrappedOnClick} />;
  };
};

