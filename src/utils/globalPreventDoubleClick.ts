/**
 * Global solution to prevent double-click on all buttons
 * This should be called once when the app initializes
 */
export const initGlobalPreventDoubleClick = (delay: number = 500) => {
  // Track clicks per button element
  const buttonClickTimes = new WeakMap<HTMLElement, number>();
  const buttonProcessingStates = new WeakMap<HTMLElement, boolean>();

  // Add event listener to document to catch all button clicks
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement;
      
      // Check if the clicked element is a button or has a button ancestor
      const button = target.closest('button') as HTMLButtonElement;
      if (!button) return;

      // Skip if button is already disabled by default
      if (button.hasAttribute('disabled') && button.getAttribute('disabled') !== 'false') {
        return;
      }

      // Skip buttons with data-no-double-click-prevention attribute
      if (button.hasAttribute('data-no-double-click-prevention')) {
        return;
      }

      const now = Date.now();
      const lastClickTime = buttonClickTimes.get(button) || 0;
      const timeSinceLastClick = now - lastClickTime;
      const isProcessing = buttonProcessingStates.get(button) || false;

      // If same button clicked too soon or already processing, prevent the click
      if (timeSinceLastClick < delay || isProcessing) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      // Update tracking for this specific button
      buttonClickTimes.set(button, now);
      buttonProcessingStates.set(button, true);

      // Store original state
      const originalDisabled = button.disabled;
      const originalPointerEvents = button.style.pointerEvents;
      const originalOpacity = button.style.opacity;
      const originalCursor = button.style.cursor;

      // Temporarily disable the button visually
      button.style.pointerEvents = 'none';
      button.style.opacity = '0.7';
      button.style.cursor = 'not-allowed';

      // Re-enable after delay
      setTimeout(() => {
        button.disabled = originalDisabled;
        button.style.pointerEvents = originalPointerEvents;
        button.style.opacity = originalOpacity;
        button.style.cursor = originalCursor;
        buttonProcessingStates.set(button, false);
      }, delay);
    },
    true // Use capture phase to catch events early
  );
};

